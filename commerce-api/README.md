# API privada de ventas — Tuimagenstudios

Este directorio se publica como **un proyecto Vercel separado**. La web pública se mantiene en GitHub Pages; solo los endpoints de pago, webhook y descarga viven aquí.

## Flujo de seguridad

1. La web envía solo el `productId` a `POST /api/checkout`.
2. El servidor fija nombre, precio y moneda desde `lib/catalog.js`; el navegador no puede alterarlos.
3. El comprador paga en Mercado Pago Checkout Pro. La tarjeta nunca llega a Tuimagenstudios.
4. Mercado Pago avisa por webhook firmado. El servidor valida la firma y vuelve a consultar el pago directamente a Mercado Pago.
5. Solo un pago `approved` con importe y moneda correctos genera un email.
6. El enlace del email está firmado y vence a los 30 días; el PDF se guarda en un bucket privado y se entrega mediante una URL firmada de 60 segundos.

## Antes de publicar

- Crear un proyecto Supabase propio (no el de una plataforma ajena), bucket **privado** `ebooks-privados` y cargar los tres PDFs con los nombres indicados en `lib/catalog.js`.
- Ejecutar `supabase/schema.sql` en el SQL Editor.
- Crear una app de Mercado Pago Checkout Pro y configurar el webhook `https://api.tuimagenstudios.com/api/webhooks/mercadopago` para eventos de pagos.
- Crear y verificar el remitente de correo en Resend.
- Cargar las variables de `.env.example` en Vercel: solo Producción. Nunca ponerlas en GitHub ni en la web.
- Añadir el dominio `api.tuimagenstudios.com` al proyecto Vercel y crear el CNAME que Vercel indique.

## Verificación previa

`npm install && npm run check`

No activar los botones de compra de la web hasta tener una prueba aprobada con credenciales de prueba de Mercado Pago.
