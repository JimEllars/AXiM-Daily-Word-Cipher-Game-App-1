import React from 'react';
import LoginButton from './LoginButton';

const Header = ({ dict, address, setAddress }) => {
  return (
    <header className="w-full bg-[#0d0d13] border-b border-gray-800 sticky top-0 z-40">
      <div className="w-full max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Left Side: Logo & Nav Links */}
        <div className="flex items-center gap-6">
          <a href="https://axim.us.com/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="https://greta-preview.s3.us-east-2.amazonaws.com/assets/logo.svg" alt="AXiM Logo" className="h-8 w-8" />
            <span className="text-white font-bold text-xl tracking-wide hidden sm:block">AXiM</span>
          </a>
        </div>

        {/* Right Side: Login */}
        <div className="flex items-center gap-4">
          <LoginButton dict={dict} address={address} setAddress={setAddress} />
        </div>

      </div>
    </header>
  );
};

export default Header;
