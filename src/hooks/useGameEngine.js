
const handleAuthError = () => {
  localStorage.removeItem('axim_sso_token');
  localStorage.removeItem('axim_global_session');
  document.cookie = "axim_global_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  window.dispatchEvent(new Event('axim_sso_expired'));

  // Custom toast dispatch
  const event = new CustomEvent('axim_toast', { detail: '[ SESSION EXPIRED: PLEASE RE-LOGIN ]' });
  window.dispatchEvent(event);
};

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTelemetry } from './useTelemetry';
import { FALLBACK_WORDS, getDailyWord, getRandomPracticeWord } from '../constants/words';
import { ethers } from 'ethers';
import { WEB3_CONFIG, getProvider } from '../config/web3';

const MAX_SCORE = 1000;
const calculateScore = (attempts, isPracticeMode = false) => {
  if (isPracticeMode) {
    if (attempts <= 1) return 100;

    let score = 100;
    for (let i = 2; i <= attempts; i++) {
      score -= 20;
    }
    return Math.max(10, score);
  }

  if (attempts <= 1) return 1000;

  let score = 1000;
  for (let i = 2; i <= attempts; i++) {
    if (score >= 700) {
      score -= 100;
    } else if (score >= 500) {
      score -= 75;
    } else if (score >= 250) {
      score -= 50;
    } else {
      score -= 25;
    }
  }

  return Math.max(25, score);
};

