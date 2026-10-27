import crypto from "node:crypto";
import { requiredEnv, safeEqualHex } from "./security.js";

const MP_API = "https://api.mercadopago.com";

async function mpFetch(path, options = {}) {
  const response = await fetch(`${MP_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${requiredEnv("MP_ACCESS_TOKEN")}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error(`Mercado Pago respondió ${response.status}`);
  return response.json();
}

export async function createPreference({ orderId, product }) {
  const site = requiredEnv("PUBLIC_SITE_URL").replace(/\/$/, "");
  const api = requiredEnv("API_BASE_URL").replace(/\/$/, "");
  return mpFetch("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      items: [{
        id: orderId,
        title: product.title,
        quantity: 1,
        currency_id: product.currency_id,
        unit_price: product.unit_price
      }],
      external_reference: orderId,
      notification_url: `${api}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${site}/libros/compra-realizada/`,
        pending: `${site}/libros/compra-pendiente/`,
        failure: `${site}/libros/compra-no-realizada/`
      },
      auto_return: "approved",
      statement_descriptor: "TUIMAGENSTUDIOS"
    })
  });
}

export async function getPayment(paymentId) {
  return mpFetch(`/v1/payments/${encodeURIComponent(paymentId)}`);
}

// Only the query identifier is covered by Mercado Pago's signature. Never
// authenticate that value and then process a different identifier from the body.
export function getWebhookPaymentId(req) {
  const queryId = req.query?.["data.id"];
  const bodyId = req.body?.data?.id;
  if (typeof queryId !== "string" || !/^[1-9][0-9]{0,29}$/.test(queryId)) return null;
  if (typeof bodyId !== "string" && !(typeof bodyId === "number" && Number.isSafeInteger(bodyId))) return null;
  return String(bodyId) === queryId ? queryId : null;
}

export function isApprovedPayment(payment, order) {
  return payment?.live_mode === true && payment.status === "approved" &&
    Number(payment.transaction_amount_refunded || 0) === 0 &&
    String(payment.id) === String(order.mp_payment_id) &&
    payment.external_reference === order.id &&
    payment.currency_id === order.currency &&
    Number(payment.transaction_amount) === Number(order.amount);
}

export function verifyWebhookSignature(req) {
  const signatureHeader = req.headers["x-signature"];
  const requestId = req.headers["x-request-id"];
  const dataId = getWebhookPaymentId(req);
  if (typeof signatureHeader !== "string" || signatureHeader.length > 256 || !dataId ||
      typeof requestId !== "string" || !/^[a-z0-9-]{1,128}$/i.test(requestId)) return false;
  const values = {};
  for (const part of signatureHeader.split(",")) {
    const match = /^(ts|v1)=([^=]+)$/.exec(part.trim());
    if (!match || Object.hasOwn(values, match[1])) return false;
    values[match[1]] = match[2];
  }
  if (!/^(?:[0-9]{10}|[0-9]{13})$/.test(values.ts || "") || !/^[a-f0-9]{64}$/i.test(values.v1 || "")) return false;
  // Mercado Pago documents both seconds and milliseconds timestamps. Preserve
  // the original text in the HMAC and normalize only for the freshness check.
  const timestampMs = Number(values.ts) * (values.ts.length === 10 ? 1000 : 1);
  if (Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${values.ts};`;
  const expected = crypto.createHmac("sha256", requiredEnv("MP_WEBHOOK_SECRET")).update(manifest).digest("hex");
  return safeEqualHex(values.v1, expected);
}
