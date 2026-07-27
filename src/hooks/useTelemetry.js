import { useCallback } from 'react';

export const useTelemetry = () => {
  const trackEvent = useCallback((eventName, payload = {}) => {
    // In the future, this is where we'd add Mixpanel, Amplitude, etc.
    console.log(`[AXiM Telemetry] ${eventName} | Data:`, JSON.stringify(payload));
  }, []);

  return { trackEvent };
};
