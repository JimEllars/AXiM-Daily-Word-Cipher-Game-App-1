import React from 'react';
import { motion } from 'framer-motion';

const StatsPanel = ({ score, streak, time, dictionary }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-dark border-[3px] border-double border-neon-green p-4 w-full max-w-xl flex justify-around mb-8 shadow-panel text-sm md:text-base text-shadow-neon"
    >
      <div className="flex flex-col items-center">
        <span className="text-gray-400 text-xs mb-1 uppercase">{dictionary.score}</span>
        <span className="font-bold text-white">{score}</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-gray-400 text-xs mb-1 uppercase">{dictionary.streak}</span>
        <span className="font-bold text-neon-pink">{streak} 🔥</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-gray-400 text-xs mb-1 uppercase">{dictionary.time}</span>
        <span className="font-bold text-white">{time}s</span>
      </div>
    </motion.div>
  );
};

export default StatsPanel;