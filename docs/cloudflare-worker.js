import { ethers } from 'ethers';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Daily word list for the cipher
const DAILY_WORDS = [
  "BLOCK", "CHAIN", "TOKEN", "ETHER", "MINER", "VAULT", "NODES", "PROOF", "STAKE", "YIELD",
  "SWAPS", "COINS", "GASES", "HASHY", "LEDGE", "CRYPT", "ASSET", "SHARD", "SCALE", "PROXY"
];

// Fallback words
const FALLBACK_WORDS = [
  "ERROR", "CRASH", "DEBUG", "FAULT", "BRICK"
];

const getDailyWordDeterministic = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // Deterministic index based on the day of the year
  const index = dayOfYear % DAILY_WORDS.length;
  return DAILY_WORDS[index];
};

const getWordForToday = async (env, dayId) => {
  try {
    if (env.DB) {
      const query = "SELECT word FROM DailyPuzzles WHERE day_id = ? LIMIT 1";
      const { results } = await env.DB.prepare(query).bind(dayId).all();
      if (results && results.length > 0 && results[0].word) {
        return results[0].word.toUpperCase();
      }
    }
  } catch (dbError) {
    console.error("DB Error fetching daily word", dbError);
  }
  return getDailyWordDeterministic().toUpperCase();
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;


    try {
      if (path === '/api/telemetry' && request.method === 'POST') {
        const processTelemetry = async () => {
          try {
            // Read body text first in case it's not JSON
            const reqBody = await request.clone().json();

            if (env.DB) {
              const eventType = reqBody.eventName || reqBody.event_type || 'UNKNOWN';
              const walletAddress = reqBody.payload?.walletAddress || reqBody.wallet_address || null;
              const metadata = JSON.stringify(reqBody.payload || reqBody.metadata || {});
              const createdAt = Date.now();

              const query = "INSERT INTO TelemetryLogs (event_type, wallet_address, metadata, created_at) VALUES (?, ?, ?, ?)";
              await env.DB.prepare(query).bind(
                eventType,
                walletAddress,
                metadata,
                createdAt
              ).run();
            }
          } catch (telemetryError) {
            console.error("Telemetry error", telemetryError);
          }
        };

        if (ctx && ctx.waitUntil) {
          ctx.waitUntil(processTelemetry());
        } else {
          await processTelemetry();
        }

        return new Response(JSON.stringify({ status: 'success' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (path === '/api/admin/telemetry' && request.method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;

        if (!token || token !== env.ADMIN_SECRET_KEY) {
          return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        }

        try {
          if (env.DB) {
            // Get the last 1000 events
            const query = "SELECT * FROM TelemetryLogs ORDER BY created_at DESC LIMIT 1000";
            const { results } = await env.DB.prepare(query).all();

            return new Response(JSON.stringify(results), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          } else {
            return new Response(JSON.stringify({ error: 'Database not available' }), { status: 500, headers: corsHeaders });
          }
        } catch (dbError) {
          console.error("DB Error", dbError);
          return new Response(JSON.stringify({ error: 'Database error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      if (path === '/api/hint/today' && request.method === 'GET') {
        // RATE LIMITING
        const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
        if (env.DB && clientIP !== 'unknown') {
          // Ensure table exists
          try {
            await env.DB.prepare(`
              CREATE TABLE IF NOT EXISTS HintRateLimits (
                ip TEXT,
                timestamp INTEGER
              )
            `).run();

            // Cleanup older than 24 hours
            const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
            await env.DB.prepare('DELETE FROM HintRateLimits WHERE timestamp < ?').bind(dayAgo).run();

            // Check count
            const countResult = await env.DB.prepare('SELECT COUNT(*) as count FROM HintRateLimits WHERE ip = ?').bind(clientIP).first();
            if (countResult && countResult.count >= 3) {
              return new Response(JSON.stringify({ error: 'Too Many Requests: Daily hint limit reached.' }), {
                status: 429,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }

            // Insert new request
            await env.DB.prepare('INSERT INTO HintRateLimits (ip, timestamp) VALUES (?, ?)').bind(clientIP, Date.now()).run();
          } catch (rlError) {
            console.error('Rate limiting error', rlError);
          }
        }

        // TURNSTILE VALIDATION
        const turnstileToken = request.headers.get('Authorization') || request.headers.get('X-Turnstile-Token');
        const turnstileSecret = env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';

        if (!turnstileToken) {
          return new Response(JSON.stringify({ error: "Missing Turnstile token" }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const formData = new FormData();
        formData.append('secret', turnstileSecret);
        formData.append('response', turnstileToken.replace('Bearer ', ''));

        const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          body: formData
        });

        const turnstileData = await turnstileRes.json();

        if (!turnstileData.success) {
          return new Response(JSON.stringify({ error: "Turnstile validation failed" }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const cache = caches.default;
        const cacheKey = new Request(url.toString(), request);
        let response = await cache.match(cacheKey);

        if (!response) {
          const dayId = Math.floor(Date.now() / 86400000);
          const targetWord = await getWordForToday(env, dayId);

          try {
            const aiResponse = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
              messages: [
                { role: 'system', content: `You are a cyberpunk AI terminal. The secret word today is ${targetWord}. Generate a cryptic, 10-word maximum hint. Do not reveal the word.` }
              ]
            });

            response = new Response(JSON.stringify({ hint: aiResponse.response }), {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Cache-Control': 's-maxage=86400'
              }
            });

            // Cache the response
            // We clone the response to cache it because we will send the original response back to the client
            ctx.waitUntil(cache.put(cacheKey, response.clone()));

          } catch (aiError) {
            console.error("AI Error", aiError);
            response = new Response(JSON.stringify({ error: 'AI hint generation failed' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }

        // We need to return a new Response with corsHeaders from the cached response
        // because the cached response might be missing them if we aren't careful, but we added them above.
        // Wait, cache API needs a Response object. If it is cached, we just return it.
        // However, we need to ensure CORS headers are present.
        const responseHeaders = new Headers(response.headers);
        for (const [key, value] of Object.entries(corsHeaders)) {
          responseHeaders.set(key, value);
        }

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        });
      }

      if (path === '/api/word/today' && request.method === 'GET') {
        const dayId = Math.floor(Date.now() / 86400000);
        const word = await getWordForToday(env, dayId);
        return new Response(JSON.stringify({ word }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (path === '/api/leaderboard' && request.method === 'GET') {
        const type = url.searchParams.get('type') || 'allTime';

        let query = "SELECT username as user, total_all_time_score as score FROM Users WHERE total_all_time_score > 0 ORDER BY total_all_time_score DESC LIMIT 10";
        // If type is daily, fallback to allTime for now as schema isn't fully set

        try {
          const { results } = await env.DB.prepare(query).all();

          // Map to format required by frontend
          const formattedData = results.map((row, index) => ({
            rank: index + 1,
            user: row.user,
            score: row.score
          }));

          return new Response(JSON.stringify({ data: formattedData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (dbError) {
          console.error("DB Error", dbError);
          return new Response(JSON.stringify({ error: 'Database error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      if (path === '/api/game/submit' && request.method === 'POST') {
        const body = await request.json();
        const { wallet, attempts, time_elapsed, final_guess } = body;

        const turnstileToken = body['cf-turnstile-response'];
        const turnstileSecret = env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';

        if (!turnstileToken) {
          return new Response(JSON.stringify({ error: "Missing Turnstile token" }), { status: 403, headers: corsHeaders });
        }

        const formData = new FormData();
        formData.append('secret', turnstileSecret);
        formData.append('response', turnstileToken);

        const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          body: formData
        });

        const turnstileData = await turnstileRes.json();

        if (!turnstileData.success) {
          return new Response(JSON.stringify({ error: "Turnstile validation failed" }), { status: 403, headers: corsHeaders });
        }

        const dayId = Math.floor(Date.now() / 86400000);

        // Fetch targetWord from DB or fallback deterministically
        const targetWord = await getWordForToday(env, dayId);

        if (!final_guess || final_guess.toUpperCase() !== targetWord) {
          return new Response(JSON.stringify({ error: "Invalid solution" }), { status: 400, headers: corsHeaders });
        }

        let score = 10000 - (attempts * 400) - (time_elapsed * 8);
        score = Math.max(0, score);

        const walletAddress = wallet.toLowerCase();
        
        let signature = "mock_signature_for_dev";
        if (env.SIGNER_PRIVATE_KEY) {
          const signer = new ethers.Wallet(env.SIGNER_PRIVATE_KEY);

          const messageHash = ethers.solidityPackedKeccak256(
              ['address', 'uint256', 'uint256'],
              [walletAddress, score, dayId]
          );

          signature = await signer.signMessage(ethers.getBytes(messageHash));
        }

        return new Response(JSON.stringify({
          status: 'success',
          score: score,
          dayId: dayId,
          signature: signature
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
  }
};
