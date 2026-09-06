import { getProduct } from "../../lib/catalog.js";
import { sendDownloadEmail } from "../../lib/email.js";
import { applySecurityHeaders } from "../../lib/http.js";
import { getPayment, verifyWebhookSignature } from "../../lib/mercadopago.js";
import { requiredEnv, signDownloadToken } from "../../lib/security.js";
import { getOrder, setOrderPayment } from "../../lib/supabase.js";

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== "POST") return res.status(405).end();
  try {
    if (!verifyWebhookSignature(req)) return res.status(401).json({ error: "Firma no válida" });
    if (req.body?.type !== "payment") return res.status(200).json({ ignored: true });
    const paymentId = String(req.body?.data?.id || "");
    if (!paymentId) return res.status(400).json({ error: "Pago inexistente" });

    const payment = await getPayment(paymentId);
    const orderId = String(payment.external_reference || "");
    const order = await getOrder(orderId);
    if (!order) return res.status(404).json({ error: "Orden inexistente" });
    const product = getProduct(order.product_id);
    const valid = payment.status === "approved" && product &&
      payment.currency_id === order.currency &&
      Number(payment.transaction_amount) === Number(order.amount);
    if (!valid) return res.status(200).json({ ignored: true });
    if (order.status === "approved" && order.email_sent_at) return res.status(200).json({ ok: true, duplicate: true });

    await setOrderPayment(orderId, {
      status: "approved",
      mp_payment_id: paymentId,
      payer_email: payment.payer?.email || null,
      approved_at: new Date().toISOString()
    });
    if (!payment.payer?.email) throw new Error("El pago aprobado no incluye email del comprador");

    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const token = signDownloadToken(orderId, expiresAt);
    const api = requiredEnv("API_BASE_URL").replace(/\/$/, "");
    const filePaths = product.filePaths || [product.filePath];
    const downloads = filePaths.map(filePath => ({
      label: filePath.replace(/\.pdf$/i, "").replaceAll("-", " "),
      url: `${api}/api/download?token=${encodeURIComponent(token)}&file=${encodeURIComponent(filePath)}`
    }));
    await sendDownloadEmail({ to: payment.payer.email, title: product.title, downloads });
    await setOrderPayment(orderId, { email_sent_at: new Date().toISOString() });
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("mercadopago_webhook_error", error.message);
    res.status(500).json({ error: "Error temporal" });
  }
}
