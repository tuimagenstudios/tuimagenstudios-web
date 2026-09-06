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

export function verifyWebhookSignature(req) {
  const signatureHeader = req.headers["x-signature"];
  const requestId = req.headers["x-request-id"] || "";
  const dataId = String(req.query?.["data.id"] || req.body?.data?.id || "").toLowerCase();
  if (!signatureHeader || !dataId) return false;
  const values = Object.fromEntries(String(signatureHeader).split(",").map(part => {
    const [key, value] = part.trim().split("=");
    return [key, value];
  }));
  if (!values.ts || !values.v1) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${values.ts};`;
  const expected = crypto.createHmac("sha256", requiredEnv("MP_WEBHOOK_SECRET")).update(manifest).digest("hex");
  return safeEqualHex(values.v1, expected);
}
