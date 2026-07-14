import { useState, useEffect, useCallback } from 'react';

const MAX_SCORE = 10000;
const PENALTY_PER_ATTEMPT = 400;
const PENALTY_PER_SECOND = 8;
const WORD_LENGTH = 5;

export const useGameEngine = (targetWord) => {
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
    streak
  };
};