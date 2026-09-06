export const SITE_ORIGIN = "https://tuimagenstudios.com";

const rateLimitBuckets = new Map();

export function applySecurityHeaders(res) {
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'"
  );
}

export function applyCors(req, res) {
  applySecurityHeaders(res);
  const origin = req.headers.origin;
  if (origin === SITE_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", SITE_ORIGIN);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function isAllowedOrigin(req) {
  return req.headers.origin === SITE_ORIGIN;
}

function clientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "");
  return forwarded.split(",")[0].trim() || String(req.headers["x-real-ip"] || "unknown");
}

// In-memory limits are an additional abuse guard. Vercel's platform-wide
// DDoS mitigation remains the network-level layer.
export function enforceRateLimit(req, res, { key, limit, windowMs }) {
  const now = Date.now();
  const bucketKey = `${key}:${clientIp(req)}`;
  let bucket = rateLimitBuckets.get(bucketKey);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    rateLimitBuckets.set(bucketKey, bucket);
  }

  if (bucket.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    res.setHeader("Retry-After", String(retryAfter));
    return publicError(res, 429, "Demasiados intentos. Esperá unos minutos e intentá nuevamente.");
  }

  bucket.count += 1;
  res.setHeader("X-RateLimit-Limit", String(limit));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, limit - bucket.count)));
  return true;
}

export function requireMethod(req, res, method) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return false;
  }
  if (req.method !== method) {
    res.setHeader("Allow", method);
    res.status(405).json({ error: "Método no permitido" });
    return false;
  }
  return true;
}

export function publicError(res, status, message) {
  return res.status(status).json({ error: message });
}
