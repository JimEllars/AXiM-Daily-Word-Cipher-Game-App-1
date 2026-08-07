import React, { useEffect, useRef, useState } from 'react';

const TurnstileWidget = ({ onVerify }) => {
  const containerRef = useRef(null);
  const [widgetId, setWidgetId] = useState(null);

  useEffect(() => {
    // Inject Turnstile script if not present
    if (!document.getElementById('turnstile-script')) {
      const script = document.createElement('script');
      script.id = 'turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const renderWidget = () => {
      if (window.turnstile && containerRef.current && !widgetId) {
        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: import.meta.env.VITE_TURNSTILE_SITEKEY || '1x00000000000000000000AA', // Use env variable with fallback
            callback: function(token) {
              onVerify(token);
            },
            theme: 'dark'
          });
          setWidgetId(id);
        } catch(e) {
          console.error("Turnstile render error", e);
        }
      }
    };

    // Check if turnstile is already loaded
    if (window.turnstile) {
      renderWidget();
    } else {
      // Poll for it
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 500);
      return () => clearInterval(interval);
    }

    return () => {
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [onVerify, widgetId]);

  return <div ref={containerRef} className="my-4 flex justify-center"></div>;
};

export default TurnstileWidget;
