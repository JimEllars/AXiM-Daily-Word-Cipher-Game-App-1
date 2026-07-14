import React from 'react';
import { motion } from 'framer-motion';

const BADGE_DEFS = {
  genesis: { label: "GENESIS WIN", icon: "👾" },
  speed_demon: { label: "SPEED DEMON", icon: "⚡" },
  flawless: { label: "FLAWLESS", icon: "🎯" },
  streak_3: { label: "3x STREAK", icon: "🔥" }
};

const BadgesPanel = ({ unlockedBadges, title }) => {
  return (
    <div className="mt-12 w-full max-w-2xl px-4 flex flex-col items-center">
      <h3 className="text-white font-cyber text-xs mb-4 opacity-80">{title}</h3>
      <div className="flex flex-wrap gap-3 justify-center">
        {Object.entries(BADGE_DEFS).map(([id, def]) => {
          const isUnlocked = unlockedBadges.includes(id);
          return (
            <motion.div
              key={id}
              initial={false}
              animate={isUnlocked ? { scale: [1, 1.1, 1] } : {}}
              className={`
                px-3 py-2 text-xs border rounded-sm flex items-center gap-2 font-mono
                ${isUnlocked 
                  ? 'border-neon-pink text-neon-pink bg-neon-pink/10 shadow-neon-pink opacity-100' 
                  : 'border-gray-700 text-gray-500 opacity-40'}
              `}
            >
              <span>{def.icon}</span>
              <span>{def.label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgesPanel;