import React from 'react';
import LoginButton from './LoginButton';

const Header = ({ language, setLanguage, isPracticeMode, dict, address, setAddress }) => {
  return (
    <header className="w-full bg-[#0d0d13] border-b border-gray-800 sticky top-0 z-40">
      <div className="w-full max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Left Side: Logo & Nav Links */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="https://greta-preview.s3.us-east-2.amazonaws.com/assets/logo.svg" alt="AXiM Logo" className="h-8 w-8" />
            <span className="text-white font-bold text-xl tracking-wide hidden sm:block">AXiM</span>
          </div>

          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Ecosystem</a>
            <a href="#" className="hover:text-white transition-colors">Games</a>
            <a href="#" className="hover:text-white transition-colors">Tokenomics</a>
          </nav>
        </div>

        {/* Right Side: Lang, Practice Mode Tag, Login */}
        <div className="flex items-center gap-4">
          {isPracticeMode && (
            <span className="hidden sm:inline-block text-xs font-bold text-black bg-yellow-400 px-2 py-1 shadow-[0_0_10px_rgba(250,204,21,0.8)] font-cyber">
              [ PRACTICE MODE ]
            </span>
          )}

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="hidden sm:block bg-surface-dark text-neon-green border border-gray-700 p-1 text-xs font-mono cursor-pointer outline-none hover:border-neon-green transition-colors"
          >
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="fr">FR</option>
          </select>

          <LoginButton dict={dict} address={address} setAddress={setAddress} />
        </div>

      </div>

      {/* Mobile Practice Mode Banner (if needed below header) */}
      {isPracticeMode && (
        <div className="sm:hidden w-full bg-yellow-400 text-black text-xs font-bold font-cyber text-center py-1">
          [ PRACTICE MODE ]
        </div>
      )}
    </header>
  );
};

export default Header;
