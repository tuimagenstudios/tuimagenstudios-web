import { Resend } from "resend";
import { requiredEnv } from "./security.js";

export async function sendDownloadEmail({ to, title, downloads }) {
  const resend = new Resend(requiredEnv("RESEND_API_KEY"));
  const buttons = downloads.map(({ label, url }) =>
    `<p><a href="${url}" style="display:inline-block;background:#00d7ef;color:#001019;padding:14px 20px;border-radius:6px;font-weight:bold;text-decoration:none">Descargar ${label}</a></p>`
  ).join("");
  await resend.emails.send({
    from: requiredEnv("EMAIL_FROM"),
    to,
    subject: `Tu descarga de ${title} está lista`,
    html: `<main style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#06122b"><h1>Gracias por tu compra</h1><p>Tu pago fue aprobado. Podés descargar tu material desde estos enlaces seguros:</p>${buttons}<p>Los enlaces vencen en 30 días. Si necesitás ayuda, escribinos a tuimagenstudio@gmail.com.</p></main>`
  });
}
