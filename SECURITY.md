# Seguridad de la web en GitHub Pages

La web pública permanece en GitHub Pages. No se necesita un servicio de hosting nuevo para este endurecimiento.

El workflow `Deploy tuimagenstudios.com` ejecuta las pruebas de `scripts/test/pages-security.test.mjs` y publica exclusivamente `.pages-output/`. El generador `scripts/build-pages.mjs` copia archivos públicos de una lista permitida e inserta una política CSP mediante HTML antes de cargar los recursos de cada página. Los scripts inline legítimos se autorizan por hashes calculados en cada despliegue; no se permite `unsafe-inline` ni `unsafe-eval` para scripts. Se conservan los estilos inline actuales, Clarity, fuentes, Web3Forms y el checkout.

No se publican como archivos de Pages el backend comercial, scripts de construcción, pruebas, configuración, documentación interna ni borradores. El repositorio sigue siendo público; excluir archivos del sitio no los vuelve privados en GitHub.

GitHub Pages exige HTTPS según su configuración actual. No permite configurar cabeceras HTTP arbitrarias. Una CSP mediante meta **no** implementa `frame-ancestors`, `X-Frame-Options`, HSTS, `nosniff` ni Permissions-Policy: no se simulan esas cabeceras con etiquetas que el navegador ignoraría. La protección aplicada reduce riesgos y no garantiza ausencia de vulnerabilidades.

La API de comercio que ya existía antes de estos cambios continúa separada de la web estática. GitHub Pages no puede ejecutar los endpoints de pagos, validación de webhooks o descargas privadas. Se mantienen sus parches de seguridad y sus pruebas en `commerce-api/`.

Para comprobar una modificación de la web:

```sh
node --test scripts/test/pages-security.test.mjs
```

Si se añade una carpeta pública nueva, debe incorporarse deliberadamente a la lista del generador. No se deben copiar credenciales, PDFs de pago o variables privadas a archivos públicos ni al historial de Git.
