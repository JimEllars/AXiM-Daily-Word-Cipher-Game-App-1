import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GameBoard = ({ guesses, currentGuess, targetWord }) => {
  const [hint, setHint] = useState(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [hintError, setHintError] = useState(false);

  const fetchHint = async () => {
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
    <div className="flex flex-col items-center">
      <div className="grid gap-2 mb-8">
        {guesses.map((guess, rowIdx) => (
          <div key={`row-${rowIdx}`} className="flex gap-2">
            {guess.split('').map((letter, colIdx) =>
              renderTile(letter, getStatus(guess, colIdx), colIdx)
            )}
          </div>
        ))}

        {/* Current active row (only if not won/lost yet) */}
        <div className="flex gap-2">
          {Array.from({ length: WORD_LENGTH }).map((_, colIdx) => {
            const letter = currentGuess[colIdx] || '';
            return renderTile(letter, null, colIdx);
          })}
        </div>
      </div>

      <AnimatePresence>
        {guesses.length >= 4 && !hint && !isHintLoading && !hintError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6"
          >
            <button
              onClick={fetchHint}
              className="py-2 px-4 border-2 border-yellow-400 text-yellow-400 font-cyber text-sm font-bold shadow-[0_0_10px_rgba(250,204,21,0.5),_0_0_20px_rgba(250,204,21,0.3)] hover:bg-yellow-400 hover:text-black transition-all"
            >
              [ REQUEST AI DECRYPTION HINT ]
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
            <div className="text-white italic text-sm">"{hint}"</div>
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
            ERROR: SIGNAL INTERCEPTED
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameBoard;
