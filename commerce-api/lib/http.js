export const SITE_ORIGIN = "https://tuimagenstudios.com";

export function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin === SITE_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", SITE_ORIGIN);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export function isAllowedOrigin(req) {
  const origin = req.headers.origin;
  return !origin || origin === SITE_ORIGIN;
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
