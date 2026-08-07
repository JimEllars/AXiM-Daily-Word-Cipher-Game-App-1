export const WORDS_3 = ["CAT", "DOG", "SUN", "RUN", "BAT", "ART", "BOX", "CAR", "CUP", "DAY"];
export const WORDS_4 = ["BIRD", "FISH", "TREE", "STAR", "BOOK", "DOOR", "FIRE", "GOLD", "TIME", "WIND"];
export const WORDS_5 = ["BLOCK", "CHAIN", "TOKEN", "ETHER", "MINER", "VAULT", "NODES", "PROOF", "STAKE", "YIELD",
  "SWAPS", "COINS", "GASES", "HASHY", "LEDGE", "CRYPT", "ASSET", "SHARD", "SCALE", "PROXY"];
export const WORDS_6 = ["PLANET", "ROCKET", "SYSTEM", "GALAXY", "STREAM", "FOREST", "SILVER", "NATURE", "OCEANS", "CLOUDS"];

export const SEASONAL_WORDS = {
  5: ["BEACH", "TOWEL", "HEAT", "OCEAN"], // June (Month 5)
  6: ["BEACH", "TOWEL", "HEAT", "OCEAN"], // July (Month 6)
  7: ["BEACH", "TOWEL", "HEAT", "OCEAN"], // August (Month 7)
  10: ["TURKEY", "YAMS", "FEAST", "AUTUMN"], // November (Month 10)
  11: ["GIFT", "SNOW", "COLD", "WINTER", "FROSTY"] // December (Month 11)
};

export const FALLBACK_WORDS = ["ERROR", "CRASH", "DEBUG", "FAULT", "BRICK"];

export const getDailyWord = () => {
  const now = new Date();
  const month = now.getMonth();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  if (SEASONAL_WORDS[month]) {
    const seasonalList = SEASONAL_WORDS[month];
    const index = dayOfYear % seasonalList.length;
    return seasonalList[index];
  }

  const allStandardWords = [...WORDS_3, ...WORDS_4, ...WORDS_5, ...WORDS_6];
  const index = dayOfYear % allStandardWords.length;
  return allStandardWords[index];
};

export const getRandomPracticeWord = (currentWord) => {
  const allWords = [...WORDS_3, ...WORDS_4, ...WORDS_5, ...WORDS_6];
  const availableWords = allWords.filter(w => w !== currentWord);
  if (availableWords.length === 0) return allWords[0];
  const randomIndex = Math.floor(Math.random() * availableWords.length);
  return availableWords[randomIndex];
};
