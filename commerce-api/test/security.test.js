import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { getProduct } from "../lib/catalog.js";
import { safeEqualHex, signDownloadToken, verifyDownloadToken } from "../lib/security.js";
import { verifyWebhookSignature } from "../lib/mercadopago.js";
import { applySecurityHeaders, enforceRateLimit } from "../lib/http.js";
import webhook from "../api/webhooks/mercadopago.js";
import download from "../api/download.js";
import checkout from "../api/checkout.js";

// Local fixtures only. No production credentials or network requests.
Object.assign(process.env, {
  MP_WEBHOOK_SECRET: "local-webhook-test-secret",
  MP_ACCESS_TOKEN: "local-payment-test-token",
  DOWNLOAD_TOKEN_SECRET: "local-download-test-secret",
  SUPABASE_URL: "https://storage.example.test",
  SUPABASE_SECRET_KEY: "sb_secret_local_test",
  SUPABASE_BUCKET: "private-test",
  API_BASE_URL: "https://api.example.test",
  RESEND_API_KEY: "re_local_test",
  EMAIL_FROM: "Test <test@example.test>"
});

const ORDER_ID = "d84bdd84-6de6-4db9-8341-7f44643e0829";

function response() {
  return {
    statusCode: 200, headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
    redirect(code, url) { this.statusCode = code; this.url = url; return this; }
  };
}

function notification({ id = "123456", bodyId = id, ts = String(Math.floor(Date.now() / 1000)) } = {}) {
  const requestId = "local-request-123";
  const digest = crypto.createHmac("sha256", process.env.MP_WEBHOOK_SECRET)
    .update(`id:${id};request-id:${requestId};ts:${ts};`).digest("hex");
  return {
    method: "POST", headers: { "x-request-id": requestId, "x-signature": `ts=${ts},v1=${digest}` },
    query: { "data.id": id }, body: { type: "payment", data: { id: bodyId } }
  };
}

function services(t, { payment = {}, order = {}, emailError = false } = {}) {
  const state = {
    order: { id: ORDER_ID, product_id: "tu-keto-hoy", amount: 4900, currency: "ARS", status: "pending", ...order },
    payment: { id: 123456, external_reference: ORDER_ID, status: "approved", currency_id: "ARS",
      transaction_amount: 4900, transaction_amount_refunded: 0, live_mode: true,
      date_approved: new Date().toISOString(), payer: { email: "buyer@example.test" }, ...payment },
    calls: [], emails: [], emailKeys: [], patches: []
  };
  t.mock.method(globalThis, "fetch", async (input, options = {}) => {
    const url = new URL(input);
    state.calls.push(url.href);
    if (url.hostname === "api.mercadopago.com") return Response.json(state.payment);
    if (url.hostname === "storage.example.test") {
      if (url.pathname.startsWith("/storage/")) return Response.json({ signedURL: "/object/sign/private-test/book.pdf?token=fixture" });
      if (options.method === "PATCH") {
        const patch = JSON.parse(options.body);
        state.patches.push(patch);
        Object.assign(state.order, patch);
        return new Response(null, { status: 204 });
      }
      return Response.json([state.order]);
    }
    if (url.hostname === "api.resend.com") {
      state.emails.push(JSON.parse(options.body));
      state.emailKeys.push(new Headers(options.headers).get("Idempotency-Key"));
      return emailError ? Response.json({ name: "validation_error", message: "fixture delivery failed" }, { status: 422 })
        : Response.json({ id: "local-email-id" });
    }
    throw new Error(`Unexpected test network request: ${url.hostname}`);
  });
  return state;
}

test("catalog rejects inherited names instead of treating them as products", () => {
  for (const id of ["__proto__", "constructor", "toString", "hasOwnProperty"]) assert.equal(getProduct(id), null);
  assert.equal(getProduct("tu-keto-hoy").unit_price, 4900);
});

test("invalid hex signatures are rejected without throwing", () => {
  for (const value of ["g".repeat(64), "a".repeat(63) + "!", "", [], null]) {
    assert.equal(safeEqualHex(value, "a".repeat(64)), false);
  }
});

