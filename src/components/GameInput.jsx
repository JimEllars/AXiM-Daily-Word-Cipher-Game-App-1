import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const GameInput = ({ 
  currentGuess, 
  setCurrentGuess, 
  submitGuess, 
  dictionary, 
  disabled 
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

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
      <input
        ref={inputRef}
        type="text"
        maxLength={5}
        disabled={disabled}
        placeholder={dictionary.placeholder}
        value={currentGuess}
        onChange={(e) => setCurrentGuess(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
        onKeyDown={handleKeyDown}
        className="bg-black border-2 border-neon-pink text-neon-pink p-3 text-lg md:text-xl text-center uppercase font-mono w-full outline-none focus:shadow-neon-pink transition-shadow disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      />
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