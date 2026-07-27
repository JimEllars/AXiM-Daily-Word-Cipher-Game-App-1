export const WEB3_CONFIG = {
  CHAIN_ID: import.meta.env.VITE_CHAIN_ID || 11155111, // Sepolia default
  CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890',
  EXPLORER_URL: import.meta.env.VITE_EXPLORER_URL || 'https://sepolia.etherscan.io',
};
