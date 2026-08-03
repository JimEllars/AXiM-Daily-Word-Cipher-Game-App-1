with open('index.html', 'r') as f:
    content = f.read()

# Add rel="preload" and font-display: swap to Google Fonts link
search_font = """<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">"""
replace_font = """<link rel="preload" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"></noscript>"""

content = content.replace(search_font, replace_font)

with open('index.html', 'w') as f:
    f.write(content)

print("Patched index.html")
