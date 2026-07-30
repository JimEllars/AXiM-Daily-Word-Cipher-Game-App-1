const APP_PREFIX = "/games/daily-word-cipher";
const DAILY_WORDS = [
  "BLOCK", "CHAIN", "TOKEN", "ETHER", "MINER", "VAULT", "NODES", "PROOF",
  "STAKE", "YIELD", "SWAPS", "COINS", "GASES", "HASHY", "LEDGE", "CRYPT",
  "ASSET", "SHARD", "SCALE", "PROXY",
];

const json = (value, init = {}) =>
  new Response(JSON.stringify(value), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...init.headers,
    },
  });

const getDayId = () => Math.floor(Date.now() / 86400000);

const getDailyWord = async (db, dayId) => {
  const puzzle = await db
    .prepare("SELECT word FROM daily_puzzles WHERE day_id = ? LIMIT 1")
    .bind(dayId)
    .first();

  return puzzle?.word?.toUpperCase() ?? DAILY_WORDS[dayId % DAILY_WORDS.length];
};

const getLeaderboard = async (db, type) => {
  const now = Date.now();
  const minDayId = type === "daily"
    ? getDayId()
    : type === "weekly"
      ? Math.floor((now - 7 * 86400000) / 86400000)
      : 0;
  const scoreColumn = type === "daily" ? "score" : "SUM(score)";

  const result = await db
    .prepare(`
      SELECT wallet_address AS user, ${scoreColumn} AS score
      FROM game_scores
      WHERE day_id >= ?
      GROUP BY wallet_address
      ORDER BY score DESC, MIN(created_at) ASC
      LIMIT 10
    `)
    .bind(minDayId)
    .all();

  return result.results.map((entry, index) => ({
    rank: index + 1,
    user: entry.user,
    score: entry.score,
  }));
};

const handleApiRequest = async (request, env, ctx, pathname) => {
  if (pathname === "/api/word/today" && request.method === "GET") {
    const word = await getDailyWord(env.DB, getDayId());
    return json(
      { word },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } },
    );
  }

  if (pathname === "/api/telemetry" && request.method === "POST") {
    const event = await request.json().catch(() => null);
    if (
      !event ||
      typeof event.eventName !== "string" ||
      event.eventName.length === 0 ||
      event.eventName.length > 100 ||
      typeof event.payload !== "object" ||
      event.payload === null
    ) {
      return json({ error: "Invalid telemetry event." }, { status: 400 });
    }

    const payload = JSON.stringify(event.payload);
    if (payload.length > 8192) {
      return json({ error: "Telemetry payload is too large." }, { status: 413 });
    }

    ctx.waitUntil(
      env.DB
        .prepare(
          "INSERT INTO telemetry_logs (event_name, payload, created_at) VALUES (?, ?, ?)",
        )
        .bind(event.eventName, payload, Date.now())
        .run(),
    );
    return json({ status: "accepted" }, { status: 202 });
  }

  if (pathname === "/api/leaderboard" && request.method === "GET") {
    const type = new URL(request.url).searchParams.get("type");
    if (!["daily", "weekly", "allTime"].includes(type)) {
      return json({ error: "Invalid leaderboard type." }, { status: 400 });
    }

    return json({ data: await getLeaderboard(env.DB, type) });
  }

  if (pathname === "/api/game/submit" && request.method === "POST") {
    return json(
      { error: "Token rewards are not active yet." },
      { status: 503 },
    );
  }

  return json({ error: "Not found." }, { status: 404 });
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith(APP_PREFIX)) {
      return new Response("Not found.", { status: 404 });
    }

    const pathname = url.pathname.slice(APP_PREFIX.length) || "/";
    if (pathname.startsWith("/api/")) {
      return handleApiRequest(request, env, ctx, pathname);
    }

    const assetUrl = new URL(request.url);
    assetUrl.pathname = pathname;
    return env.ASSETS.fetch(new Request(assetUrl, request));
  },
};
