with open('src/components/GameBoard.jsx', 'r') as f:
    content = f.read()

content = content.replace("const GameBoard = ({ guesses, currentGuess, targetWord, onForfeit, gameOver }) => {", "const GameBoard = ({ guesses, currentGuess, targetWord, onForfeit, gameOver, startPracticeGame }) => {")

buttons = """            <div className="mb-6 flex gap-4">
        <AnimatePresence>
          {guesses.length >= 4 && !hint && !isHintLoading && !hintError && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={fetchHint}
              className="py-2 px-4 border-2 border-yellow-400 text-yellow-400 font-cyber text-sm font-bold shadow-[0_0_10px_rgba(250,204,21,0.5),_0_0_20px_rgba(250,204,21,0.3)] hover:bg-yellow-400 hover:text-black transition-all"
            >
              [ REQUEST AI DECRYPTION HINT ]
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!gameOver && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForfeitModal(true)}
              className="py-2 px-4 border-2 border-red-500 text-red-500 font-cyber text-sm font-bold shadow-[0_0_10px_rgba(239,68,68,0.5),_0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-500 hover:text-white transition-all"
            >
              [ FORFEIT & REVEAL CIPHER ]
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gameOver && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={startPracticeGame}
              className="py-2 px-4 border-2 border-neon-green text-neon-green font-cyber text-sm font-bold shadow-[0_0_10px_rgba(0,255,157,0.5),_0_0_20px_rgba(0,255,157,0.3)] hover:bg-neon-green hover:text-black transition-all"
            >
              [ PLAY AGAIN ]
            </motion.button>
          )}
        </AnimatePresence>
      </div>"""

old_buttons = """            <div className="mb-6 flex gap-4">
        <AnimatePresence>
          {guesses.length >= 4 && !hint && !isHintLoading && !hintError && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={fetchHint}
              className="py-2 px-4 border-2 border-yellow-400 text-yellow-400 font-cyber text-sm font-bold shadow-[0_0_10px_rgba(250,204,21,0.5),_0_0_20px_rgba(250,204,21,0.3)] hover:bg-yellow-400 hover:text-black transition-all"
            >
              [ REQUEST AI DECRYPTION HINT ]
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!gameOver && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForfeitModal(true)}
              className="py-2 px-4 border-2 border-red-500 text-red-500 font-cyber text-sm font-bold shadow-[0_0_10px_rgba(239,68,68,0.5),_0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-500 hover:text-white transition-all"
            >
              [ FORFEIT & REVEAL CIPHER ]
            </motion.button>
          )}
        </AnimatePresence>
      </div>"""

content = content.replace(old_buttons, buttons)

with open('src/components/GameBoard.jsx', 'w') as f:
    f.write(content)
