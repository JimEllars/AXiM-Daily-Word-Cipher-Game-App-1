const fs = require('fs');

let content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');

const importsOld = `import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';`;

const importsNew = `import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';`;

content = content.replace(importsOld, importsNew);

const fetchOld = `  const fetchHint = async () => {
    setIsHintLoading(true);
    setHintError(false);
    try {
      const response = await fetch('/api/hint/today');
      if (!response.ok) throw new Error('Failed to fetch hint');
      const data = await response.json();
      setHint(data.hint);
    } catch (error) {
      console.error(error);
      setHintError(true);
    } finally {
      setIsHintLoading(false);
    }
  };`;

const fetchNew = `  const turnstileContainerRef = useRef(null);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [isTurnstileRequired, setIsTurnstileRequired] = useState(false);

  useEffect(() => {
    if (isTurnstileRequired && !window.turnstileScriptLoaded) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      window.turnstileScriptLoaded = true;
    }
  }, [isTurnstileRequired]);

  useEffect(() => {
    let widgetId = null;
    if (isTurnstileRequired && turnstileContainerRef.current) {
      const renderWidget = () => {
        if (window.turnstile && turnstileContainerRef.current) {
          try {
            widgetId = window.turnstile.render(turnstileContainerRef.current, {
              sitekey: '1x00000000000000000000AA', // Dummy key for testing
              callback: function(token) {
                setTurnstileToken(token);
              },
              theme: 'dark'
            });
          } catch(e) {
            console.error("Turnstile render error", e);
          }
        }
      };

      if (window.turnstile) {
        renderWidget();
      } else {
        const interval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(interval);
            renderWidget();
          }
        }, 500);
        return () => clearInterval(interval);
      }
    }
    return () => {
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [isTurnstileRequired]);

  useEffect(() => {
    if (turnstileToken && isHintLoading) {
      executeFetchHint(turnstileToken);
    }
  }, [turnstileToken]);

  const fetchHint = () => {
    setIsHintLoading(true);
    setHintError(false);
    setIsTurnstileRequired(true);
  };

  const executeFetchHint = async (token) => {
    try {
      const response = await fetch('/api/hint/today', {
        headers: {
          'X-Turnstile-Token': token
        }
      });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Turnstile timeout');
        }
        throw new Error('Failed to fetch hint');
      }
      const data = await response.json();
      setHint(data.hint);
    } catch (error) {
      console.error(error);
      setHintError(true);
    } finally {
      setIsHintLoading(false);
      setIsTurnstileRequired(false);
      setTurnstileToken(null);
    }
  };`;

content = content.replace(fetchOld, fetchNew);

// Add turnstile container and update hintError message
const errorOld = `      <AnimatePresence>
        {hintError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 text-red-500 font-cyber text-xs"
          >
            ERROR: SIGNAL INTERCEPTED
          </motion.div>
        )}
      </AnimatePresence>`;

const errorNew = `      <AnimatePresence>
        {hintError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 text-red-500 font-cyber text-xs"
          >
            [ AI LINK SEVERED - RETRY ]
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={turnstileContainerRef} className="hidden" />`;

content = content.replace(errorOld, errorNew);

fs.writeFileSync('src/components/GameBoard.jsx', content);
