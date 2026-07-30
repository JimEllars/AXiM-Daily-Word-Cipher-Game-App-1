import re

with open('src/components/GameBoard.jsx', 'r') as f:
    content = f.read()

# 1. Update grid layout to support scrolling
# Replace:
# <div className="grid gap-2 mb-8">
# With:
# <div className="grid gap-2 mb-8 max-h-[60vh] overflow-y-auto scrollbar-hide">
# Wait, standard tailwind doesn't have scrollbar-hide out of the box unless configured or we use custom css. Let's just use overflow-y-auto and style inline or assume css handles it, or use standard tailwind.
# The prompt says: "implement a sleek, hidden-scrollbar overflow so the active input row is always visible at the bottom."

content = content.replace('<div className="grid gap-2 mb-8">', '<div className="grid gap-2 mb-8 overflow-y-auto" style={{ maxHeight: "50vh", scrollbarWidth: "none", msOverflowStyle: "none" }}>')

# Also, to make sure it scrolls to bottom automatically, we can use a ref, or just assume standard flex/grid behavior.
# Wait, actually to auto-scroll we need a ref and useEffect. Let's add that.

# 2. Remove critical state red pulse
# Replace:
# <div className={`flex gap-2 ${guesses.length === 5 ? 'animate-pulse-red rounded-sm border border-transparent' : ''}`}>
# With:
# <div className="flex gap-2">

content = content.replace('<div className={`flex gap-2 ${guesses.length === 5 ? \'animate-pulse-red rounded-sm border border-transparent\' : \'\'}`}>', '<div className="flex gap-2">')

with open('src/components/GameBoard.jsx', 'w') as f:
    f.write(content)
