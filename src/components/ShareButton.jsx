import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { generateScorecardImage } from '../utils/canvasExport';

const { FiShare2, FiCheck, FiTwitter, FiDownload } = FiIcons;

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

    let distributionText = '';
    const dist = JSON.parse(localStorage.getItem('axim_guess_distribution'));
    if (dist) {
      distributionText = '\nStats:\n';
      ["1", "2", "3", "4", "5", "6+"].forEach(key => {
        const count = dist[key] || 0;
        distributionText += `${key}: ${'🟩'.repeat(count)}\n`;
      });
    }

    return `AXiM Cipher Decrypted! 🔓\nScore: ${score} | Streak: ${streak}🔥\n${emojiBoard}${distributionText}\nPlay at axim.us.com`;
  };



  const handleXShare = () => {
    const textToShare = generateShareText();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToShare)}`;
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    const textToShare = generateShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AXiM Cipher',
          text: textToShare,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Failed to share: ', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(textToShare);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  const handleDownload = () => {
    const dataUrl = generateScorecardImage(guesses, targetWord, score, streak);
    const link = document.createElement('a');
    link.download = 'axim-cipher-result.png';
    link.href = dataUrl;
    link.click();
  };


  const isViral = streak >= 7;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
      <button
        onClick={handleShare}
        className={`bg-transparent border-2 py-3 px-8 text-lg font-bold font-cyber transition-all flex items-center justify-center gap-2 ${
          copied
            ? 'border-neon-green text-neon-green shadow-neon-green bg-neon-green/10'
            : isViral
              ? 'border-neon-green text-neon-green hover:bg-neon-green/10 shadow-[0_0_15px_#39ff14] animate-pulse'
              : 'border-neon-pink text-neon-pink shadow-neon-pink hover:bg-neon-pink/10'
        }`}
      >
        <SafeIcon icon={copied ? FiCheck : FiShare2} />
        {copied ? dict.copied : dict.shareBtn}
      </button>

      <button
        onClick={handleXShare}
        className="bg-transparent border-2 border-blue-400 text-blue-400 py-3 px-8 text-lg font-bold font-cyber transition-all flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(96,165,250,0.5)] hover:bg-blue-400/10"
      >
        <SafeIcon icon={FiTwitter} />
        Post to X
      </button>
      </div>
      <button
        onClick={handleDownload}
        className="bg-transparent border-2 border-green-400 text-green-400 py-3 px-8 text-lg font-bold font-cyber transition-all flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(74,222,128,0.5)] hover:bg-green-400/10"
      >
        <SafeIcon icon={FiDownload} />
        Download Image
      </button>
    </div>
  );
};

export default ShareButton;
