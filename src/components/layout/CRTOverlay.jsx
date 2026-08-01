import React from 'react';

const CRTOverlay = ({ children }) => {
  return (
    <div className="relative min-h-[100dvh] h-[100dvh] w-full bg-[#0d0d13] overflow-y-auto flex flex-col">
      {/* Scanlines Effect */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      
      {/* Flicker Effect */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.015]  bg-white" />
      
      {/* Vignette */}
      <div className="pointer-events-none fixed inset-0 z-50 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
      
      <div className="relative z-10 flex flex-col items-center flex-1 h-full w-full">
        {children}
      </div>
    </div>
  );
};

export default CRTOverlay;