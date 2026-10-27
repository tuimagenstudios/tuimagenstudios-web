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
  if (typeof token !== "string" || token.length > 128) return null;
  const match = /^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\.([0-9]{1,16})\.([A-Za-z0-9_-]{43})$/i.exec(token);
  if (!match) return null;
  const [, orderId, expiresAtText] = match;
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
  if (typeof left !== "string" || typeof right !== "string" ||
      !/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false;
  return crypto.timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}