test("webhook authenticates the payment that will actually be processed", () => {
  assert.equal(verifyWebhookSignature(notification()), true);
  assert.equal(verifyWebhookSignature(notification({ bodyId: "999999" })), false);
  const req = notification();
  req.query["data.id"] = ["123456", "999999"];
  assert.equal(verifyWebhookSignature(req), false);
});

test("old and future signed notifications are rejected; fresh seconds and milliseconds work", () => {
  for (const ts of [String(Math.floor(Date.now() / 1000)), String(Date.now())]) {
    assert.equal(verifyWebhookSignature(notification({ ts })), true);
  }
  for (const ts of ["1700000000", String(Date.now() + 3600000), "NaN"]) {
    assert.equal(verifyWebhookSignature(notification({ ts })), false);
  }
});

test("missing and duplicate signature fields are rejected", () => {
  const req = notification();
  req.headers["x-signature"] += ",ts=1700000000";
  assert.equal(verifyWebhookSignature(req), false);
  const noQuery = notification();
  delete noQuery.query["data.id"];
  assert.equal(verifyWebhookSignature(noQuery), false);
});

test("download accepts only a bounded scalar token for a UUID order", () => {
  const token = signDownloadToken(ORDER_ID, Date.now() + 60000);
  assert.equal(verifyDownloadToken(token).orderId, ORDER_ID);
  for (const value of [[token], {}, token + ".extra", "x".repeat(10000), signDownloadToken("not-a-uuid", Date.now() + 60000)]) {
    assert.equal(verifyDownloadToken(value), null);
  }
  assert.equal(verifyDownloadToken(signDownloadToken(ORDER_ID, Date.now() - 1)), null);
});

test("API errors and redirects are never cacheable", () => {
  const res = response();
  applySecurityHeaders(res);
  assert.equal(res.headers["Cache-Control"], "no-store");
});

test("mismatched signed identifiers cannot trigger any provider or database call", async (t) => {
  const state = services(t);
  const res = response();
  await webhook(notification({ bodyId: "999999" }), res);
  assert.equal(res.statusCode, 401);
  assert.equal(state.calls.length, 0);
});

