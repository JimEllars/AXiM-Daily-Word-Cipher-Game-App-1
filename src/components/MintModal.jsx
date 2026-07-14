import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiCheckCircle } = FiIcons;

const MintModal = ({ score, time_elapsed, walletAddress, dictionary, onClose }) => {
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const submitTransaction = async () => {
    if (!walletAddress) {
      setErrorMessage(dictionary.connectWallet);
      setStatus('error');
      return;
    }

    setStatus('processing');
    const startTime = performance.now();

    try {
      // 1. Fetch ECDSA signature from Cloudflare Worker
      const response = await fetch('/api/game/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          score,
          time_elapsed
        }),
      });

      const endTime = performance.now();
      console.log(`Telemetry: API /api/game/submit response time: ${(endTime - startTime).toFixed(2)}ms`);

      if (!response.ok) {
        throw new Error('API Offline');
      }

      const data = await response.json();
      const signature = data.signature;

      // 2. Mock call to smart contract using window.ethereum if signature is valid
      if (signature && window.ethereum) {
        // Here we would use ethers.js or web3.js to construct the actual transaction.
        // For standard window.ethereum, we simulate a transaction request.
        // Assuming a generic claimDailyReward(bytes signature) on the contract.

        /*
        // Actual implementation would look like:
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        const tx = await contract.claimDailyReward(signature);
        await tx.wait();
        */

        // Simulating the user prompt and transaction:
        // This is a dummy transaction request to show the MetaMask popup
        await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: walletAddress,
              to: walletAddress, // Send to self as a dummy action for the demo
              value: '0x0',
              data: '0x', // Dummy data
            },
          ],
        });

        setStatus('success');
      } else {
         throw new Error('Transaction Rejected or missing signature');
      }

    } catch (err) {
      console.error(err);
      if (err.message === 'API Offline') {
        setErrorMessage(dictionary.apiOffline);
      } else if (err.code === 4001 || err.message.includes('User denied transaction signature') || err.message === 'Transaction Rejected or missing signature') {
        setErrorMessage(dictionary.txRejected);
      } else {
        setErrorMessage(dictionary.apiOffline); // Default error
      }
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-surface-dark border-2 border-neon-pink shadow-neon-pink p-8 max-w-md w-full text-center flex flex-col items-center"
      >
        <h2 className="text-white font-cyber text-lg mb-6 text-shadow-neon">WEB3 ROUTING</h2>
        
        {(status === 'idle' || status === 'error') && (
          <>
            <p className="text-gray-300 mb-6 font-mono">
              Final Score: <span className="text-neon-green font-bold">{score}</span>
            </p>
            {status === 'error' && (
              <p className="text-red-500 font-bold mb-4 font-mono text-sm border-2 border-red-500 p-2 bg-red-500/10 w-full">
                {errorMessage}
              </p>
            )}
            <button 
              onClick={submitTransaction}
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
            <SafeIcon icon={FiCheckCircle} className="text-6xl text-neon-green mb-4 shadow-neon-green rounded-full bg-neon-green/20" />
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
