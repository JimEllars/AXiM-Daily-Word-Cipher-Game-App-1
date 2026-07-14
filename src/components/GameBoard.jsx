import React from 'react';
import { motion } from 'framer-motion';

const GameBoard = ({ guesses, currentGuess, targetWord }) => {
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
  );
};

export default GameBoard;