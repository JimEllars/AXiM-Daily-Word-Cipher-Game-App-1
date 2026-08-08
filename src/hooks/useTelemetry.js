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
          if (res.status === 429 || res.status >= 500) {
            throw new Error('Rate limit or Server error');
          }
          // Do not queue for 400 errors
          return;
        }
      } catch (e) {
        // Fail silently so that network telemetry drops never disrupt gameplay
        console.warn(`[AXiM Telemetry] Dropped event: ${eventName}. Queuing for retry.`);
        try {
          const queue = JSON.parse(localStorage.getItem('axim_telemetry_retry_queue') || '[]');
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

          while(queue.length > 50) {
            queue.shift();
          }

          localStorage.setItem('axim_telemetry_retry_queue', JSON.stringify(queue));
        } catch (storageError) {
          console.warn('[AXiM Telemetry] Failed to queue event', storageError);
        }
      }
    })();
  }, []);

  const flushRetryQueue = useCallback(async () => {
    try {
      const queue = JSON.parse(localStorage.getItem('axim_telemetry_retry_queue') || '[]');
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
        localStorage.setItem('axim_telemetry_retry_queue', JSON.stringify(failedQueue));
      } else {
        localStorage.removeItem('axim_telemetry_retry_queue');
        trackEvent('OFFLINE_SYNC_FLUSHED', { type: 'telemetry_sync', count: queue.length });
      }
    } catch (err) {
      console.warn('[AXiM Telemetry] Error processing queue:', err);
    }
  }, [trackEvent]);

  useEffect(() => {
    const queue = JSON.parse(localStorage.getItem('axim_telemetry_retry_queue') || '[]');
    if (navigator.onLine && queue.length > 0) {
      flushRetryQueue();
    }
  }, [flushRetryQueue]);

  useEffect(() => {
    window.addEventListener('online', flushRetryQueue);
    return () => window.removeEventListener('online', flushRetryQueue);
  }, [flushRetryQueue]);

  return { trackEvent, flushRetryQueue };
};
