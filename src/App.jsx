import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsPanel from './components/StatsPanel';
import GameBoard from './components/GameBoard';
import GameInput from './components/GameInput';
import Keyboard from './components/Keyboard';
import BadgesPanel from './components/BadgesPanel';
import MintModal from './components/MintModal';
import Leaderboard from './components/Leaderboard';
import Instructions from './components/Instructions';
import WalletButton from './components/WalletButton';
import ShareButton from './components/ShareButton';
import CRTOverlay from './components/layout/CRTOverlay';
import { useGameEngine } from './hooks/useGameEngine';
import { i18n } from './constants/i18n';
import { getDailyWord } from './constants/words';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from './common/SafeIcon';

const { FiBarChart2, FiInfo } = FiIcons;

function App() {
  const [language, setLanguage] = useState('en');
  const [showMintModal, setShowMintModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  
  const targetWord = getDailyWord();
  const dict = i18n[language];

  const {
    guesses,
    currentGuess,
    setCurrentGuess,
    elapsedSeconds,
    score,
    gameOver,
    hasWon,
    submitGuess,
    unlockedBadges,
    streak
  } = useGameEngine(targetWord);


  // Show instructions on first load
  useEffect(() => {
    const hasVisited = localStorage.getItem('axim_visited');
    if (!hasVisited) {
      setShowInstructions(true);
      localStorage.setItem('axim_visited', 'true');
    }
  }, []);

  // Eager connection check
  useEffect(() => {
    const handleAccountsChanged = (accounts) => {
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
      } else {
        setWalletAddress(null);
      }
    };

    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        } catch (err) {
          console.error("Silent eager connection check failed", err);
        }

        window.ethereum.on('accountsChanged', handleAccountsChanged);
      }
    };

    checkConnection();

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);



  // Global keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if game over or any modal is open
      if (gameOver || showMintModal || showLeaderboard || showInstructions) return;
      if (e.repeat) return; // Prevent holding down key spam

      const key = e.key;

      if (key === 'Enter') {
        if (currentGuess.length === 5) submitGuess(currentGuess);
      } else if (key === 'Backspace') {
        setCurrentGuess(prev => prev.slice(0, -1));
      } else if (/^[a-zA-Z]$/.test(key)) {
        if (currentGuess.length < 5) {
          setCurrentGuess(prev => prev + key.toUpperCase());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, showMintModal, showLeaderboard, showInstructions, currentGuess, submitGuess, setCurrentGuess]);

  return (
    <CRTOverlay>
      <div className="w-full h-full flex flex-col items-center pb-12">
        <Header language={language} setLanguage={setLanguage} />
        
        <div className="w-full max-w-2xl flex justify-between px-4 mb-4">
          <WalletButton dict={dict} address={walletAddress} setAddress={setWalletAddress} />
          <div className="flex gap-2">
            <button 
              onClick={() => setShowLeaderboard(true)}
              className="p-2 border-2 border-neon-green text-neon-green hover:bg-neon-green/10"
              title={dict.leaderboard}
            >
              <SafeIcon icon={FiBarChart2} />
            </button>
            <button 
              onClick={() => setShowInstructions(true)}
              className="p-2 border-2 border-neon-pink text-neon-pink hover:bg-neon-pink/10"
              title={dict.instructions}
            >
              <SafeIcon icon={FiInfo} />
            </button>
          </div>
        </div>

        <StatsPanel 
          score={score} 
          streak={streak} 
          time={elapsedSeconds} 
          dictionary={dict} 
        />

        <AnimatePresence>
          {gameOver && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`mb-6 p-3 px-6 border-2 font-bold text-center w-full max-w-sm ${hasWon ? 'border-neon-green text-neon-green bg-neon-green/10 shadow-neon-green' : 'border-red-500 text-red-500 bg-red-500/10'}`}
            >
              {hasWon ? dict.winMsg : dict.loseMsg}
              {hasWon && <div className="text-xs mt-1 text-white opacity-80">Final Signal Verified</div>}
            </motion.div>
          )}
        </AnimatePresence>

        <GameBoard 
          guesses={guesses} 
          currentGuess={currentGuess} 
          targetWord={targetWord} 
        />

        <GameInput 
          currentGuess={currentGuess}
          setCurrentGuess={setCurrentGuess}
          submitGuess={submitGuess}
          dictionary={dict}
          disabled={gameOver}
        />

        <Keyboard
          guesses={guesses}
          targetWord={targetWord}
          onKeyPress={(key) => {
            if (gameOver) return;
            if (key === 'ENTER') {
              if (currentGuess.length === 5) submitGuess(currentGuess);
            } else if (key === 'BACKSPACE') {
              setCurrentGuess(prev => prev.slice(0, -1));
            } else if (currentGuess.length < 5) {
              setCurrentGuess(prev => prev + key);
            }
          }}
        />

        <AnimatePresence>
          {hasWon && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex gap-4 mt-6"
            >
              {!showMintModal && (
                <button
                  onClick={() => setShowMintModal(true)}
                  className="bg-neon-pink text-white border-2 border-neon-pink py-3 px-8 text-lg font-bold font-cyber shadow-neon-pink hover:bg-transparent hover:text-neon-pink transition-all"
                >
                  {dict.mintBtn}
                </button>
              )}
              <ShareButton
                dict={dict}
                guesses={guesses}
                targetWord={targetWord}
                score={score}
                streak={streak}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <BadgesPanel 
          unlockedBadges={unlockedBadges} 
          title={dict.badgesTitle} 
        />

        {/* Modals */}
        <Leaderboard 
          isOpen={showLeaderboard} 
          onClose={() => setShowLeaderboard(false)} 
          dict={dict} 
        />
        
        <Instructions 
          isOpen={showInstructions} 
          onClose={() => setShowInstructions(false)} 
          dict={dict} 
        />

        {showMintModal && (
          <MintModal 
            score={score} 
            time_elapsed={elapsedSeconds}
            walletAddress={walletAddress}
            dictionary={dict} 
            onClose={() => setShowMintModal(false)} 
          />
        )}
      </div>
    </CRTOverlay>
  );
}

export default App;
