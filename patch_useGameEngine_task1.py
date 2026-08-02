import re

with open('src/hooks/useGameEngine.js', 'r') as f:
    content = f.read()

# Replace the fetch call in submitGuess with try/catch and offline sync logic
search_block = """        if (walletAddress) {
          fetch(import.meta.env.BASE_URL + 'api/user/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              wallet_address: walletAddress,
              lifetime_practice_score: updatedLifetimeScore
            })
          }).catch(err => console.error('Failed to sync lifetime score', err));
        }"""

replace_block = """        if (walletAddress) {
          const syncPayload = {
            wallet_address: walletAddress,
            lifetime_practice_score: updatedLifetimeScore
          };
          try {
            fetch(import.meta.env.BASE_URL + 'api/user/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(syncPayload)
            }).then(response => {
              if (!response.ok) throw new Error('Sync response not ok');
            }).catch(err => {
              console.error('[TELEMETRY] Failed to sync lifetime score, queuing for offline sync.', err);
              localStorage.setItem('axim_pending_sync', JSON.stringify(syncPayload));
            });
          } catch (err) {
            console.error('[TELEMETRY] Exception syncing lifetime score, queuing for offline sync.', err);
            localStorage.setItem('axim_pending_sync', JSON.stringify(syncPayload));
          }
        }"""

content = content.replace(search_block, replace_block)

# Add useEffect for online event to handle pending sync
# Find the end of evaluateBadges useCallback (it's around line 150 maybe? No, let's just put it before return at the end of the hook)
# Actually let's just place it near the top of the hook, after initial state declarations.
# Let's search for `useEffect(() => {` and add it before the first one.

search_effect_block = """  useEffect(() => {
    if (hasWon) {"""

replace_effect_block = """  // Offline Sync Queue
  useEffect(() => {
    const handleOnline = () => {
      const pendingSyncStr = localStorage.getItem('axim_pending_sync');
      if (pendingSyncStr) {
        try {
          const pendingSync = JSON.parse(pendingSyncStr);
          fetch(import.meta.env.BASE_URL + 'api/user/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(pendingSync)
          }).then(response => {
            if (response.ok) {
              localStorage.removeItem('axim_pending_sync');
              console.log('[TELEMETRY] Successfully synced pending offline data.');
            }
          }).catch(err => {
            console.error('[TELEMETRY] Retry sync failed again.', err);
          });
        } catch (err) {
          console.error('Error parsing pending sync data', err);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    // Also try on mount in case they came online while closed
    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    if (hasWon) {"""

content = content.replace(search_effect_block, replace_effect_block)

with open('src/hooks/useGameEngine.js', 'w') as f:
    f.write(content)

print("Patched useGameEngine.js")
