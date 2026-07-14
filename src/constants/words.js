// Daily word list for the cipher
export const DAILY_WORDS = [
  "BLOCK", "CHAIN", "TOKEN", "ETHER", "MINER", "VAULT", "NODES", "PROOF", "STAKE", "YIELD",
  "SWAPS", "COINS", "GASES", "HASHY", "LEDGE", "CRYPT", "ASSET", "SHARD", "SCALE", "PROXY"
];

export const getDailyWord = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  // Deterministic index based on the day of the year
  const index = dayOfYear % DAILY_WORDS.length;
  return DAILY_WORDS[index];
};