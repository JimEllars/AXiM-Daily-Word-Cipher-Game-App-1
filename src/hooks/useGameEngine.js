import { useState, useEffect, useCallback, useRef } from 'react';
import { useTelemetry } from './useTelemetry';
import { FALLBACK_WORDS, getDailyWord } from '../constants/words';
import { ethers } from 'ethers';
import { WEB3_CONFIG } from '../config/web3';

const MAX_SCORE = 5000;
const WORD_LENGTH = 5;

const calculateScore = (attempts) => {
  if (attempts === 0) return 5000;
  if (attempts === 1) return 5000;
  if (attempts === 2) return 3000;
  if (attempts === 3) return 2000;
  if (attempts === 4) return 1000;
  if (attempts === 5) return 500;
  return 100;
};

export const useGameEngine = (walletAddress) => {
  const { trackEvent } = useTelemetry();
  const hasTrackedStart = useRef(false);
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState(() => {
    const session = localStorage.getItem('axim_current_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.date === new Date().toDateString()) {
          return parsed.guesses || [];
        }
      } catch (e) {
        console.error('Failed to parse session', e);
      }
    }
    return [];
  });

  const [currentGuess, setCurrentGuess] = useState('');

  // Elapsed time is kept for badges, but timer is deprecated. We can just use elapsedSeconds = 0 or remove it.
  // Wait, the prompt says "remove all setInterval logic related to the game clock". I'll keep elapsedSeconds = 0 so stats panel doesn't crash if it expects it.
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  const [score, setScore] = useState(() => {
    const session = localStorage.getItem('axim_current_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.date === new Date().toDateString()) {
          // If a cached score exists from the old time-based system, gracefully preserve it for today
          if (parsed.accumulatedSeconds !== undefined && parsed.score !== undefined) {
             return parsed.score;
          }
          // Otherwise calculate based on new tier
          return calculateScore((parsed.guesses || []).length);
        }
      } catch (e) {
        console.error('Failed to parse session score', e);
      }
    }
    return MAX_SCORE;
  });

  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [streak, setStreak] = useState(0);
  const [hasMintedToday, setHasMintedToday] = useState(false);

  useEffect(() => {
    if (!hasTrackedStart.current && !gameOver) {
      trackEvent('GAME_STARTED', { timestamp: Date.now() });
      hasTrackedStart.current = true;
    }
  }, [gameOver, trackEvent]);

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'axim_current_session') {
        if (!e.newValue) {
          // If session was flushed
          setGuesses([]);
          setScore(MAX_SCORE);
          setGameOver(false);
          setHasWon(false);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed.date === new Date().toDateString()) {
              if (parsed.guesses !== undefined) {
                setGuesses(parsed.guesses);
                // If it's a legacy cached session with accumulatedSeconds, preserve its score for today
                if (parsed.accumulatedSeconds !== undefined && parsed.score !== undefined) {
                  setScore(parsed.score);
                } else {
                  setScore(calculateScore(parsed.guesses.length));
                }
              }
              if (parsed.gameOver !== undefined) setGameOver(parsed.gameOver);
              if (parsed.hasWon !== undefined) setHasWon(parsed.hasWon);
            }
          } catch (err) {
            console.error('Failed to sync session from storage event', err);
          }
        }
      } else if (e.key === 'axim_last_minted_day_id') {
        const todayId = Math.floor(Date.now() / 86400000).toString();
        if (e.newValue === todayId) {
          setHasMintedToday(true);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Dynamic Document Title
  useEffect(() => {
    if (hasWon) {
      document.title = "AXiM Cipher | Decrypted 🔓";
    } else if (gameOver) {
      document.title = "AXiM Cipher | Failed ❌";
    } else {
      document.title = "AXiM Cipher | Playing...";
    }
  }, [hasWon, gameOver]);

  // Dynamic Favicon State
  useEffect(() => {
    let faviconLink = document.querySelector("link[rel~='icon']");
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }
    const defaultIcon = "https://greta-preview.s3.us-east-2.amazonaws.com/assets/logo.svg";
    const alertIcon = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="%23ff003c" stroke-width="10" fill="none" /><circle cx="50" cy="50" r="10" fill="%23ff003c" /></svg>`;

    const hasPlayedToday = hasWon || gameOver;
    if (!hasPlayedToday && !hasMintedToday) {
      faviconLink.href = alertIcon;
    } else {
      faviconLink.href = defaultIcon;
    }
  }, [hasWon, gameOver, hasMintedToday]);

  // Fetch daily word
  useEffect(() => {
    const fetchWord = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${import.meta.env.BASE_URL}api/word/today`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('API request failed');
        }

        const data = await response.json();
        setTargetWord(data.word.toUpperCase());
      } catch (error) {
        console.error('[TELEMETRY] DB Fetch failed, utilizing deterministic edge fallback.', error);

        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);

        const index = dayOfYear % FALLBACK_WORDS.length;
        setTargetWord(FALLBACK_WORDS[index]);
      }
    };
    fetchWord();
  }, []);

  useEffect(() => {
    const checkMintStatus = async () => {
      const todayId = Math.floor(Date.now() / 86400000).toString();
      let onChainMinted = false;

      if (walletAddress && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const CONTRACT_ADDRESS = WEB3_CONFIG.CONTRACT_ADDRESS;
          const ABI = ['function lastClaimDay(address) view returns (uint256)'];
          const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

          const lastClaim = await contract.lastClaimDay(walletAddress);
          if (lastClaim.toString() === todayId) {
            onChainMinted = true;
          }
        } catch (error) {
          console.error('[TELEMETRY] RPC read failed, falling back to local storage', error);
        }
      }

      if (onChainMinted) {
        setHasMintedToday(true);
      } else {
        const lastMinted = localStorage.getItem('axim_last_minted_day_id');
        if (lastMinted === todayId) {
          setHasMintedToday(true);
        } else {
          setHasMintedToday(false);
        }
      }
    };

    checkMintStatus();
  }, [walletAddress]);

  // Load persistent streak from local storage
  useEffect(() => {
    const savedStreak = localStorage.getItem('axim_streak');
    const lastPlayed = localStorage.getItem('axim_last_played');
    const today = new Date().toDateString();
    
    setStreak(savedStreak ? parseInt(savedStreak) : 3);
  }, []);

  const submitGuess = useCallback((guessStr) => {
    if (gameOver || guessStr.length !== WORD_LENGTH) return false;

    const upperGuess = guessStr.toUpperCase();
    const newGuesses = [...guesses, upperGuess];
    setGuesses(newGuesses);
    trackEvent('GUESS_SUBMITTED', { attemptNumber: newGuesses.length, guess: upperGuess });

    setCurrentGuess('');

    // Check if we need to preserve legacy score
    let newScore = score;
    const session = localStorage.getItem('axim_current_session');
    let hasLegacyScore = false;
    let accumulatedSeconds = 0;
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.accumulatedSeconds !== undefined) {
           hasLegacyScore = true;
           accumulatedSeconds = parsed.accumulatedSeconds;
        }
      } catch(e){ console.error(e); }
    }

    if (!hasLegacyScore) {
       newScore = calculateScore(newGuesses.length);
    }
    setScore(newScore);

    const sessionData = {
      guesses: newGuesses,
      date: new Date().toDateString()
    };

    if (hasLegacyScore) {
        sessionData.accumulatedSeconds = accumulatedSeconds;
        sessionData.score = newScore;
    }

    localStorage.setItem('axim_current_session', JSON.stringify(sessionData));

    if (upperGuess === targetWord) {
      setGameOver(true);
      setHasWon(true);
      localStorage.removeItem('axim_current_session');
      
      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem('axim_streak', newStreak);
      localStorage.setItem('axim_last_played', new Date().toDateString());
      
      // Update guess distribution
      const dist = JSON.parse(localStorage.getItem('axim_guess_distribution')) || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, "6+": 0 };
      const attempts = newGuesses.length;
      const bucket = attempts >= 6 ? "6+" : attempts.toString();
      dist[bucket] = (dist[bucket] || 0) + 1;
      localStorage.setItem('axim_guess_distribution', JSON.stringify(dist));

      evaluateBadges(newGuesses.length, 0, newStreak);
      trackEvent('GAME_COMPLETED', {
        hasWon: true,
        score: newScore,
        streak: newStreak,
        time_elapsed: 0
      });

    }
    // We removed the hard fail state (newScore === 0) since there are unlimited attempts.
    
    return true;
  }, [gameOver, guesses, targetWord, streak, score, trackEvent]);

  const evaluateBadges = (attempts, time, currentStreak) => {
    const newBadges = ['genesis'];
    if (time < 30) newBadges.push('speed_demon'); // this might never trigger if time is always 0 now, but keeping for legacy
    if (attempts === 1) newBadges.push('flawless');
    if (currentStreak >= 3) newBadges.push('streak_3');
    setUnlockedBadges(newBadges);
  };

  return {
    guesses,
    currentGuess,
    setCurrentGuess,
    elapsedSeconds,
    score,
    gameOver,
    hasWon,
    submitGuess,
    unlockedBadges,
    streak,
    targetWord,
    hasMintedToday,
    setHasMintedToday
  };
};
