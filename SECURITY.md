# Seguridad de la web en GitHub Pages

La web pública permanece en GitHub Pages. No se necesita un servicio de hosting nuevo para este endurecimiento.

El workflow `Deploy tuimagenstudios.com` ejecuta las pruebas de `scripts/test/pages-security.test.mjs` y publica exclusivamente `.pages-output/`. El generador `scripts/build-pages.mjs` copia archivos públicos de una lista permitida e inserta una política CSP mediante HTML antes de cargar los recursos de cada página. Los scripts inline legítimos se autorizan por hashes calculados en cada despliegue; no se permite `unsafe-inline` ni `unsafe-eval` para scripts. Se conservan los estilos inline actuales, Clarity, fuentes, Web3Forms y el checkout.

No se publican como archivos de Pages el backend comercial, scripts de construcción, pruebas, configuración, documentación interna ni borradores. El repositorio sigue siendo público; excluir archivos del sitio no los vuelve privados en GitHub.

GitHub Pages exige HTTPS según su configuración actual. No permite configurar cabeceras HTTP arbitrarias. Una CSP mediante meta **no** implementa `frame-ancestors`, `X-Frame-Options`, HSTS, `nosniff` ni Permissions-Policy: no se simulan esas cabeceras con etiquetas que el navegador ignoraría. La protección aplicada reduce riesgos y no garantiza ausencia de vulnerabilidades.

La API de comercio que ya existía antes de estos cambios continúa separada de la web estática. GitHub Pages no puede ejecutar los endpoints de pagos, validación de webhooks o descargas privadas. Se mantienen sus parches de seguridad y sus pruebas en `commerce-api/`.

Para comprobar una modificación de la web:

```sh
node --test scripts/test/*.test.mjs
```

Si se añade una carpeta pública nueva, debe incorporarse deliberadamente a la lista del generador. No se deben copiar credenciales, PDFs de pago o variables privadas a archivos públicos ni al historial de Git.

## Medición publicitaria con consentimiento

El generador incluye `assets/ads-measurement.js` en todas las páginas. No carga recursos de Google antes de aceptar la medición. La elección se conserva localmente y se puede cambiar mediante «Preferencias de medición». Al aceptar, únicamente `ad_storage` se concede; `ad_user_data`, `ad_personalization` y `analytics_storage` permanecen denegados. Al revocar, se actualiza el consentimiento y se dejan de emitir conversiones. El código de Google ya cargado puede procesar esa actualización; en las siguientes cargas con rechazo no se carga Google. No se habilitan conversiones mejoradas. Esta preferencia no cambia Clarity, que ya estaba presente.

La acción `AW-18537866471/HEUvCNqm5LEdEOfJxYdF` registra exclusivamente el clic real de salida desde `/hablemos/` al BOT `5492281375390`, una vez por carga de página, con valor 0 USD. No demuestra un mensaje enviado ni una conversación iniciada. No registra la llegada a la página, el chat web, `/whatsapp/` ni otros teléfonos. Si se rechaza la medición, WhatsApp abre normalmente; si la etiqueta se bloquea, la navegación continúa por timeout.

El parámetro libre `texto` se guarda en memoria y se elimina de la URL antes de cargar Google; se mantiene en el enlace de contacto. Los campos `page_location` y `page_referrer` se limpian de consultas y fragmentos; solamente se conservan identificadores publicitarios válidos en `page_location`. La petición del script utiliza referrer de origen. Si no se puede retirar `texto` de la URL, no se carga Google. No se envían datos de formularios ni mensajes como parámetros de conversión.

La CSP autoriza los hosts concretos documentados para Google Ads, incluido `www.google.com.ar` para la campaña argentina, sin comodines nuevos, `unsafe-inline` para scripts ni `unsafe-eval`. La autorización de frames se limita a `www.googletagmanager.com`. Otros dominios regionales de Google requerirán revisión explícita si aparecen bloqueados. Referencias: https://developers.google.com/tag-platform/security/guides/csp y https://developers.google.com/tag-platform/security/guides/consent.

Las pruebas ejecutan el código local en un entorno aislado sin descargar Google ni generar conversiones reales. La validación en navegador y el estado de recepción de Google Ads deben verificarse por separado después de publicar.