test("sandbox payments cannot authorize production orders", async (t) => {
  const state = services(t, { payment: { live_mode: false } });
  const res = response();
  await webhook(notification(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(state.patches.length, 0);
  assert.equal(state.emails.length, 0);
});

for (const payment of [
  { status: "refunded" }, { status: "charged_back" }, { status: "cancelled" },
  { status: "in_mediation" }, { status: "approved", transaction_amount_refunded: 100 }
]) {
  test(`payment ${JSON.stringify(payment)} revokes existing download access`, async (t) => {
    const state = services(t, { payment, order: { status: "approved", mp_payment_id: "123456", email_sent_at: new Date().toISOString() } });
    await webhook(notification(), response());
    assert.equal(state.order.status, "cancelled");
    assert.equal(state.emails.length, 0);
    const res = response();
    await download({ method: "GET", headers: { "x-forwarded-for": "192.0.2.1" },
      query: { token: signDownloadToken(ORDER_ID, Date.now() + 60000) } }, res);
    assert.equal(res.statusCode, 403);
  });
}

test("a different payment cannot overwrite an already bound order", async (t) => {
  const state = services(t, { order: { mp_payment_id: "999999" } });
  await webhook(notification(), response());
  assert.equal(state.patches.length, 0);
  assert.equal(state.emails.length, 0);
});

test("a failed email response does not mark the order as delivered", async (t) => {
  const state = services(t, { emailError: true });
  t.mock.method(console, "error", () => {});
  const res = response();
  await webhook(notification(), res);
  assert.equal(res.statusCode, 500);
  assert.equal(state.order.email_sent_at, undefined);
});

test("delivery retries preserve the original approval and 30-day expiry", async (t) => {
  const approvedAt = new Date(Date.now() - 7 * 86400000).toISOString();
  const state = services(t, { order: { status: "approved", mp_payment_id: "123456", approved_at: approvedAt } });
  await webhook(notification(), response());
  assert.equal(state.order.approved_at, approvedAt);
  assert.equal(state.emails.length, 1);
  const match = state.emails[0].html.match(/href="([^"]+)"/);
  const payload = verifyDownloadToken(new URL(match[1]).searchParams.get("token"));
  assert.equal(payload.expiresAt, Date.parse(approvedAt) + 30 * 86400000);
});

test("a valid purchase sends its book links and a duplicate sends no new email", async (t) => {
  const state = services(t);
  const first = response();
  await webhook(notification(), first);
  assert.equal(first.statusCode, 200);
  assert.equal(state.order.status, "approved");
  assert.ok(state.order.email_sent_at);
  assert.equal(state.emails.length, 1);
  const duplicate = response();
  await webhook(notification(), duplicate);
  assert.equal(duplicate.body.duplicate, true);
  assert.equal(state.emails.length, 1);
});

test("wrong amounts and currencies never deliver a purchase", async (t) => {
  const state = services(t, { payment: { transaction_amount: 1, currency_id: "USD" } });
  await webhook(notification(), response());
  assert.equal(state.patches.length, 0);
  assert.equal(state.emails.length, 0);
});

test("download rechecks a refunded payment even before its webhook arrives", async (t) => {
  services(t, { payment: { status: "refunded" }, order: { status: "approved", mp_payment_id: "123456" } });
  const res = response();
  await download({ method: "GET", headers: {}, query: { token: signDownloadToken(ORDER_ID, Date.now() + 60000) } }, res);
  assert.equal(res.statusCode, 403);
  assert.equal(res.url, undefined);
});

test("an approved real payment permits a purchased file but never a different file", async (t) => {
  services(t, { order: { status: "approved", mp_payment_id: "123456" } });
  const req = { method: "GET", headers: {}, query: { token: signDownloadToken(ORDER_ID, Date.now() + 60000) } };
  const valid = response();
  await download(req, valid);
  assert.equal(valid.statusCode, 302);
  const invalid = response();
  await download({ ...req, query: { ...req.query, file: "migas-de-libertad.pdf" } }, invalid);
  assert.equal(invalid.statusCode, 403);
});

test("a valid notification cannot renew an expired purchase", async (t) => {
  const approvedAt = new Date(Date.now() - 31 * 86400000).toISOString();
  const state = services(t, { order: { status: "approved", mp_payment_id: "123456", approved_at: approvedAt } });
  await webhook(notification(), response());
  assert.equal(state.emails.length, 0);
  assert.equal(state.order.approved_at, approvedAt);
});

test("concurrent webhook deliveries share a provider idempotency key", async (t) => {
  const state = services(t);
  await Promise.all([webhook(notification(), response()), webhook(notification(), response())]);
  assert.ok(state.emails.length >= 1);
  assert.ok(state.emailKeys.every(key => key === `ebook-order/${ORDER_ID}`));
});

test("checkout rate limit terminates the handler before product processing", async () => {
  const req = { method: "POST", headers: { origin: "https://tuimagenstudios.com", "x-forwarded-for": "192.0.2.123" }, body: { productId: "invalid" } };
  for (let i = 0; i < 20; i++) {
    const res = response();
    await checkout(req, res);
    assert.equal(res.statusCode, 400);
  }
  const res = response();
  await checkout(req, res);
  assert.equal(res.statusCode, 429);
  assert.ok(res.headers["Retry-After"]);
});

test("download rate limit terminates the handler before token processing", async () => {
  const req = { method: "GET", headers: { "x-forwarded-for": "192.0.2.124" }, query: {} };
  for (let i = 0; i < 30; i++) {
    const res = response();
    await download(req, res);
    assert.equal(res.statusCode, 401);
  }
  const res = response();
  await download(req, res);
  assert.equal(res.statusCode, 429);
});

test("rate limiter keeps rejecting a blocked address under many unique clients", () => {
  const settings = { key: "capacity-test", limit: 1, windowMs: 60000 };
  const req = { headers: { "x-forwarded-for": "192.0.2.9" } };
  assert.equal(enforceRateLimit(req, response(), settings), true);
  const results = [];
  for (let i = 0; i < 10010; i++) {
    const res = response();
    enforceRateLimit({ headers: { "x-forwarded-for": `198.51.${Math.floor(i / 256)}.${i % 256}` } }, res, settings);
    results.push(res.statusCode);
  }
  assert.ok(results.includes(429), "bucket storage must have a fixed capacity and fail closed");
  const blocked = response();
  enforceRateLimit(req, blocked, settings);
  assert.equal(blocked.statusCode, 429);
});
