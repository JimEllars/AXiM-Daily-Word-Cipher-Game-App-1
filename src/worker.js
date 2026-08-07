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


const rateLimits = new Map();
let lastCleanup = Date.now();

const checkRateLimit = (ip, endpoint, limit, windowMs = 60000) => {
  if (!ip) return true;
  const now = Date.now();

  if (now - lastCleanup > windowMs) {
    rateLimits.clear();
    lastCleanup = now;
  }

  const key = `${ip}:${endpoint}`;
  const record = rateLimits.get(key) || { count: 0, timestamp: now };

  if (now - record.timestamp > windowMs) {
    record.count = 1;
    record.timestamp = now;
  } else {
    record.count++;
  }

  rateLimits.set(key, record);
  return record.count <= limit;
};

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
  const clientIp = request.headers.get("cf-connecting-ip") || "unknown";
  if (pathname === "/api/health" && request.method === "GET") {
    return json({ status: "ok", edge: "cloudflare", timestamp: Date.now() }, { headers: { "Cache-Control": "no-cache" } });
  }


  if (pathname === "/api/hint/today" && request.method === "GET") {
    const dayId = getDayId();
    const word = await getDailyWord(env.DB, dayId);

    let hint = "A crucial element in the network.";

    try {
      if (env.AI) {
        const aiResponse = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
          messages: [
            { role: 'system', content: `You are a cyberpunk AI terminal. The secret word today is ${word}. Generate a cryptic, 10-word maximum hint. Do not reveal the word.` }
          ]
        });
        if (aiResponse && aiResponse.response) {
          hint = aiResponse.response;
        }
      }
    } catch (aiError) {
      console.error("AI Error", aiError);
    }

    const now = new Date();
    const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const secondsUntilMidnight = Math.floor((nextMidnight.getTime() - now.getTime()) / 1000);

    return json(
      { hint },
      { headers: { "Cache-Control": `public, max-age=3600, s-maxage=${secondsUntilMidnight}` } },
    );
  }

  if (pathname === "/api/word/today" && request.method === "GET") {
    const word = await getDailyWord(env.DB, getDayId());
    const now = new Date();
    const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const secondsUntilMidnight = Math.floor((nextMidnight.getTime() - now.getTime()) / 1000);
    return json(
      { word },
      { headers: { "Cache-Control": `public, max-age=300, s-maxage=${secondsUntilMidnight}` } },
    );
  }

  if (pathname === "/api/telemetry" && request.method === "POST") {
    if (!checkRateLimit(clientIp, "/api/telemetry", 60)) {
      return json({ error: "Rate limit exceeded. Retry shortly." }, { status: 429 });
    }

    const event = await request.json().catch(() => null);
    if (!event) {
      return json({ error: "Invalid telemetry event." }, { status: 400 });
    }

    let event_name = event.event_name || event.eventName;
    let user_id = event.user_id || event.payload?.user_id || "anonymous";
    let is_practice_raw = event.is_practice !== undefined ? event.is_practice : (event.payload?.practiceMode ? true : false);
    let timestamp = event.timestamp || Date.now();

    if (typeof event_name !== "string" || event_name.length === 0 || event_name.length > 64) {
      return json({ error: "Invalid event_name." }, { status: 400 });
    }

    if (typeof user_id !== "string" || user_id.length > 128) {
      return json({ error: "Invalid user_id." }, { status: 400 });
    }

    if (!Number.isInteger(timestamp)) {
      return json({ error: "Invalid timestamp." }, { status: 400 });
    }

    if (typeof is_practice_raw !== "boolean" && typeof is_practice_raw !== "number") {
      return json({ error: "Invalid is_practice." }, { status: 400 });
    }
    let is_practice = !!is_practice_raw;

    let metadataStr = "{}";
    const rawMetadata = event.metadata || event.payload;
    if (rawMetadata && typeof rawMetadata === "object") {
      try {
        metadataStr = JSON.stringify(rawMetadata);
      } catch(e) {
        return json({ error: "Invalid metadata." }, { status: 400 });
      }
    }

    if (metadataStr.length > 2048) {
      return json({ error: "Telemetry metadata is too large." }, { status: 400 });
    }

    let metadata = metadataStr;

    ctx.waitUntil(
      (async () => {
        try {
          // Attempt to create TelemetryEvents if it doesn't exist
          await env.DB.prepare(
            "CREATE TABLE IF NOT EXISTS TelemetryEvents (id INTEGER PRIMARY KEY AUTOINCREMENT, event_name TEXT NOT NULL, user_id TEXT, is_practice INTEGER, timestamp INTEGER, metadata TEXT)"
          ).run();

          await env.DB.prepare(
            "INSERT INTO TelemetryEvents (event_name, user_id, is_practice, timestamp, metadata) VALUES (?, ?, ?, ?, ?)"
          ).bind(event_name, user_id, is_practice ? 1 : 0, timestamp, metadata).run();
        } catch (err) {
          // Fallback to telemetry_logs
          await env.DB.prepare(
            "INSERT INTO telemetry_logs (event_name, payload, created_at) VALUES (?, ?, ?)"
          ).bind(event_name, metadata, timestamp).run();
        }
      })()
    );
    return json({ status: "accepted" }, { status: 202 });
  }

  if (pathname === "/api/user/sync" && request.method === "POST") {
    if (!checkRateLimit(clientIp, "/api/user/sync", 20)) {
      return json({ error: "Rate limit exceeded. Retry shortly." }, { status: 429 });
    }

    try {
      const data = await request.json();

      const authHeader = request.headers.get("Authorization");
      let token = data.sso_token;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }

      let sso_user_id = null;
      let sso_email = null;
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.exp && Date.now() >= payload.exp * 1000) {
              return json({ error: "Token expired" }, { status: 401 });
            }
            sso_user_id = payload.user_id || payload.sub;
            sso_email = payload.email;
          } else {
            sso_user_id = token;
          }
        } catch(e) {
          sso_user_id = token;
        }
      }

      // Explicitly ignore legacy time-based payload fields
      const { time_elapsed, timer, ...sanitizedData } = data;

      let { wallet_address, score, streak, lifetime_practice_score, badges } = sanitizedData;

      const identifier = sso_user_id || wallet_address;

      if (!identifier) {
        return json({ error: "Missing identifier (wallet_address or sso_token)" }, { status: 400 });
      }

      const existing = await env.DB.prepare(
        "SELECT * FROM UserStates WHERE wallet_address = ?"
      ).bind(identifier).first();

      const finalScore = score !== undefined ? score : (existing ? existing.score : 0);
      const finalStreak = streak !== undefined ? streak : (existing ? existing.streak : 0);
      const finalPracticeScore = lifetime_practice_score !== undefined ? lifetime_practice_score : (existing && existing.lifetime_practice_score !== undefined ? existing.lifetime_practice_score : 0);

      try {
        await env.DB.prepare(
          "INSERT OR REPLACE INTO UserStates (wallet_address, score, streak, last_played, lifetime_practice_score) VALUES (?, ?, ?, ?, ?)"
        ).bind(identifier, finalScore, finalStreak, Date.now(), finalPracticeScore).run();
      } catch (e) {
        // Fallback if lifetime_practice_score column does not exist
        await env.DB.prepare(
          "INSERT OR REPLACE INTO UserStates (wallet_address, score, streak, last_played) VALUES (?, ?, ?, ?)"
        ).bind(identifier, finalScore, finalStreak, Date.now()).run();
      }

      return json({ status: "success" });
    } catch (error) {
      console.error(error);
      return json({ error: "Database operation failed" }, { status: 500 });
    }
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
