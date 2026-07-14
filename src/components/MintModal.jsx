import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';

const MintModal = ({ score, dictionary, onClose }) => {
  const [status, setStatus] = useState('idle'); // idle, processing, success

  useEffect(() => {
    if (status === 'processing') {
      const timer = setTimeout(() => {
        setStatus('success');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-surface-dark border-2 border-neon-pink shadow-neon-pink p-8 max-w-md w-full text-center flex flex-col items-center"
      >
        <h2 className="text-white font-cyber text-lg mb-6 text-shadow-neon">WEB3 ROUTING</h2>
        
        {status === 'idle' && (
          <>
            <p className="text-gray-300 mb-6 font-mono">
              Final Score: <span className="text-neon-green font-bold">{score}</span>
            </p>
            <button 
              onClick={() => setStatus('processing')}
              className="bg-neon-pink text-white py-3 px-6 font-bold shadow-neon-pink hover:brightness-110 w-full mb-4"
            >
              SIGN & SUBMIT TX
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-white text-sm">
              CANCEL
            </button>
          </>
        )}

        {status === 'processing' && (
          <div className="flex flex-col items-center py-8">
            <div className="w-12 h-12 border-4 border-neon-pink border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-neon-pink animate-pulse font-mono text-sm">
              {dictionary.processing}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center py-4">
            <SafeIcon name="CheckCircle" className="text-6xl text-neon-green mb-4 shadow-neon-green rounded-full bg-neon-green/20" />
            <p className="text-neon-green font-bold mb-6 font-mono text-center">
              {dictionary.mintSuccess}
            </p>
            <button 
              onClick={onClose}
              className="border-2 border-neon-green text-neon-green hover:bg-neon-green hover:text-black py-2 px-6 font-bold transition-colors"
            >
              CLOSE
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MintModal;