export const useGameEngine = (walletAddress) => {
  const { trackEvent } = useTelemetry();

  // Task 2: Timer Purge (Deep Clean)
  useEffect(() => {
    localStorage.removeItem('axim_timer');
    localStorage.removeItem('axim_timeElapsed');
    localStorage.removeItem('axim_startTime');
    localStorage.removeItem('axim_bestTime');

    // Check axim_current_session for timer-related keys and purge them
    const currentSessionStr = localStorage.getItem('axim_current_session');
    if (currentSessionStr) {
      try {
        const session = JSON.parse(currentSessionStr);
        let modified = false;

        ['timer', 'timeElapsed', 'startTime', 'bestTime'].forEach(key => {
          if (key in session) {
            delete session[key];
            modified = true;
          }
        });

        if (modified) {
          localStorage.setItem('axim_current_session', JSON.stringify(session));
        }
      } catch(e) {
        // Ignored
      }
    }
  }, []);


  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const hasTrackedStart = useRef(false);
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState(() => {
    // Dynamic Session Synchronization check to ensure telemetry or initialization covers it
    const checkGlobalSession = () => {
      let sessionData = null;
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(c => c.trim().startsWith('axim_global_session='));
      if (sessionCookie) {
        try {
          const cookieVal = decodeURIComponent(sessionCookie.split('=')[1]);
          sessionData = JSON.parse(cookieVal);
        } catch (e) {
          sessionData = sessionCookie.split('=')[1];
        }
      }
      if (!sessionData) {
        sessionData = localStorage.getItem('axim_global_session');
      }
      return sessionData;
    };
    checkGlobalSession();

    const session = !isPracticeMode ? localStorage.getItem('axim_current_session') : null;
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.date === new Date().toDateString() && !isPracticeMode) {
          return parsed.guesses || [];
        }
      } catch (e) {
        console.error('Failed to parse session', e);
      }
    }
    return [];
  });

  const [currentGuess, setCurrentGuess] = useState('');





  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  const [score, setScore] = useState(() => {
    const session = !isPracticeMode ? localStorage.getItem('axim_current_session') : null;
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.date === new Date().toDateString() && !isPracticeMode) {

          return calculateScore((parsed.guesses || []).length, false);
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
  const [isWiping, setIsWiping] = useState(false);
  const [lifetimePracticeScore, setLifetimePracticeScore] = useState(() => {
    return parseInt(localStorage.getItem('axim_lifetime_practice_score') || '0', 10);
  });

  useEffect(() => {
    if (!hasTrackedStart.current && !gameOver) {
      trackEvent('GAME_STARTED', { timestamp: Date.now(), practiceMode: isPracticeMode });
      hasTrackedStart.current = true;
    }
  }, [gameOver, trackEvent, isPracticeMode]);

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'axim_current_session') {
        if (!e.newValue && !isPracticeMode) {
          // If session was flushed
          setGuesses([]);
          setScore(MAX_SCORE);
          setGameOver(false);
          setHasWon(false);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed.date === new Date().toDateString() && !isPracticeMode) {
              if (parsed.guesses !== undefined) {
                setGuesses(parsed.guesses);
                setScore(calculateScore(parsed.guesses.length, false));
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
  // Offline Sync Queue
  useEffect(() => {
    const handleOnline = () => {
      const pendingSyncStr = localStorage.getItem('axim_pending_sync');
      if (pendingSyncStr) {
        try {
          const pendingSync = JSON.parse(pendingSyncStr);
          fetch(import.meta.env.BASE_URL + 'api/user/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(pendingSync)
          }).then(response => {
            if (response.ok) {
              localStorage.removeItem('axim_pending_sync');
              console.log('[TELEMETRY] Successfully synced pending offline data.');
            }
          }).catch(err => {
            console.error('[TELEMETRY] Retry sync failed again.', err);
          });
        } catch (err) {
          console.error('Error parsing pending sync data', err);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    // Also try on mount in case they came online while closed
    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

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
      if (isPracticeMode) return;
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
          const provider = await getProvider(window.ethereum);
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


  // Offline Sync Flush (Edge Case Hardening)
  useEffect(() => {
    const flushPendingSync = async () => {
      const pendingSyncStr = localStorage.getItem('axim_pending_sync');
      if (navigator.onLine && pendingSyncStr) {
        try {
          const syncPayload = JSON.parse(pendingSyncStr);
          const response = await fetch(import.meta.env.BASE_URL + 'api/user/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(syncPayload)
          });

          if (response.status === 401) {
            handleAuthError();
          }

          if (response.ok) {
            localStorage.removeItem('axim_pending_sync');
            trackEvent('OFFLINE_SYNC_FLUSHED', { type: 'score_sync' });
          }
        } catch (err) {
          console.error('[TELEMETRY] Failed to flush pending sync on mount', err);
        }
      }
    };
    flushPendingSync();
  }, [trackEvent]);

  // Load persistent streak from local storage
  useEffect(() => {
    const savedStreak = localStorage.getItem('axim_streak');
    const lastPlayed = localStorage.getItem('axim_last_played');
    const today = new Date().toDateString();
    
    setStreak(savedStreak ? parseInt(savedStreak) : 3);
  }, []);


  // Session safety for length mismatch
  useEffect(() => {
    if (targetWord && guesses.length > 0) {
      if (guesses[0].length !== targetWord.length) {
        setGuesses([]);
        setCurrentGuess('');
        // Also clear local session since it's invalid
        if (!isPracticeMode) {
          localStorage.removeItem('axim_current_session');
        }
      }
    }
  }, [targetWord]);

  const startPracticeGame = useCallback(() => {
    setIsWiping(true);
    setTimeout(() => {
      const prevTargetWord = targetWord;
      setIsPracticeMode(true);
      setGuesses([]);
      setCurrentGuess('');
      setGameOver(false);
      setHasWon(false);
      setTargetWord(getRandomPracticeWord(prevTargetWord));
      setIsWiping(false);
    }, 300);
  }, [targetWord]);

  const skipPracticeWord = useCallback(() => {
    if (!isPracticeMode) return;

    setIsWiping(true);
    setTimeout(() => {
      const prevTargetWord = targetWord;
      setGuesses([]);
      setCurrentGuess('');
      setGameOver(false);
      setHasWon(false);
      setTargetWord(getRandomPracticeWord(prevTargetWord));
      setIsWiping(false);

      trackEvent('PRACTICE_WORD_SKIPPED', { previousWord: prevTargetWord });
    }, 300);
  }, [isPracticeMode, targetWord, trackEvent]);

  const submitGuess = useCallback((guessStr) => {
    if (gameOver || guessStr.length !== targetWord.length) return false;

    const upperGuess = guessStr.toUpperCase();
    const newGuesses = [...guesses, upperGuess];
    setGuesses(newGuesses);
    trackEvent('GUESS_SUBMITTED', { attemptNumber: newGuesses.length, guess: upperGuess, practiceMode: isPracticeMode });

    setCurrentGuess('');

    const newScore = calculateScore(newGuesses.length, isPracticeMode);
    setScore(newScore);

    const sessionData = {
      guesses: newGuesses,
      date: new Date().toDateString()
    };



    if (!isPracticeMode) {
      localStorage.setItem('axim_current_session', JSON.stringify(sessionData));
    }

    if (upperGuess === targetWord) {
      setGameOver(true);
      setHasWon(true);
      let currentEvaluatedStreak = streak;
      if (!isPracticeMode) {
        localStorage.removeItem('axim_current_session');

        const newStreak = streak + 1;
        setStreak(newStreak);
        localStorage.setItem('axim_streak', newStreak);
        localStorage.setItem('axim_last_played', new Date().toDateString());
        currentEvaluatedStreak = newStreak;

        // Update guess distribution
        const dist = JSON.parse(localStorage.getItem('axim_guess_distribution')) || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6+": 0 };
        const attempts = newGuesses.length;
        const bucket = attempts >= 6 ? "6+" : attempts.toString();
        dist[bucket] = (dist[bucket] || 0) + 1;
        localStorage.setItem('axim_guess_distribution', JSON.stringify(dist));
        window.dispatchEvent(new Event('storage')); // manually trigger storage event in same tab for GuessDistribution component
      } else {
        const updatedLifetimeScore = lifetimePracticeScore + newScore;
        setLifetimePracticeScore(updatedLifetimeScore);
        localStorage.setItem('axim_lifetime_practice_score', updatedLifetimeScore);

        if (walletAddress) {
          const syncPayload = {
            wallet_address: walletAddress,
            lifetime_practice_score: updatedLifetimeScore
          };
          try {
            fetch(import.meta.env.BASE_URL + 'api/user/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(syncPayload)
            }).then(response => {
              if (response.status === 401) {
                handleAuthError();
              }
              if (!response.ok) throw new Error('Sync response not ok');
            }).catch(err => {
              console.error('[TELEMETRY] Failed to sync lifetime score, queuing for offline sync.', err);
              localStorage.setItem('axim_pending_sync', JSON.stringify(syncPayload));
              trackEvent('OFFLINE_SYNC_QUEUED', { type: 'score_sync' });
            });
          } catch (err) {
            console.error('[TELEMETRY] Exception syncing lifetime score, queuing for offline sync.', err);
            localStorage.setItem('axim_pending_sync', JSON.stringify(syncPayload));
            trackEvent('OFFLINE_SYNC_QUEUED', { type: 'score_sync' });
          }
        }
      }
      

      evaluateBadges(newGuesses.length, currentEvaluatedStreak);
      trackEvent('GAME_COMPLETED', {
        hasWon: true,
        score: newScore,
        streak: currentEvaluatedStreak,

        practiceMode: isPracticeMode
      });

    }
    // We removed the hard fail state (newScore === 0) since there are unlimited attempts.
    
    return true;
  }, [gameOver, guesses, targetWord, streak, score, trackEvent, isPracticeMode]);


  const forfeitGame = useCallback(() => {
    if (gameOver) return;

    const newScore = 25; // guaranteed 25 points
    setScore(newScore);
    setGameOver(true);
    setHasWon(false);
    setGuesses(prev => [...prev, targetWord]);

    if (!isPracticeMode) {
      localStorage.removeItem('axim_current_session');
      localStorage.setItem('axim_last_played', new Date().toDateString());
    }

    trackEvent('GAME_COMPLETED', {
      hasWon: false,
      score: newScore,
      streak: streak,

      forfeit: true,
      practiceMode: isPracticeMode
    });
  }, [gameOver, streak, trackEvent, targetWord, isPracticeMode]);

  const evaluateBadges = (attempts, currentStreak) => {
    const newBadges = ['genesis'];

    if (attempts === 1) newBadges.push('flawless');
    if (currentStreak >= 3) newBadges.push('streak_3');
    setUnlockedBadges(newBadges);
  };

  const usedLetters = useMemo(() => {
    const letters = {};
    for (const guess of guesses) {
      for (let i = 0; i < guess.length; i++) {
        const char = guess[i];
        if (targetWord[i] === char) {
          letters[char] = 'correct'; // Priority to correct
        } else if (letters[char] !== 'correct' && targetWord.includes(char)) {
          letters[char] = 'present';
        } else if (!letters[char] && !targetWord.includes(char)) {
          letters[char] = 'absent';
        }
      }
    }
    return letters;
  }, [guesses, targetWord]);

    return {
    usedLetters,
    guesses,
    currentGuess,
    setCurrentGuess,
    score,
    gameOver,
    hasWon,
    submitGuess,
    forfeitGame,
    unlockedBadges,
    streak,
    targetWord,
    hasMintedToday,
    setHasMintedToday,
    isPracticeMode,
    startPracticeGame,
    lifetimePracticeScore,
    isWiping,
    skipPracticeWord,
    nextPuzzle: startPracticeGame
  };
};
