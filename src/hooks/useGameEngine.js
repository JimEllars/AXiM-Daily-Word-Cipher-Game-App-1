import { useState, useEffect, useCallback } from 'react';
import { FALLBACK_WORDS, getDailyWord } from '../constants/words';

const MAX_SCORE = 10000;
const PENALTY_PER_ATTEMPT = 400;
const PENALTY_PER_SECOND = 8;
const WORD_LENGTH = 5;

export const useGameEngine = () => {
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
      
      evaluateBadges(newGuesses.length, elapsed, newStreak);
    } else if (newScore === 0) {
      setGameOver(true);
      setHasWon(false);
      localStorage.removeItem('axim_current_session');
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
    targetWord
  };
};