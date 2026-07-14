import React from 'react';
import { motion } from 'framer-motion';

const GameInput = ({ 
  currentGuess, 
  setCurrentGuess, 
  submitGuess, 
  dictionary, 
  disabled 
}) => {
  // Native input removed

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (currentGuess.length === 5) {
        submitGuess(currentGuess);
      } else {
        alert(dictionary.invalid);
      }
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm px-4">
      {/* Native input removed to prevent OS keyboard on mobile */}
      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.05, filter: disabled ? "none" : "brightness(1.2)" }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        onClick={() => {
          if (currentGuess.length === 5) submitGuess(currentGuess);
          else alert(dictionary.invalid);
        }}
        disabled={disabled}
        className="bg-neon-green text-black border-none py-3 px-6 text-base font-bold font-mono cursor-pointer shadow-neon-green w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {dictionary.submitBtn}
      </motion.button>
    </div>
  );
};

export default GameInput;