import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_DATA = {
  daily: [
    { rank: 1, user: "AximWhale", score: 9850 },
    { rank: 2, user: "CyberPunk", score: 9420 },
    { rank: 3, user: "Satoshi_N", score: 9100 },
  ],
  weekly: [
    { rank: 1, user: "CryptoKing", score: 65400 },
    { rank: 2, user: "AximWhale", score: 62100 },
    { rank: 3, user: "Web3Wizard", score: 58900 },
  ],
  allTime: [
    { rank: 1, user: "Genesis_1", score: 850200 },
    { rank: 2, user: "AlphaTester", score: 790400 },
    { rank: 3, user: "CryptoKing", score: 745000 },
  ]
};

const Leaderboard = ({ isOpen, onClose, dict }) => {
  const [tab, setTab] = useState('daily');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-surface-dark border-2 border-neon-green shadow-neon-green p-6 max-w-lg w-full font-mono"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-cyber text-sm md:text-lg uppercase">{dict.leaderboard}</h2>
          <button onClick={onClose} className="text-neon-green hover:text-white">X</button>
        </div>

        <div className="flex gap-2 mb-6">
          {['daily', 'weekly', 'allTime'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1 text-xs border ${tab === t ? 'bg-neon-green text-black border-neon-green' : 'text-neon-green border-neon-green/30'}`}
            >
              {dict[t]}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {MOCK_DATA[tab].map((entry) => (
            <div key={entry.user} className="flex justify-between items-center p-2 border-b border-neon-green/20">
              <div className="flex items-center gap-4">
                <span className={`w-6 font-bold ${entry.rank === 1 ? 'text-yellow-400' : 'text-gray-500'}`}>#{entry.rank}</span>
                <span className="text-white">{entry.user}</span>
              </div>
              <span className="text-neon-green">{entry.score}</span>
            </div>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 py-2 border-2 border-neon-green text-neon-green hover:bg-neon-green hover:text-black transition-colors uppercase text-sm"
        >
          Return to Terminal
        </button>
      </motion.div>
    </div>
  );
};

export default Leaderboard;