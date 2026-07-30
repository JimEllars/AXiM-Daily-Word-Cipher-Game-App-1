import re

with open('src/components/GameBoard.jsx', 'r') as f:
    content = f.read()

# Add ref for auto-scrolling
if "const boardRef = useRef(null);" not in content:
    content = content.replace("const turnstileContainerRef = useRef(null);", "const turnstileContainerRef = useRef(null);\n  const boardRef = useRef(null);")

    scroll_effect = """
  useEffect(() => {
    if (boardRef.current) {
      boardRef.current.scrollTop = boardRef.current.scrollHeight;
    }
  }, [guesses]);
"""
    content = content.replace("useEffect(() => {\n    if (isTurnstileRequired", scroll_effect + "\n  useEffect(() => {\n    if (isTurnstileRequired")

content = content.replace('<div className="grid gap-2 mb-8 overflow-y-auto" style={{ maxHeight: "50vh", scrollbarWidth: "none", msOverflowStyle: "none" }}>', '<div ref={boardRef} className="grid gap-2 mb-8 overflow-y-auto" style={{ maxHeight: "50vh", scrollbarWidth: "none", msOverflowStyle: "none" }}>')

# add css for webkit scrollbar hide inline to style since tailwind scrollbar-hide might not exist
content = content.replace('style={{ maxHeight: "50vh", scrollbarWidth: "none", msOverflowStyle: "none" }}', 'style={{ maxHeight: "50vh", scrollbarWidth: "none", msOverflowStyle: "none" }} className="grid gap-2 mb-8 overflow-y-auto [&::-webkit-scrollbar]:hidden"')


with open('src/components/GameBoard.jsx', 'w') as f:
    f.write(content)
