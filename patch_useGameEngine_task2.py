with open('src/hooks/useGameEngine.js', 'r') as f:
    content = f.read()

# Replace provider instantiation
search_block = """          const provider = new ethers.BrowserProvider(window.ethereum);
          const CONTRACT_ADDRESS = WEB3_CONFIG.CONTRACT_ADDRESS;"""

replace_block = """          const { getProvider } = await import('../config/web3.js');
          const provider = await getProvider(window.ethereum);
          const CONTRACT_ADDRESS = WEB3_CONFIG.CONTRACT_ADDRESS;"""

content = content.replace(search_block, replace_block)

with open('src/hooks/useGameEngine.js', 'w') as f:
    f.write(content)

print("Patched useGameEngine.js for task 2")
