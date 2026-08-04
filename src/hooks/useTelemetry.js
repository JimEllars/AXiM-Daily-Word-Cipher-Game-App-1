import { useCallback, useEffect } from 'react';

export const useTelemetry = () => {
  const trackEvent = useCallback((eventName, payload = {}) => {
    if (payload.practiceMode) {
      eventName = `PRACTICE_${eventName}`;
    }

    console.log(`[AXiM Telemetry] ${eventName} | Data:`, JSON.stringify(payload));

    const eventPayload = {
      event_name: eventName,
      user_id: payload.user_id || payload.wallet_address || "anonymous",
      is_practice: payload.practiceMode ? 1 : 0,
      timestamp: Date.now(),
      metadata: payload
    };

    // Async fetch wrapper that fails silently
    (async () => {
      try {
        if (!navigator.onLine) {
          throw new Error('Offline');
        }

        const res = await fetch(`${import.meta.env.BASE_URL}api/telemetry`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventPayload),
        });

        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
      } catch (e) {
        // Fail silently so that network telemetry drops never disrupt gameplay
        console.warn(`[AXiM Telemetry] Dropped event: ${eventName}. Queuing for retry.`);
        try {
          const queue = JSON.parse(localStorage.getItem('axim_telemetry_queue') || '[]');
          queue.push(eventPayload);

          if (eventName !== 'OFFLINE_SYNC_QUEUED') {
            queue.push({
              event_name: 'OFFLINE_SYNC_QUEUED',
              user_id: payload.user_id || payload.wallet_address || "anonymous",
              is_practice: payload.practiceMode ? 1 : 0,
              timestamp: Date.now(),
              metadata: { type: 'telemetry_sync' }
            });
          }

          localStorage.setItem('axim_telemetry_queue', JSON.stringify(queue));
        } catch (storageError) {
          console.warn('[AXiM Telemetry] Failed to queue event', storageError);
        }
      }
    })();
  }, []);

  const processQueue = useCallback(async () => {
    try {
      const queue = JSON.parse(localStorage.getItem('axim_telemetry_queue') || '[]');
      if (queue.length === 0) return;

      const failedQueue = [];

      for (const item of queue) {
        try {
          const res = await fetch(`${import.meta.env.BASE_URL}api/telemetry`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item),
          });
          if (!res.ok) throw new Error('Failed to send');
        } catch (e) {
          failedQueue.push(item);
        }
      }

      if (failedQueue.length > 0) {
        localStorage.setItem('axim_telemetry_queue', JSON.stringify(failedQueue));
      } else {
        localStorage.removeItem('axim_telemetry_queue');
        trackEvent('OFFLINE_SYNC_FLUSHED', { type: 'telemetry_sync', count: queue.length });
      }
    } catch (err) {
      console.warn('[AXiM Telemetry] Error processing queue:', err);
    }
  }, [trackEvent]);

  useEffect(() => {
    const queue = JSON.parse(localStorage.getItem('axim_telemetry_queue') || '[]');
    if (navigator.onLine && queue.length > 0) {
      processQueue();
    }
  }, [processQueue]);

  useEffect(() => {
    window.addEventListener('online', processQueue);
    return () => window.removeEventListener('online', processQueue);
  }, [processQueue]);

  return { trackEvent };
};
