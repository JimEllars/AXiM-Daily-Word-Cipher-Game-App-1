import React from 'react';
import { motion } from 'framer-motion';

const StatsPanel = ({ score, streak, lifetimePracticeScore, gamesWon, dictionary }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-dark/90 backdrop-blur-sm border-[3px] border-double border-neon-green/40 shadow-[0_0_15px_rgba(0,255,102,0.15)] p-4 w-full max-w-xl flex flex-col items-center justify-around mb-8 text-sm md:text-base text-shadow-neon"
    >
      <div className="flex justify-around w-full">
        <div className="flex flex-col items-center">
          <span className="text-gray-400 text-xs mb-1 uppercase">Score</span>
          <motion.span
            key={score}
            initial={{ scale: 1.5, color: '#fff' }}
            animate={{ scale: 1, color: '#fff' }}
            className="font-bold text-white"
          >
            {score}
          </motion.span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-gray-400 text-xs mb-1 uppercase">Daily Streak</span>
          <motion.span
            key={streak}
            initial={{ scale: 1.5, color: '#ff007f' }}
            animate={{ scale: 1, color: '#ff007f' }}
            className="font-bold text-neon-pink"
          >
            {streak} 🔥
          </motion.span>
        </div>
        {lifetimePracticeScore !== undefined && (
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-xs mb-1 uppercase">Practice Score</span>
            <motion.span
              key={lifetimePracticeScore}
              initial={{ scale: 1.5, color: '#00f3ff' }}
              animate={{ scale: 1, color: '#00f3ff' }}
              className="font-bold text-neon-blue"
            >
              {lifetimePracticeScore}
            </motion.span>
          </div>
        )}
        {gamesWon !== undefined && (
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-xs mb-1 uppercase">Games Won</span>
            <motion.span
              key={gamesWon}
              initial={{ scale: 1.5, color: '#00ff66' }}
              animate={{ scale: 1, color: '#00ff66' }}
              className="font-bold text-neon-green"
            >
              {gamesWon}
            </motion.span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatsPanel;
