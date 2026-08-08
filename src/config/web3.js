import { ethers } from 'ethers';

export const WEB3_CONFIG = {
  CHAIN_ID: import.meta.env.VITE_CHAIN_ID || 11155111, // Sepolia default
  CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890',
  EXPLORER_URL: import.meta.env.VITE_EXPLORER_URL || 'https://sepolia.etherscan.io',
  RPC_URLS: [
    import.meta.env.VITE_PRIMARY_RPC_URL || 'https://rpc.sepolia.org',
    import.meta.env.VITE_FALLBACK_RPC_URL || 'https://fallback.sepolia.rpc'
  ]
};

export const getProvider = async (ethereumProvider) => {
  const primaryRpc = WEB3_CONFIG.RPC_URLS[0];
  const fallbackRpc = WEB3_CONFIG.RPC_URLS[1];

  if (ethereumProvider) {
    try {
      const browserProvider = new ethers.BrowserProvider(ethereumProvider);
      // Wait for network with a 3 second timeout
      await Promise.race([
        browserProvider.getNetwork(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('RPC Timeout')), 3000))
      ]);
      return browserProvider;
    } catch (error) {

      console.warn('[TELEMETRY] Primary Web3 provider failed or timed out. Falling back to secondary RPC.', error);
      window.dispatchEvent(new CustomEvent('axim_rpc_fallback', {
        detail: { primary_rpc: primaryRpc, fallback_rpc: fallbackRpc, timestamp: Date.now() }
      }));
      // Fallback if browser provider fails (e.g. wrong network or rpc issue)
      return new ethers.JsonRpcProvider(fallbackRpc);

    }
  }

  // No ethereum provider, try primary then fallback
  try {
    const jsonProvider = new ethers.JsonRpcProvider(primaryRpc);
    await Promise.race([
      jsonProvider.getNetwork(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('RPC Timeout')), 3000))
    ]);
    return jsonProvider;
  } catch (error) {

    console.warn('[TELEMETRY] Primary RPC failed or timed out. Falling back to secondary RPC.', error);
    window.dispatchEvent(new CustomEvent('axim_rpc_fallback', {
      detail: { primary_rpc: primaryRpc, fallback_rpc: fallbackRpc, timestamp: Date.now() }
    }));
    return new ethers.JsonRpcProvider(fallbackRpc);

  }
};
