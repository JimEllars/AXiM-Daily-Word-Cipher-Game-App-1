import re

with open('src/hooks/useGameEngine.js', 'r') as f:
    content = f.read()

new_score_logic = """const calculateScore = (attempts) => {
  if (attempts === 0) return 5000;
  if (attempts === 1) return 5000;
  if (attempts === 2) return 3000;
  if (attempts === 3) return 2000;
  if (attempts === 4) return 1000;
  if (attempts === 5) return 500;
  return 100;
};"""

content = re.sub(r'const calculateScore = \(attempts\) => \{[\s\S]*?return 100;\n\};', new_score_logic, content)

with open('src/hooks/useGameEngine.js', 'w') as f:
    f.write(content)
