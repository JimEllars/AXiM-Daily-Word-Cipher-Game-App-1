import { useState, useEffect, useCallback, useRef } from 'react';
import { useTelemetry } from './useTelemetry';
import { FALLBACK_WORDS, getDailyWord } from '../constants/words';
import { ethers } from 'ethers';
import { WEB3_CONFIG } from '../config/web3';

const MAX_SCORE = 10000;
const PENALTY_PER_ATTEMPT = 400;
const PENALTY_PER_SECOND = 8;
const WORD_LENGTH = 5;

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
  const [sessionStart] = useState(() => Date.now());
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(() => {
    const session = localStorage.getItem('axim_current_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.date === new Date().toDateString() && parsed.accumulatedSeconds) {
          return parsed.accumulatedSeconds;
        }
      } catch (e) {
        console.error('Failed to parse session', e);
      }
    }
    return 0;
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [score, setScore] = useState(MAX_SCORE);
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
          // If session was flushed (e.g. next day)
          setGuesses([]);
          setAccumulatedSeconds(0);
          setElapsedSeconds(0);
          setScore(MAX_SCORE);
          setGameOver(false);
          setHasWon(false);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed.date === new Date().toDateString()) {
              if (parsed.guesses !== undefined) setGuesses(parsed.guesses);
              if (parsed.accumulatedSeconds !== undefined) setAccumulatedSeconds(parsed.accumulatedSeconds);
              if (parsed.elapsedSeconds !== undefined) setElapsedSeconds(parsed.elapsedSeconds);
              if (parsed.score !== undefined) setScore(parsed.score);
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

    // Default icon from index.html: https://greta-preview.s3.us-east-2.amazonaws.com/assets/logo.svg
    // Alert icon can be a localized data URI or an active alert version. Let's create an SVG data URI for alert.
    const defaultIcon = "https://greta-preview.s3.us-east-2.amazonaws.com/assets/logo.svg";

    // A simple red alert/active circle or the original logo with a red tint. We will use a neon-tinted active SVG.
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

        const response = await fetch('/api/word/today', { signal: controller.signal });
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

        // Deterministic index based on the day of the year using FALLBACK_WORDS length
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
          // Dummy contract address and ABI for demo
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
    
    if (lastPlayed === today) {
      // Logic for already played could go here, but for demo we allow replay
    }

    setStreak(savedStreak ? parseInt(savedStreak) : 3); // Defaulting to 3 for demo
  }, []);

  useEffect(() => {
    if (gameOver) return;
    
    const interval = setInterval(() => {
      const currentElapsed = Math.floor((Date.now() - sessionStart) / 1000);
      const totalElapsed = accumulatedSeconds + currentElapsed;
      setElapsedSeconds(totalElapsed);
      
      let newScore = MAX_SCORE - (guesses.length * PENALTY_PER_ATTEMPT) - (totalElapsed * PENALTY_PER_SECOND);
      newScore = Math.max(0, newScore);
      setScore(newScore);

      if (newScore === 0) {
        setGameOver(true);
        setHasWon(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStart, accumulatedSeconds, gameOver, guesses.length]);

  const submitGuess = useCallback((guessStr) => {
    if (gameOver || guessStr.length !== WORD_LENGTH) return false;

    const upperGuess = guessStr.toUpperCase();
    const newGuesses = [...guesses, upperGuess];
    setGuesses(newGuesses);
    trackEvent('GUESS_SUBMITTED', { attemptNumber: newGuesses.length, guess: upperGuess });

    setCurrentGuess('');

    localStorage.setItem('axim_current_session', JSON.stringify({
      guesses: newGuesses,
      accumulatedSeconds: accumulatedSeconds + Math.floor((Date.now() - sessionStart) / 1000),
      date: new Date().toDateString()
    }));

    const elapsed = accumulatedSeconds + Math.floor((Date.now() - sessionStart) / 1000);
    let newScore = MAX_SCORE - (newGuesses.length * PENALTY_PER_ATTEMPT) - (elapsed * PENALTY_PER_SECOND);
    newScore = Math.max(0, newScore);
    setScore(newScore);

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

      evaluateBadges(newGuesses.length, elapsed, newStreak);
      trackEvent('GAME_COMPLETED', {
        hasWon: true,
        score: newScore,
        streak: newStreak,
        time_elapsed: elapsed
      });

    } else if (newScore === 0) {
      setGameOver(true);
      setHasWon(false);
      localStorage.removeItem('axim_current_session');
      trackEvent('GAME_COMPLETED', {
        hasWon: false,
        score: 0,
        streak: streak,
        time_elapsed: elapsed
      });

    }
    
    return true;
  }, [gameOver, guesses, sessionStart, accumulatedSeconds, targetWord, streak]);

  const evaluateBadges = (attempts, time, currentStreak) => {
    const newBadges = ['genesis'];
    if (time < 30) newBadges.push('speed_demon');
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