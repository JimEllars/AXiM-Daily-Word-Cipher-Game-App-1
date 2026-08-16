import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const GuessDistribution = ({ dictionary }) => {
  const [distribution, setDistribution] = useState(null);

  useEffect(() => {
    const fetchDist = () => {
      const dist = JSON.parse(localStorage.getItem('axim_guess_distribution'));
      if (dist) setDistribution(dist);
    };

    fetchDist();

    // Also update on storage changes to reflect cross-tab or current session updates
    const handleStorage = (e) => {
      if (e.key === 'axim_guess_distribution') {
         fetchDist();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (!distribution) return null;

  const maxVal = Math.max(...Object.values(distribution), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mt-6 mb-6 px-4 mx-auto"
    >
      <h3 className="text-gray-400 text-xs mb-3 uppercase tracking-widest text-center text-shadow-neon">
        {dictionary?.guessDistribution || 'GUESS DISTRIBUTION'}
      </h3>
      <div className="flex flex-col gap-2">
        {["1", "2", "3", "4", "5", "6+"].map(key => {
          const count = distribution[key] || 0;
          const percentage = Math.max((count / maxVal) * 100, 5); // 5% minimum bar width for visibility
          return (
            <div key={key} className="flex items-center gap-2 text-xs font-mono">
              <span className="w-4 text-right text-gray-400">{key}</span>
              <div className="flex-1 h-5 bg-surface-dark/50 border border-gray-800/50 relative overflow-hidden">
                <div
                  className={`h-full ${count > 0 ? 'bg-neon-green/40 shadow-[0_0_10px_rgba(0,255,102,0.4)] border-r border-neon-green/80' : 'bg-transparent'} transition-all duration-700 ease-out flex items-center justify-end px-2`}
                  style={{ width: `${percentage}%` }}
                >
                  {count > 0 && <span className="text-neon-green font-bold text-[10px]">{count}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default GuessDistribution;
