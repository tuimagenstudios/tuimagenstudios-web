import { requiredEnv } from "./security.js";

function config() {
  return {
    url: requiredEnv("SUPABASE_URL").replace(/\/$/, ""),
    key: requiredEnv("SUPABASE_SECRET_KEY"),
    bucket: requiredEnv("SUPABASE_BUCKET")
  };
}

async function request(path, options = {}) {
  const { url, key } = config();
  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("supabase_error", {
      path,
      status: response.status,
      body: body.slice(0, 1200)
    });
    throw new Error(`Supabase respondió ${response.status}: ${body.slice(0, 300)}`);
  }
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? response.json() : null;
}

export async function createPendingOrder(order) {
  await request("/rest/v1/ebook_orders", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(order)
  });
}

export async function getOrder(orderId) {
  const rows = await request(`/rest/v1/ebook_orders?id=eq.${encodeURIComponent(orderId)}&select=*`);
  return rows[0] || null;
}

export async function setOrderPayment(orderId, data) {
  await request(`/rest/v1/ebook_orders?id=eq.${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(data)
  });
}

export async function createSignedDownloadUrl(filePath) {
  const { bucket } = config();
  const data = await request(`/storage/v1/object/sign/${encodeURIComponent(bucket)}/${filePath.split("/").map(encodeURIComponent).join("/")}`, {
    method: "POST",
    body: JSON.stringify({ expiresIn: 60 })
  });
  if (!data?.signedURL) throw new Error("No se pudo firmar la descarga");
  return `${requiredEnv("SUPABASE_URL").replace(/\/$/, "")}/storage/v1${data.signedURL}`;
}
