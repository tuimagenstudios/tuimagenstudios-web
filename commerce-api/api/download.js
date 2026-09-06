import { getProduct } from "../lib/catalog.js";
import { applyCors, publicError, requireMethod } from "../lib/http.js";
import { verifyDownloadToken } from "../lib/security.js";
import { createSignedDownloadUrl, getOrder } from "../lib/supabase.js";

export default async function handler(req, res) {
  applyCors(req, res);
  if (!requireMethod(req, res, "GET")) return;
  try {
    const payload = verifyDownloadToken(req.query?.token);
    if (!payload) return publicError(res, 401, "Este enlace venció o no es válido");
    const order = await getOrder(payload.orderId);
    if (!order || order.status !== "approved") return publicError(res, 403, "Descarga no disponible");
    const product = getProduct(order.product_id);
    const filePaths = product?.filePaths || (product?.filePath ? [product.filePath] : []);
    const requestedFile = String(req.query?.file || filePaths[0] || "");
    if (!filePaths.includes(requestedFile)) return publicError(res, 403, "Archivo no autorizado");
    const url = await createSignedDownloadUrl(requestedFile);
    res.setHeader("Cache-Control", "no-store");
    res.redirect(302, url);
  } catch (error) {
    console.error("download_error", error.message);
    publicError(res, 500, "No pudimos preparar la descarga. Intentá nuevamente.");
  }
}
