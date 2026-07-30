with open('src/components/GameBoard.jsx', 'r') as f:
    content = f.read()

# Fix the duplicate className attribute
content = content.replace('className="grid gap-2 mb-8 overflow-y-auto" style={{ maxHeight: "50vh", scrollbarWidth: "none", msOverflowStyle: "none" }} className="grid gap-2 mb-8 overflow-y-auto [&::-webkit-scrollbar]:hidden"', 'className="grid gap-2 mb-8 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ maxHeight: "50vh", scrollbarWidth: "none", msOverflowStyle: "none" }}')

with open('src/components/GameBoard.jsx', 'w') as f:
    f.write(content)
