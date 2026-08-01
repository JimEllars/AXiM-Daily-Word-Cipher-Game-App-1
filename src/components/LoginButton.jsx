import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { motion, AnimatePresence } from 'framer-motion';

const { FiCpu, FiLink, FiMail, FiUser } = FiIcons;

const LoginButton = ({ dict, address, setAddress }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const connectWeb3 = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or another Web3 wallet.");
      return;
    }

    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setShowOptions(false);
      }
    } catch (error) {
      console.error("User rejected request or other error:", error);
    } finally {
      setConnecting(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const connectEmail = () => {
    // Mock email login for now
    alert("Email login coming soon!");
    setShowOptions(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => address ? setAddress(null) : setShowOptions(!showOptions)}
        disabled={connecting}
        className={`flex items-center gap-2 px-4 py-2 border-2 font-mono text-xs transition-all ${
          address
            ? 'border-neon-green text-neon-green bg-neon-green/10'
            : 'border-neon-pink text-neon-pink hover:bg-neon-pink/10 shadow-neon-pink'
        }`}
      >
        <SafeIcon icon={connecting ? FiCpu : (address ? FiUser : FiLink)} className={connecting ? 'animate-spin' : ''} />
        {connecting ? 'LINKING...' : address ? `Hi, ${formatAddress(address)}` : '[ LOGIN ]'}
      </button>

      <AnimatePresence>
        {showOptions && !address && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute right-0 mt-2 w-48 bg-surface-dark border-2 border-neon-pink p-2 z-50 flex flex-col gap-2 shadow-neon-pink"
          >
            <button
              onClick={connectEmail}
              className="flex items-center gap-2 px-4 py-2 bg-transparent text-white hover:bg-neon-pink/10 hover:text-neon-pink font-mono text-xs transition-colors w-full text-left"
            >
              <SafeIcon icon={FiMail} /> Login with Email
            </button>
            <button
              onClick={connectWeb3}
              className="flex items-center gap-2 px-4 py-2 bg-transparent text-white hover:bg-neon-green/10 hover:text-neon-green font-mono text-xs transition-colors w-full text-left"
            >
              <SafeIcon icon={FiLink} /> Connect Web3 Wallet
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginButton;
