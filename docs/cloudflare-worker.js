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
        // D1 Query Stub based on type: SELECT username, total_all_time_score as score FROM Users ORDER BY score DESC LIMIT 10
        const dummyData = {
          data: [
            { rank: 1, user: "0x1234...abcd", score: 10000 },
            { rank: 2, user: "0x5678...ef01", score: 9500 },
            { rank: 3, user: "0x9abc...2345", score: 9000 }
          ]
        };
        return new Response(JSON.stringify(dummyData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
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