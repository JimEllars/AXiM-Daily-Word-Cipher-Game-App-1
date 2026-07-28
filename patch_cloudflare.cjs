const fs = require('fs');

let content = fs.readFileSync('docs/cloudflare-worker.js', 'utf8');

// Inside if (path === '/api/hint/today' && request.method === 'GET') {
const oldHintCode = `      if (path === '/api/hint/today' && request.method === 'GET') {
        const cache = caches.default;`;

const newHintCode = `      if (path === '/api/hint/today' && request.method === 'GET') {
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

        const cache = caches.default;`;

content = content.replace(oldHintCode, newHintCode);

fs.writeFileSync('docs/cloudflare-worker.js', content);
