import React from 'react';
import { motion } from 'framer-motion';

const Instructions = ({ isOpen, onClose, dict }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-surface-dark border-2 border-neon-pink shadow-neon-pink p-8 max-w-lg w-full font-mono text-sm leading-relaxed"
      >
        <h2 className="text-white font-cyber text-lg mb-6 text-center text-shadow-neon-pink underline">{dict.instructions}</h2>
        
        <div className="space-y-4 text-gray-300">
          <p>1. Decrypt the <span className="text-neon-green">5-LETTER CIPHER</span> of the day.</p>
          <p>2. <span className="text-neon-green">UNLIMITED TRIES</span> allowed, but every attempt and every second lowers your terminal priority (Score).</p>
          <p>3. Colors signify signal strength:</p>
          <div className="flex flex-col gap-2 pl-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-tile-correct border border-neon-green"></div>
              <span>Correct position</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-tile-present border border-yellow-400"></div>
              <span>Wrong position</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-tile-absent border border-gray-700"></div>
              <span>Signal interference (Absent)</span>
            </div>
          </div>
          <p>4. Solving before score hits zero grants <span className="text-neon-pink">AXM TOKENS</span>.</p>
          <p>5. Consecutive daily wins boost your <span className="text-neon-pink">STREAK MULTIPLIER</span>.</p>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 py-3 bg-neon-pink text-white font-bold shadow-neon-pink hover:brightness-110 transition-all uppercase"
        >
          Initialize Game
        </button>
      </motion.div>
    </div>
  );
};

export default Instructions;