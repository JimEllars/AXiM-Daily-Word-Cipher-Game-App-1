import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiShare2, FiCheck } = FiIcons;

const ShareButton = ({ dict, guesses, targetWord, score, streak }) => {
  const [copied, setCopied] = useState(false);

  const generateShareText = () => {
    let emojiBoard = '';
    guesses.forEach(guess => {
      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === targetWord[i]) {
          emojiBoard += '🟩';
        } else if (targetWord.includes(guess[i])) {
          emojiBoard += '🟨';
        } else {
          emojiBoard += '⬛';
        }
      }
      emojiBoard += '\n';
    });

    return `AXiM Cipher Decrypted! 🔓\nScore: ${score} | Streak: ${streak}🔥\n${emojiBoard}Play at axim.us.com`;
  };

  const handleShare = async () => {
    const textToShare = generateShareText();
    try {
      await navigator.clipboard.writeText(textToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`bg-transparent border-2 py-3 px-8 text-lg font-bold font-cyber transition-all flex items-center justify-center gap-2 ${
        copied
          ? 'border-neon-green text-neon-green shadow-neon-green bg-neon-green/10'
          : 'border-neon-pink text-neon-pink shadow-neon-pink hover:bg-neon-pink/10'
      }`}
    >
      <SafeIcon icon={copied ? FiCheck : FiShare2} />
      {copied ? dict.copied : dict.shareBtn}
    </button>
  );
};

export default ShareButton;
