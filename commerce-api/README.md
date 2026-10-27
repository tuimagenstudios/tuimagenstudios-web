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
- Cargar las variables de `.env.example` en Vercel: solo Producción. Nunca poner sus valores reales en GitHub ni en la web.
- Añadir el dominio `api.tuimagenstudios.com` al proyecto Vercel y crear el CNAME que Vercel indique.

## Verificación previa

`npm ci --ignore-scripts && npm run check && npm test && npm audit --omit=dev`

No activar los botones de compra de la web hasta tener una prueba aprobada con credenciales de prueba de Mercado Pago.

## Controles de seguridad (octubre de 2026)

- El webhook acepta solo eventos `payment` firmados para el mismo `data.id` de query y body. Exige `x-request-id`, firma hexadecimal válida y timestamp con tolerancia de cinco minutos (segundos o milisegundos). Una notificación antigua debe reenviarse con una firma nueva; no se debe ampliar la tolerancia para reutilizar firmas capturadas.
- La API desplegada es de producción: solo pagos consultados a Mercado Pago con `live_mode: true`, importe, moneda, orden e identificador coincidentes habilitan entregas. Las pruebas automatizadas usan servicios simulados y ninguna credencial real; una futura API sandbox requiere configuración independiente.
- Reembolsos totales o parciales, contracargos, cancelaciones y mediación revocan el acceso mediante el estado SQL existente `cancelled`; no hace falta migración.
- Cada descarga vuelve a consultar el pago para bloquear acceso incluso si el webhook de revocación se pierde. Si Mercado Pago falla, no se emite una URL privada; reintentar cuando se recupere el proveedor. Una URL de Storage ya emitida conserva su vigencia original de hasta 60 segundos.
- Los reintentos conservan la aprobación original y su vencimiento de 30 días. El envío a Resend utiliza una clave de idempotencia por orden y solo se marca como enviado si el proveedor devuelve un identificador de aceptación. Esta aceptación no acredita recepción final en el buzón. La ventana de deduplicación depende de Resend.
- Los errores y redirecciones de la API llevan `Cache-Control: no-store`. Los límites antiabuso terminan el handler con 429 y mantienen un máximo de 10.000 buckets por instancia, limpiando los vencidos cada 30 segundos como máximo. Al llenarse la capacidad se rechazan clientes nuevos temporalmente.
- Los límites en memoria no son cuotas globales: se reinician con instancias y despliegues. Para límites distribuidos se requiere una regla de Vercel Firewall o almacenamiento compartido. CORS no autentica clientes ajenos al navegador.

Las pruebas de regresión se ejecutan en cada PR con cambios en la API mediante `.github/workflows/security-tests.yml` (Node 20, 22 y 24). El lockfile fija las dependencias resueltas.
