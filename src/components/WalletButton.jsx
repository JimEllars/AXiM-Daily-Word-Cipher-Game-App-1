import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiCpu, FiLink } = FiIcons;

const WalletButton = ({ dict, address, setAddress }) => {
  const [connecting, setConnecting] = useState(false);

  const connect = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask or another Web3 wallet.");
      return;
    }

    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
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

  return (
    <button 
      onClick={!address ? connect : null}
      disabled={connecting}
      className={`flex items-center gap-2 px-4 py-2 border-2 font-mono text-xs transition-all ${
        address 
          ? 'border-neon-green text-neon-green bg-neon-green/10' 
          : 'border-neon-pink text-neon-pink hover:bg-neon-pink/10 shadow-neon-pink'
      }`}
    >
      <SafeIcon icon={connecting ? FiCpu : FiLink} className={connecting ? 'animate-spin' : ''} />
      {connecting ? 'LINKING...' : address ? `${dict.connected}: ${formatAddress(address)}` : dict.connectWallet}
    </button>
  );
};

export default WalletButton;
