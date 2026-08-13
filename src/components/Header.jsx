import React from 'react';
import LoginButton from './LoginButton';
import { useTelemetry } from '../hooks/useTelemetry';

const Header = ({ dict, address, setAddress, edgeHealth }) => {
  const { trackEvent } = useTelemetry();

  const handleLogoClick = () => {
    trackEvent('NAVIGATED_TO_AXIM_GAMES', {
      destination: 'https://axim.us.com/games',
      target: '_blank',
      timestamp: Date.now()
    });
  };

  return (
    <header className="w-full bg-[#0d0d13] border-b border-gray-800 sticky top-0 z-40">
      <div className="w-full max-w-7xl mx-auto px-4 py-2 min-h-[4rem] flex flex-wrap items-center justify-between gap-4">

        {/* Left Side: Logo & Nav Links */}
        <div className="flex items-center">
          <a
            href="https://axim.us.com/games"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLogoClick}
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img
              src="https://wp.axim.us.com/wp-content/uploads/2026/08/AXiM-Development-1200x628-layout1284-infrastructure-axim-axim-axim-1l7q5v7.webp"
              alt="AXiM Development"
              className="h-8 md:h-10 w-auto object-contain hover:opacity-80 transition-opacity"
            />
          </a>
        </div>

        {/* Center: Edge Status */}
        {edgeHealth !== null && edgeHealth !== undefined && (
          <div className="flex items-center justify-center order-last w-full sm:order-none sm:w-auto">
            <div className="font-mono text-[10px] text-green-400 opacity-70 border border-green-400/30 px-2 py-1 uppercase tracking-wider">
              [ EDGE: {typeof edgeHealth === 'number' ? `${edgeHealth}ms` : edgeHealth} ]
            </div>
          </div>
        )}

        {/* Right Side: Login */}
        <div className="flex items-center shrink-0">
          <LoginButton dict={dict} address={address} setAddress={setAddress} />
        </div>

      </div>
    </header>
  );
};

export default Header;
