import React from 'react';
import { motion } from 'framer-motion';
import { FiDelete } from 'react-icons/fi';

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
];

const Keyboard = ({ guesses, targetWord, onKeyPress }) => {
  const getKeyStatus = (key) => {
    let status = 'unused';
    for (const guess of guesses) {
      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === key) {
          if (targetWord[i] === key) {
            return 'correct'; // Priority to correct
          }
          if (status !== 'correct' && targetWord.includes(key)) {
            status = 'present';
          }
          if (status === 'unused' && !targetWord.includes(key)) {
            status = 'absent';
          }
        }
      }
    }
    return status;
  };

  const getKeyColor = (status) => {
    switch (status) {
      case 'correct': return 'bg-neon-green/20 border-neon-green text-neon-green shadow-[0_0_10px_rgba(0,255,102,0.3)]';
      case 'present': return 'bg-yellow-400/20 border-yellow-400 text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.3)]';
      case 'absent': return 'bg-gray-800/50 border-gray-700 text-gray-500';
      default: return 'bg-surface-dark border-neon-green/30 text-white hover:border-neon-green/80';
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-2 p-2 mb-4">
      {KEYBOARD_ROWS.map((row, rowIdx) => (
        <div key={rowIdx} className="flex justify-center gap-1 sm:gap-2">
          {row.map((key) => {
            const isEnter = key === 'ENTER';
            const isBackspace = key === 'BACKSPACE';
            const status = isEnter || isBackspace ? 'special' : getKeyStatus(key);
            const colorClass = isEnter || isBackspace
              ? 'bg-surface-dark border-neon-pink/50 text-neon-pink hover:border-neon-pink shadow-[0_0_5px_rgba(255,0,127,0.3)]'
              : getKeyColor(status);

            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.9 }}
                onClick={() => onKeyPress(key)}
                className={`
                  flex items-center justify-center font-bold border-2 rounded-sm
                  transition-colors select-none
                  ${isEnter || isBackspace ? 'px-2 sm:px-4 text-xs sm:text-sm' : 'w-8 sm:w-10 text-sm sm:text-base'}
                  h-12 sm:h-14 ${colorClass}
                `}
              >
                {isBackspace ? <FiDelete size={20} /> : key}
              </motion.button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;
