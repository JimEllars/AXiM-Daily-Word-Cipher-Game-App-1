import re

with open('src/hooks/useGameEngine.js', 'r') as f:
    content = f.read()

# Define score tiers function
new_score_logic = """
const calculateScore = (attempts) => {
  if (attempts === 1) return 5000;
  if (attempts === 2) return 3000;
  if (attempts === 3) return 2000;
  if (attempts === 4) return 1000;
  if (attempts === 5) return 500;
  return 100;
};
"""

# Replace `setAccumulatedSeconds`, `setElapsedSeconds`, `setScore` logic in `handleStorageChange`
content = re.sub(r"if \(parsed.accumulatedSeconds !== undefined\) setAccumulatedSeconds\(parsed.accumulatedSeconds\);\s*if \(parsed.elapsedSeconds !== undefined\) setElapsedSeconds\(parsed.elapsedSeconds\);\s*if \(parsed.score !== undefined\) setScore\(parsed.score\);",
    "if (parsed.score !== undefined) setScore(parsed.score);", content)
content = re.sub(r"setAccumulatedSeconds\(0\);\s*setElapsedSeconds\(0\);\s*setScore\(MAX_SCORE\);",
    "setScore(MAX_SCORE);", content)

# Remove the interval block
content = re.sub(r"useEffect\(\(\) => \{\s*if \(gameOver\) return;.*?\}, \[sessionStart, accumulatedSeconds, gameOver, guesses\.length\]\);", "", content, flags=re.DOTALL)

# Let's completely rewrite `src/hooks/useGameEngine.js` by taking the existing one and modifying it.
