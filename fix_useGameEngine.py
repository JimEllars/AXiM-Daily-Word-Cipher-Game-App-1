with open('src/hooks/useGameEngine.js', 'r') as f:
    engine_content = f.read()

auth_helper_wrong_pos = """
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

# Find inner insertion and remove it
engine_content = engine_content.replace("const trackEvent = useTelemetry();\n\n  " + auth_helper_wrong_pos, "const trackEvent = useTelemetry();")

with open('src/hooks/useGameEngine.js', 'w') as f:
    f.write(engine_content)
