# Checklist SEO post-publicacion

Fecha del checklist: 2026-05-08

Este documento registra el estado publicado de Tuimagenstudios.com despues de crear las paginas internas de servicios y sirve como guia de verificacion manual en Google Search Console. No garantiza indexacion ni posicionamiento; ordena los pasos para revisar que Google pueda descubrir, leer y rastrear las URLs publicadas.

## 1. Estado actual publicado

URLs publicadas:

- `https://tuimagenstudios.com/`
- `https://tuimagenstudios.com/diseno-grafico/`
- `https://tuimagenstudios.com/marketing-digital/`
- `https://tuimagenstudios.com/automatizaciones-ia/`
- `https://tuimagenstudios.com/bots-ia/`
- `https://tuimagenstudios.com/diseno-web/`
- `https://tuimagenstudios.com/sitemap.xml`

Commits principales recientes:

- `fed4d26850b3d2c35661053bc0bbe2c9d3587bfe` SEO tecnico base.
- `df9f41cc4929c25f88742f167b763e84828a4fe1` pagina diseno grafico.
- `7f549f2fd12b02b341f5bbf2f0d0c41cddc21bb1` pagina marketing digital.
- `869bf9838a888146022b28939adb88b3009623ad` pagina automatizaciones IA.
- `eca1fc5729643f400df7e4df71fd99c1d03b5448` pagina bots IA.
- `316513eb775feaa82f5d102b023c246007a0b20b` pagina diseno web.
- `c1dc129b43d74ef3b27185356284c451fcec3979` consolidacion SEO interna.

Estado tecnico esperado:

- Sitemap publicado en `https://tuimagenstudios.com/sitemap.xml`.
- Sitemap incluye home y las cinco paginas internas de servicios.
- Cada pagina tiene title, meta description, canonical, Open Graph, Twitter Card y JSON-LD.
- Las paginas internas cargan `../styles.css` y `../site.js`.
- Las paginas internas no cargan Three.js, `home-3d.js` ni `script.js`.
- La home conserva la escena 3D y carga Three.js local desde `assets/vendor/three.module.min.js`.
- El contacto principal usa WhatsApp: `https://wa.me/542281375390`.

## 2. Checklist manual para Google Search Console

Pasos para Natalia:

1. Entrar a Google Search Console.
2. Seleccionar la propiedad de `tuimagenstudios.com`.
3. Ir a **Sitemaps**.
4. Enviar o reenviar:
   - `sitemap.xml`
5. Ir a **Inspeccion de URL**.
6. Inspeccionar una por una:
   - `https://tuimagenstudios.com/`
   - `https://tuimagenstudios.com/diseno-grafico/`
   - `https://tuimagenstudios.com/marketing-digital/`
   - `https://tuimagenstudios.com/automatizaciones-ia/`
   - `https://tuimagenstudios.com/bots-ia/`
   - `https://tuimagenstudios.com/diseno-web/`
7. Para cada URL:
   - Probar la URL publicada/en vivo.
   - Confirmar que Google la puede leer.
   - Confirmar que no marque bloqueo por robots.
   - Confirmar que la canonical sea la URL esperada.
   - Pedir indexacion si aparece disponible para Google.

Importante: pedir indexacion no garantiza posicionamiento ni indexacion inmediata. Solo solicita a Google que vuelva a evaluar la URL.

## 3. Checklist de seguimiento para proximos dias

- Revisar en 48-72 horas si Search Console ya detecta el sitemap actualizado.
- Revisar el estado de indexacion de cada URL.
- Revisar errores de cobertura/indexacion.
- Revisar si hay problemas de HTTPS.
- Revisar si aparecen mejoras o datos estructurados.
- No tomar decisiones de contenido por impresiones/clics hasta que haya datos reales suficientes.

## 4. Tabla de control

| URL | Estado publico 200 | Incluida en sitemap | Canonical esperada | JSON-LD | Solicitud de indexacion manual | Estado Search Console | Proxima revision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `https://tuimagenstudios.com/` | Si, verificado 2026-05-08 | Si | `https://tuimagenstudios.com/` | Si | Pendiente | Pendiente | 48-72 h despues de enviar sitemap |
| `https://tuimagenstudios.com/diseno-grafico/` | Si, verificado 2026-05-08 | Si | `https://tuimagenstudios.com/diseno-grafico/` | Si | Pendiente | Pendiente | 48-72 h despues de enviar sitemap |
| `https://tuimagenstudios.com/marketing-digital/` | Si, verificado 2026-05-08 | Si | `https://tuimagenstudios.com/marketing-digital/` | Si | Pendiente | Pendiente | 48-72 h despues de enviar sitemap |
| `https://tuimagenstudios.com/automatizaciones-ia/` | Si, verificado 2026-05-08 | Si | `https://tuimagenstudios.com/automatizaciones-ia/` | Si | Pendiente | Pendiente | 48-72 h despues de enviar sitemap |
| `https://tuimagenstudios.com/bots-ia/` | Si, verificado 2026-05-08 | Si | `https://tuimagenstudios.com/bots-ia/` | Si | Pendiente | Pendiente | 48-72 h despues de enviar sitemap |
| `https://tuimagenstudios.com/diseno-web/` | Si, verificado 2026-05-08 | Si | `https://tuimagenstudios.com/diseno-web/` | Si | Pendiente | Pendiente | 48-72 h despues de enviar sitemap |

## 5. Notas de criterio SEO

- El sitemap ayuda a Google a descubrir URLs, pero no garantiza indexacion ni ranking.
- La inspeccion de URL sirve para revisar como Google ve una pagina y pedir rastreo/indexacion.
- El `lastmod` debe reflejar cambios significativos reales de contenido, datos estructurados o enlaces, no cambios irrelevantes.
- No repetir solicitud de indexacion obsesivamente.
- Esperar senales antes de crear mas paginas.
- No prometer resultados garantizados.
- No prometer aparecer primero en Google.
- No tomar cambios de ranking como inmediatos; SEO necesita tiempo, rastreo y datos.

## 6. Proximos pasos sugeridos

1. Indexar manualmente las cinco paginas de servicio:
   - `https://tuimagenstudios.com/diseno-grafico/`
   - `https://tuimagenstudios.com/marketing-digital/`
   - `https://tuimagenstudios.com/automatizaciones-ia/`
   - `https://tuimagenstudios.com/bots-ia/`
   - `https://tuimagenstudios.com/diseno-web/`
2. Esperar unos dias.
3. Revisar Search Console.
4. Despues decidir si conviene:
   - mejorar copy de alguna pagina;
   - sumar casos o portfolio;
   - crear pagina de portfolio/servicios combinados;
   - mejorar OG image;
   - trabajar performance;
   - crear contenido local o sectorial.

## 7. Checklist tecnico del repo

Antes de cerrar esta tanda, verificar:

- `node --check site.js`
- `node --check home-3d.js`
- `node --check script.js`
- `sitemap.xml` como XML valido.
- URLs publicas responden 200.
- `sitemap.xml` incluye las cinco paginas internas.
- No existe `package.json`.
- No aparece el email antiguo de contacto en el codigo publicado.
- Las paginas internas no cargan Three.js, `home-3d.js` ni `script.js`.
- La home mantiene Three.js local y la escena 3D.
