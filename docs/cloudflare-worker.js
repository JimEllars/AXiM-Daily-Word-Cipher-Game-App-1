import { ethers } from 'ethers';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;


    try {
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
        const dayId = Math.floor(Date.now() / 86400000);

        // In production, fetch targetWord from DB
        const targetWord = "CHAIN"; 

        if (final_guess.toUpperCase() !== targetWord) {
          return new Response(JSON.stringify({ error: "Invalid solution" }), { status: 400, headers: corsHeaders });
        }

        let score = 10000 - (attempts * 400) - (time_elapsed * 8);
        score = Math.max(0, score);

        const walletAddress = wallet.toLowerCase();
        const signer = new ethers.Wallet(env.SIGNER_PRIVATE_KEY);
        
        const messageHash = ethers.solidityPackedKeccak256(
            ['address', 'uint256', 'uint256'],
            [walletAddress, score, dayId]
        );
        
        const signature = await signer.signMessage(ethers.getBytes(messageHash));

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
      return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
  }
};