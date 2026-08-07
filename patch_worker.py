import re

with open('src/worker.js', 'r') as f:
    content = f.read()

# Add rate limit map
rate_limit_code = """
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
"""

content = content.replace("const getDayId = () => Math.floor(Date.now() / 86400000);", rate_limit_code + "\nconst getDayId = () => Math.floor(Date.now() / 86400000);")

# Add IP and use in telemetry
handleApiRequestStart = "const handleApiRequest = async (request, env, ctx, pathname) => {"
newHandleApiRequestStart = """const handleApiRequest = async (request, env, ctx, pathname) => {
  const clientIp = request.headers.get("cf-connecting-ip") || "unknown";"""
content = content.replace(handleApiRequestStart, newHandleApiRequestStart)

telemetryStart = """  if (pathname === "/api/telemetry" && request.method === "POST") {
    const event = await request.json().catch(() => null);"""

newTelemetryStart = """  if (pathname === "/api/telemetry" && request.method === "POST") {
    if (!checkRateLimit(clientIp, "/api/telemetry", 60)) {
      return json({ error: "Rate limit exceeded. Retry shortly." }, { status: 429 });
    }

    const event = await request.json().catch(() => null);"""
content = content.replace(telemetryStart, newTelemetryStart)

# Telemetry Validation
oldTelemetryValidation = """    // Support both old format (eventName, payload) and new format
    let event_name = event.event_name || event.eventName;
    let user_id = event.user_id || event.payload?.user_id || "anonymous";
    let is_practice = event.is_practice !== undefined ? event.is_practice : (event.payload?.practiceMode ? 1 : 0);
    let timestamp = event.timestamp || Date.now();
    let metadata = event.metadata ? JSON.stringify(event.metadata) : (event.payload ? JSON.stringify(event.payload) : "{}");

    if (typeof event_name !== "string" || event_name.length === 0 || event_name.length > 100) {
      return json({ error: "Invalid event_name." }, { status: 400 });
    }

    if (metadata.length > 8192) {
      return json({ error: "Telemetry metadata is too large." }, { status: 413 });
    }"""

newTelemetryValidation = """    let event_name = event.event_name || event.eventName;
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

    let metadata = metadataStr;"""

content = content.replace(oldTelemetryValidation, newTelemetryValidation)

syncStart = """  if (pathname === "/api/user/sync" && request.method === "POST") {
    try {"""

newSyncStart = """  if (pathname === "/api/user/sync" && request.method === "POST") {
    if (!checkRateLimit(clientIp, "/api/user/sync", 20)) {
      return json({ error: "Rate limit exceeded. Retry shortly." }, { status: 429 });
    }

    try {"""

content = content.replace(syncStart, newSyncStart)

oldTokenParse = """          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            sso_user_id = payload.user_id || payload.sub;
            sso_email = payload.email;
          }"""

newTokenParse = """          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.exp && Date.now() >= payload.exp * 1000) {
              return json({ error: "Token expired" }, { status: 401 });
            }
            sso_user_id = payload.user_id || payload.sub;
            sso_email = payload.email;
          }"""

content = content.replace(oldTokenParse, newTokenParse)

with open('src/worker.js', 'w') as f:
    f.write(content)

print("Worker patched successfully!")
