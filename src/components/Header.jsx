import React from 'react';

const Header = ({ language, setLanguage }) => {
  return (
    <div className="w-full max-w-2xl flex justify-between items-center mb-6 pt-6 px-4">
      <h2 className="m-0 text-white font-cyber text-sm md:text-xl text-shadow-neon tracking-wider">
        AXiM_CIPHER.exe
      </h2>
      <select 
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-surface-dark text-neon-green border-2 border-neon-green p-2 font-mono cursor-pointer outline-none focus:shadow-neon-green transition-shadow"
      >
        <option value="en">EN</option>
        <option value="es">ES</option>
        <option value="fr">FR</option>
      </select>
    </div>
  );
};

export default Header;