import { getProduct } from "../lib/catalog.js";
import { applyCors, isAllowedOrigin, publicError, requireMethod } from "../lib/http.js";
import { createPreference } from "../lib/mercadopago.js";
import { createOrderId } from "../lib/security.js";
import { createPendingOrder } from "../lib/supabase.js";

export default async function handler(req, res) {
  applyCors(req, res);
  if (!requireMethod(req, res, "POST")) return;
  if (!isAllowedOrigin(req)) return publicError(res, 403, "Origen no autorizado");
  let stage = "validar producto";
  try {
    const productId = typeof req.body?.productId === "string" ? req.body.productId : "";
    const product = getProduct(productId);
    if (!product) return publicError(res, 400, "Producto no disponible");

    const orderId = createOrderId();
    stage = "guardar orden en Supabase";
    await createPendingOrder({
      id: orderId,
      product_id: productId,
      product_title: product.title,
      amount: product.unit_price,
      currency: product.currency_id,
      status: "pending"
    });
    stage = "crear preferencia en Mercado Pago";
    const preference = await createPreference({ orderId, product });
    if (!preference?.init_point) throw new Error("No se recibió la URL de pago");
    res.status(201).json({ checkoutUrl: preference.init_point });
  } catch (error) {
    console.error("checkout_error", {
      stage,
      message: error?.message || String(error),
      stack: error?.stack
    });
    publicError(res, 500, "No pudimos iniciar el pago. Intentá nuevamente.");
  }
}
