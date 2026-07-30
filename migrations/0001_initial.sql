CREATE TABLE IF NOT EXISTS daily_puzzles (
  day_id INTEGER PRIMARY KEY,
  word TEXT NOT NULL CHECK(length(word) = 5),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS game_scores (
  wallet_address TEXT NOT NULL,
  day_id INTEGER NOT NULL,
  score INTEGER NOT NULL CHECK(score >= 0),
  attempts INTEGER NOT NULL CHECK(attempts > 0),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (wallet_address, day_id)
);

CREATE INDEX IF NOT EXISTS game_scores_day_score
  ON game_scores (day_id, score DESC, created_at ASC);

CREATE TABLE IF NOT EXISTS telemetry_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
