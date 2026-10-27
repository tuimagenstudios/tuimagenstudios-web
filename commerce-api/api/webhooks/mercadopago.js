import { getProduct } from "../../lib/catalog.js";
import { sendDownloadEmail } from "../../lib/email.js";
import { applySecurityHeaders } from "../../lib/http.js";
import { getPayment, getWebhookPaymentId, isApprovedPayment, verifyWebhookSignature } from "../../lib/mercadopago.js";
import { requiredEnv, signDownloadToken } from "../../lib/security.js";
import { getOrder, setOrderPayment } from "../../lib/supabase.js";

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== "POST") return res.status(405).end();
  try {
    if (!verifyWebhookSignature(req)) return res.status(401).json({ error: "Firma no válida" });
    if (req.body?.type !== "payment") return res.status(200).json({ ignored: true });
    const paymentId = getWebhookPaymentId(req);

    const payment = await getPayment(paymentId);
    if (String(payment.id) !== paymentId || payment.live_mode !== true) return res.status(200).json({ ignored: true });
    const orderId = String(payment.external_reference || "");
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(orderId)) return res.status(200).json({ ignored: true });
    const order = await getOrder(orderId);
    if (!order) return res.status(404).json({ error: "Orden inexistente" });
    if (order.mp_payment_id && String(order.mp_payment_id) !== paymentId) return res.status(200).json({ ignored: true });

    const revoked = ["refunded", "charged_back", "cancelled", "in_mediation"].includes(payment.status) ||
      Number(payment.transaction_amount_refunded || 0) > 0;
    if (revoked) {
      // Reuse an existing SQL status: this patch needs no schema migration.
      if (String(order.mp_payment_id) === paymentId) await setOrderPayment(orderId, { status: "cancelled" });
      return res.status(200).json({ ok: true, revoked: true });
    }
    const product = getProduct(order.product_id);
    const valid = product && isApprovedPayment(payment, { ...order, mp_payment_id: paymentId });
    if (!valid) return res.status(200).json({ ignored: true });
    if (order.status === "approved" && order.email_sent_at) return res.status(200).json({ ok: true, duplicate: true });

    const approvedAt = order.approved_at || payment.date_approved;
    const approvedMs = Date.parse(approvedAt);
    if (!Number.isFinite(approvedMs) || approvedMs > Date.now()) throw new Error("Fecha de aprobación no válida");
    await setOrderPayment(orderId, {
      status: "approved",
      mp_payment_id: paymentId,
      payer_email: payment.payer?.email || null,
      approved_at: new Date(approvedMs).toISOString()
    });
    if (!payment.payer?.email) throw new Error("El pago aprobado no incluye email del comprador");

    const expiresAt = approvedMs + 30 * 24 * 60 * 60 * 1000;
    if (expiresAt <= Date.now()) return res.status(200).json({ ok: true, expired: true });
    const token = signDownloadToken(orderId, expiresAt);
    const api = requiredEnv("API_BASE_URL").replace(/\/$/, "");
    const filePaths = product.filePaths || [product.filePath];
    const downloads = filePaths.map(filePath => ({
      label: filePath.replace(/\.pdf$/i, "").replaceAll("-", " "),
      url: `${api}/api/download?token=${encodeURIComponent(token)}&file=${encodeURIComponent(filePath)}`
    }));
    await sendDownloadEmail({ orderId, to: payment.payer.email, title: product.title, downloads });
    await setOrderPayment(orderId, { email_sent_at: new Date().toISOString() });
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("mercadopago_webhook_error", error.message);
    res.status(500).json({ error: "Error temporal" });
  }
}
