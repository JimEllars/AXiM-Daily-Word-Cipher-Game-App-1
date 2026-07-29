export const generateScorecardImage = (guesses, targetWord, score, streak) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas dimensions
  canvas.width = 600;
  // Dynamic height based on guesses length + headers/footers
  const cellSize = 60;
  const gap = 10;
  const rows = Math.max(guesses.length, 1);
  const gridHeight = rows * (cellSize + gap);
  canvas.height = 300 + gridHeight;

  // Draw background (dark mode)
  ctx.fillStyle = '#0a0a0a'; // Dark gray/black background
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw title
  ctx.fillStyle = '#39ff14'; // Neon green
  ctx.font = 'bold 40px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('AXiM Cipher Decrypted!', canvas.width / 2, 80);

  // Draw Score & Streak
  ctx.fillStyle = '#ffffff'; // White text
  ctx.font = '24px monospace';
  ctx.fillText(`Score: ${score} | Streak: ${streak}🔥`, canvas.width / 2, 130);

  // Draw Grid
  const cols = 5;
  const gridWidth = cols * (cellSize + gap) - gap;
  const startX = (canvas.width - gridWidth) / 2;
  const startY = 180;

  guesses.forEach((guess, rIndex) => {
    for (let cIndex = 0; cIndex < cols; cIndex++) {
      const letter = guess[cIndex] || '';
      const targetLetter = targetWord[cIndex];

      let color = '#333333'; // Default dark gray
      if (letter === targetLetter) {
        color = '#39ff14'; // Neon green (like the board) or standard wordle green
        // Adjusting colors slightly for contrast/styling
      } else if (targetWord.includes(letter)) {
        color = '#eab308'; // Yellow/Gold
      }

      const x = startX + cIndex * (cellSize + gap);
      const y = startY + rIndex * (cellSize + gap);

      // Draw cell background
      ctx.fillStyle = color;
      ctx.fillRect(x, y, cellSize, cellSize);

      // Draw border
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cellSize, cellSize);

      // Draw letter
      if (letter) {
        ctx.fillStyle = '#ffffff';
        // Dark text for lighter backgrounds
        if (color === '#39ff14' || color === '#eab308') {
          ctx.fillStyle = '#000000';
        }
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter.toUpperCase(), x + cellSize / 2, y + cellSize / 2 + 2); // +2 for visual centering
      }
    }
  });

  // Draw footer
  ctx.fillStyle = '#888888';
  ctx.font = '20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Play at axim.us.com', canvas.width / 2, canvas.height - 40);

  // Return data URL
  return canvas.toDataURL('image/png');
};
