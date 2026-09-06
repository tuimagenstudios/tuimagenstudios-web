import crypto from "node:crypto";

export function createOrderId() {
  return crypto.randomUUID();
}

export function signDownloadToken(orderId, expiresAt) {
  const payload = `${orderId}.${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", requiredEnv("DOWNLOAD_TOKEN_SECRET"))
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyDownloadToken(token) {
  const [orderId, expiresAtText, signature, ...rest] = String(token || "").split(".");
  if (!orderId || !expiresAtText || !signature || rest.length) return null;
  const expiresAt = Number(expiresAtText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt < Date.now()) return null;
  const expected = signDownloadToken(orderId, expiresAt);
  const left = Buffer.from(token);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  return { orderId, expiresAt };
}

export function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

export function safeEqualHex(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  return crypto.timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}
