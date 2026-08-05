import re

with open('src/hooks/useGameEngine.js', 'r') as f:
    engine_content = f.read()

# Helper for handling auth error
auth_helper = """
const handleAuthError = () => {
  localStorage.removeItem('axim_sso_token');
  localStorage.removeItem('axim_global_session');
  document.cookie = "axim_global_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  window.dispatchEvent(new Event('axim_sso_expired'));

  // Custom toast dispatch
  const event = new CustomEvent('axim_toast', { detail: '[ SESSION EXPIRED: PLEASE RE-LOGIN ]' });
  window.dispatchEvent(event);
};
"""

# We need to insert auth_helper inside or outside the hook. Since it uses standard web APIs, it can be outside, but let's just make it a local function inside the hook.
engine_content = engine_content.replace(
    "const trackEvent = useTelemetry();",
    "const trackEvent = useTelemetry();\n\n  " + auth_helper
)

# Replace fetch calls with one that intercepts 401
sync_fetch1 = """          const response = await fetch(import.meta.env.BASE_URL + 'api/user/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(syncPayload)
          });

          if (response.ok) {"""

new_sync_fetch1 = """          const response = await fetch(import.meta.env.BASE_URL + 'api/user/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(syncPayload)
          });

          if (response.status === 401) {
            handleAuthError();
          }

          if (response.ok) {"""

engine_content = engine_content.replace(sync_fetch1, new_sync_fetch1)

sync_fetch2 = """            fetch(import.meta.env.BASE_URL + 'api/user/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(syncPayload)
            }).then(response => {
              if (!response.ok) throw new Error('Sync response not ok');
            }).catch(err => {"""

new_sync_fetch2 = """            fetch(import.meta.env.BASE_URL + 'api/user/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(syncPayload)
            }).then(response => {
              if (response.status === 401) {
                handleAuthError();
              }
              if (!response.ok) throw new Error('Sync response not ok');
            }).catch(err => {"""

engine_content = engine_content.replace(sync_fetch2, new_sync_fetch2)

with open('src/hooks/useGameEngine.js', 'w') as f:
    f.write(engine_content)

print("useGameEngine.js patched!")

with open('src/components/LoginButton.jsx', 'r') as f:
    login_content = f.read()

# Add listener for axim_sso_expired
login_listener = """    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);"""

new_login_listener = """    const handleSsoExpired = () => {
      setGlobalUser(null);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('axim_sso_expired', handleSsoExpired);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('axim_sso_expired', handleSsoExpired);
    };
  }, []);"""

login_content = login_content.replace(login_listener, new_login_listener)

with open('src/components/LoginButton.jsx', 'w') as f:
    f.write(login_content)

print("LoginButton.jsx patched!")

with open('src/App.jsx', 'r') as f:
    app_content = f.read()

toast_import = """import { useTelemetry } from './hooks/useTelemetry';"""
new_toast_import = """import { useTelemetry } from './hooks/useTelemetry';
import { Toast } from './components/Toast';"""
if "import { Toast }" not in app_content:
    app_content = app_content.replace(toast_import, new_toast_import)

toast_state = """  const [edgeHealth, setEdgeHealth] = useState(null);"""
new_toast_state = """  const [edgeHealth, setEdgeHealth] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const handleToast = (e) => {
      setToastMessage(e.detail);
      setTimeout(() => setToastMessage(null), 3000);
    };
    window.addEventListener('axim_toast', handleToast);
    return () => window.removeEventListener('axim_toast', handleToast);
  }, []);"""
app_content = app_content.replace(toast_state, new_toast_state)

toast_render = """      <AnimatePresence>
        {!isOnline && ("""
new_toast_render = """      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-red-600/90 text-white font-mono font-bold border-2 border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.5)] rounded-sm"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!isOnline && ("""
app_content = app_content.replace(toast_render, new_toast_render)

with open('src/App.jsx', 'w') as f:
    f.write(app_content)

print("App.jsx patched for toast!")
