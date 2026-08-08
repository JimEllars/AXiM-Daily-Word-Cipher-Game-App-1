import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GameBoard = ({ guesses, currentGuess, targetWord, onForfeit, gameOver, startPracticeGame, isPracticeMode, skipPracticeWord, isWiping, nextPuzzle, hasWon, score }) => {
  const [hint, setHint] = useState(null);
  const [displayedHint, setDisplayedHint] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [hintError, setHintError] = useState(false);

  const [showForfeitModal, setShowForfeitModal] = useState(false);
  const turnstileContainerRef = useRef(null);
  const boardRef = useRef(null);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [isTurnstileRequired, setIsTurnstileRequired] = useState(false);


  useEffect(() => {
    if (boardRef.current) {
      boardRef.current.scrollTop = boardRef.current.scrollHeight;
    }
  }, [guesses]);

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


  useEffect(() => {
    if (hint && isTyping) {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayedHint(hint.slice(0, i + 1));
        i++;
        if (i >= hint.length) {
          setIsTyping(false);
          clearInterval(interval);
        }
      }, 40); // 40ms per character
      return () => clearInterval(interval);
    }
  }, [hint, isTyping]);

  const fetchHint = () => {
    setIsHintLoading(true);
    setHintError(false);
    setIsTurnstileRequired(true);
  };

  const executeFetchHint = async (token) => {
    try {
      const response = await fetch(import.meta.env.BASE_URL + 'api/hint/today', {
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
      setDisplayedHint("");
      setIsTyping(true);
    } catch (error) {
      console.error(error);
      setHintError(true);
    } finally {
      setIsHintLoading(false);
      setIsTurnstileRequired(false);
      setTurnstileToken(null);
    }
  };

  const WORD_LENGTH = 5;

  const renderTile = (letter, status, index) => {
    let bgColor = 'bg-black/50';
    let borderColor = 'border-gray-800';
    let textColor = 'text-white';

    if (status === 'correct') {
      bgColor = 'bg-tile-correct';
      borderColor = 'border-neon-green';
    } else if (status === 'present') {
      bgColor = 'bg-tile-present';
      borderColor = 'border-yellow-400';
    } else if (status === 'absent') {
      bgColor = 'bg-tile-absent';
      borderColor = 'border-gray-700';
      textColor = 'text-gray-500';
    }

    return (
      <motion.div
        key={index}
        initial={status ? { rotateX: 90 } : false}
        animate={status ? { rotateX: 0 } : false}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className={`w-12 h-12 md:w-14 md:h-14 border-2 flex justify-center items-center text-2xl font-bold uppercase ${bgColor} ${borderColor} ${textColor}`}
      >
        {letter}
      </motion.div>
    );
  };

  const getStatus = (guess, index) => {
    const letter = guess[index];
    if (targetWord[index] === letter) return 'correct';
    if (targetWord.includes(letter)) return 'present';
    return 'absent';
  };

    return (
    <div className="flex flex-col items-center h-full justify-center min-h-0 w-full">
      <div aria-live="polite" className="sr-only">
        {guesses.length > 0 ? `Guess ${guesses.length} submitted.` : 'Game started.'}
        {gameOver && (hasWon ? ' You won!' : ' Game over.')}
      </div>
      <div ref={boardRef} className={`grid gap-2 mb-4 overflow-y-auto [&::-webkit-scrollbar]:hidden ${isWiping ? 'animate-terminal-wipe' : ''}`} style={{ maxHeight: "100%", scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {guesses.map((guess, rowIdx) => (
          <div key={`row-${rowIdx}`} className="flex gap-2">
            {guess.split('').map((letter, colIdx) =>
              renderTile(letter, getStatus(guess, colIdx), colIdx)
            )}
          </div>
        ))}

        {/* Current active row (only if not won/lost yet) */}
        {!gameOver && (
        <div className="flex gap-2">
          {Array.from({ length: targetWord?.length || 5 }).map((_, colIdx) => {
            const letter = currentGuess[colIdx] || '';
            return renderTile(letter, null, colIdx);
          })}
        </div>
        )}
      </div>

            <div className="mb-6 flex gap-4">
        <AnimatePresence>
          {guesses.length >= 4 && !hint && !isHintLoading && !hintError && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={fetchHint}
              className="py-2 px-4 border-2 border-yellow-400 text-yellow-400 font-cyber text-sm font-bold shadow-[0_0_10px_rgba(250,204,21,0.5),_0_0_20px_rgba(250,204,21,0.3)] hover:bg-yellow-400 hover:text-black transition-all"
            >
              [ REQUEST AI DECRYPTION HINT ]
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!gameOver && !isPracticeMode && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForfeitModal(true)}
              className="py-2 px-4 border-2 border-red-500 text-red-500 font-cyber text-sm font-bold shadow-[0_0_10px_rgba(239,68,68,0.5),_0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-500 hover:text-white transition-all"
            >
              [ FORFEIT & REVEAL CIPHER ]
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!gameOver && isPracticeMode && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={skipPracticeWord}
              className="py-2 px-4 border-2 border-yellow-500 text-yellow-500 font-cyber text-sm font-bold shadow-[0_0_10px_rgba(234,179,8,0.5),_0_0_20px_rgba(234,179,8,0.3)] hover:bg-yellow-500 hover:text-black transition-all"
            >
              [ SKIP CIPHER ]
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gameOver && !isPracticeMode && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={startPracticeGame}
              className="py-2 px-4 border-2 border-neon-green text-neon-green font-cyber text-sm font-bold shadow-[0_0_10px_rgba(0,255,157,0.5),_0_0_20px_rgba(0,255,157,0.3)] hover:bg-neon-green hover:text-black transition-all"
            >
              [ PLAY AGAIN ]
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gameOver && isPracticeMode && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={nextPuzzle}
              className="py-2 px-4 border-2 border-neon-green text-neon-green font-cyber text-sm font-bold shadow-[0_0_10px_rgba(0,255,157,0.5),_0_0_20px_rgba(0,255,157,0.3)] hover:bg-neon-green hover:text-black transition-all"
            >
              [ NEXT CIPHER → (+{hasWon ? score : 0} POINTS) ]
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isHintLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-6 text-yellow-400 font-cyber text-sm animate-pulse"
          >
            DECRYPTING SIGNAL...
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 max-w-sm w-full p-4 border-l-4 border-yellow-400 bg-yellow-400/10"
          >
            <div className="text-yellow-400 font-cyber text-xs mb-2">SYSTEM.AI_HINT //</div>
            <div className="text-white italic text-sm font-mono">
              "{displayedHint}"{isTyping && <span className="animate-pulse">_</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
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

      <AnimatePresence>
        {showForfeitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black border-2 border-red-500 p-6 max-w-sm w-full mx-4 shadow-[0_0_30px_rgba(239,68,68,0.3)] text-center"
            >
              <div className="text-red-500 font-cyber text-lg mb-4 animate-pulse">
                [ SYSTEM WARNING ]
              </div>
              <p className="text-white font-mono text-sm mb-8">
                ABORT DECRYPTION? You will receive 25 participation points.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setShowForfeitModal(false)}
                  className="py-2 px-4 border border-gray-500 text-gray-300 font-cyber text-sm hover:bg-gray-800 transition-all"
                >
                  [ CANCEL ]
                </button>
                <button
                  onClick={() => {
                    setShowForfeitModal(false);
                    onForfeit();
                  }}
                  className="py-2 px-4 bg-red-500 text-black font-cyber text-sm font-bold hover:bg-red-400 transition-all shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                >
                  [ CONFIRM ABORT ]
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={turnstileContainerRef} className="hidden" />
    </div>
  );
};

export default GameBoard;
