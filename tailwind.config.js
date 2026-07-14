/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-green': '#00ff66',
        'neon-pink': '#ff007f',
        'bg-dark': '#0d0d13',
        'surface-dark': '#1a1a26',
        'tile-correct': '#1b4d22',
        'tile-present': '#7c6a06',
        'tile-absent': '#2b2b36',
      },
      fontFamily: {
        mono: ['"Courier New"', 'Courier', 'monospace'],
        cyber: ['"Press Start 2P"', 'cursive', 'monospace'],
      },
      boxShadow: {
        'neon-green': '0 0 10px rgba(0, 255, 102, 0.5), 0 0 20px rgba(0, 255, 102, 0.3)',
        'neon-pink': '0 0 10px rgba(255, 0, 127, 0.5), 0 0 20px rgba(255, 0, 127, 0.3)',
        'panel': '0 0 15px rgba(0, 255, 102, 0.1)',
      },
      textShadow: {
        'neon': '0 0 5px rgba(0, 255, 102, 0.5)',
        'neon-pink': '0 0 5px rgba(255, 0, 127, 0.5)',
      }
    },
  },
  plugins: [],
}