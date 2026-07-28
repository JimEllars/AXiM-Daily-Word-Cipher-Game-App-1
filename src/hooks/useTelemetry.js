import { useCallback } from 'react';

export const useTelemetry = () => {
  const trackEvent = useCallback((eventName, payload = {}) => {
    console.log(`[AXiM Telemetry] ${eventName} | Data:`, JSON.stringify(payload));

    // Async fetch wrapper that fails silently
    (async () => {
      try {
        await fetch('/api/telemetry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventName,
            payload,
          }),
        });
      } catch (e) {
        // Fail silently so that network telemetry drops never disrupt gameplay
        console.warn(`[AXiM Telemetry] Dropped event: ${eventName}`);
      }
    })();
  }, []);

  return { trackEvent };
};
