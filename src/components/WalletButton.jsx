import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiCpu, FiLink } = FiIcons;

const WalletButton = ({ dict }) => {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const connect = () => {
    setConnecting(true);
    setTimeout(() => {
      setAddress('0xAXiM...7f2b');
      setConnecting(false);
    }, 1500);
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
      {connecting ? 'LINKING...' : address ? `${dict.connected}: ${address}` : dict.connectWallet}
    </button>
  );
};

export default WalletButton;