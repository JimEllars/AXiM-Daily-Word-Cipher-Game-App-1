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

# Let's just prepend auth_helper to useGameEngine.js imports, meaning outside the hook.
engine_content = auth_helper + "\n" + engine_content

with open('src/hooks/useGameEngine.js', 'w') as f:
    f.write(engine_content)

print("useGameEngine.js patched!")
