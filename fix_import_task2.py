with open('src/hooks/useGameEngine.js', 'r') as f:
    content = f.read()

# Fix static import
search_import = "import { WEB3_CONFIG } from '../config/web3';"
replace_import = "import { WEB3_CONFIG, getProvider } from '../config/web3';"
content = content.replace(search_import, replace_import)

# Fix usage
search_usage = """          const { getProvider } = await import('../config/web3.js');
          const provider = await getProvider(window.ethereum);"""
replace_usage = """          const provider = await getProvider(window.ethereum);"""
content = content.replace(search_usage, replace_usage)

with open('src/hooks/useGameEngine.js', 'w') as f:
    f.write(content)

print("Fixed imports in useGameEngine.js")
