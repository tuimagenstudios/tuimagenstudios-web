import { applySecurityHeaders, requireMethod } from "../lib/http.js";

export default function handler(req, res) {
  applySecurityHeaders(res);
  if (!requireMethod(req, res, "GET")) return;
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ ok: true });
}
