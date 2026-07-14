import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Leaderboard = ({ isOpen, onClose, dict }) => {
  const [tab, setTab] = useState('daily');
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      setError(false);
      setData([]);

      const startTime = performance.now();

      try {
        const response = await fetch(`/api/leaderboard?type=${tab}`);
        if (!response.ok) {
          throw new Error('Database offline');
        }
        const result = await response.json();

        const endTime = performance.now();
        console.log(`Telemetry: API /api/leaderboard?type=${tab} response time: ${(endTime - startTime).toFixed(2)}ms`);

        if (isMounted) {
          setData(result.data || []);
        }
      } catch (err) {
        const endTime = performance.now();
        console.log(`Telemetry: API /api/leaderboard?type=${tab} failed after: ${(endTime - startTime).toFixed(2)}ms`);

        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [tab, isOpen]);

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
          {isLoading && (
            <div className="text-neon-green text-center py-4 animate-pulse">
              [LOADING ARCHIVES...]
            </div>
          )}

          {error && !isLoading && (
            <div className="text-red-500 text-center py-4 font-bold bg-red-500/10 border border-red-500">
              [DATABASE OFFLINE: CODE 500]
            </div>
          )}

          {!isLoading && !error && data.length === 0 && (
            <div className="text-gray-400 text-center py-4">
              No records found.
            </div>
          )}

          {!isLoading && !error && data.map((entry) => (
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