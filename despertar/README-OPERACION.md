# Cómo operar el paquete Despertar Digital

## Estado antes de publicar

La landing está preparada en `/despertar/index.html` y ya tiene configurada la access key real de Web3Forms.

Antes del primer push público, Naty tiene que entrar al dashboard de Web3Forms y configurar la restricción de dominio para esta access key.

Dominios permitidos:

- `tuimagenstudios.com`
- `www.tuimagenstudios.com`

No publicar la landing hasta que esa restricción esté activa.

## PDFs finales

Los PDFs finales los sube Naty manualmente. No se usan PDFs, HTML ni diseños generados automáticamente por Codex como pieza final del lead magnet.

Nombres definitivos esperados:

- `/despertar/recursos/despertar-digital-acto-2.pdf`
- `/despertar/recursos/despertar-digital-acto-3.pdf`

Estado actual:

- Acto 2 ya está subido como `/despertar/recursos/despertar-digital-acto-2.pdf`.
- Acto 3 ya está subido como `/despertar/recursos/despertar-digital-acto-3.pdf`.

La promesa pública "Los dos primeros PDFs llegan al instante" puede usarse cuando ambos links estén verificados en producción.

La carpeta pública `/despertar/recursos/` debe quedar reservada para esos archivos finales de Naty.

## Configuración de Web3Forms

1. Verificar que la access key configurada en `/despertar/index.html` pertenece a `tuimagenstudio@gmail.com`.
2. En el dashboard de Web3Forms, limitar los dominios permitidos a `tuimagenstudios.com` y `www.tuimagenstudios.com`.
3. Activar el autoresponder desde Web3Forms si la cuenta lo permite.
4. Configurar el email automático con los links definitivos.
5. Enviar un test real con datos de Naty.
6. Confirmar que el email llega a `tuimagenstudio@gmail.com`.
7. Confirmar que la lead recibe el email automático, si el autoresponder está activo.

## Plantilla del email automático al lead

Usar esta plantilla solo cuando los PDFs finales estén subidos y verificados.

Asunto: 🌌 Tu Despertar Digital empieza ahora, [Nombre]

Hola [Nombre],

Bienvenida.

Esto que estás por abrir no es una guía más. Es un acompañamiento.

Te dejo dos PDFs para empezar HOY:

📘 Acto 2 — La guía editorial
[Descargar aquí]
https://tuimagenstudios.com/despertar/recursos/despertar-digital-acto-2.pdf

📅 Acto 3 — 7 días para empezar a aparecer
[Descargar aquí]
https://tuimagenstudios.com/despertar/recursos/despertar-digital-acto-3.pdf

Tu Acto 1 — la auditoría personalizada de tu negocio ([URL que ingresó]) — la voy a preparar yo a mano. Te llega en 24-48 horas a este mismo email.

Mientras tanto, leé el Acto 2 con calma. Te va a marcar el rumbo.

Cualquier cosa que surja:
WhatsApp: +54 2281 375390

Despertando con vos,
Naty
Tuimagen Studios

---
tuimagenstudios.com
"Tu marca ya existe. Lo que falta es que el mundo lo sepa."

## Cuando llega un lead nuevo

1. Recibís email con asunto "🌌 Nuevo lead Despertar Digital — [Nombre]".

2. Anotalo en tu Notion / lista de leads.

3. Abrí Claude Code, ChatGPT o la IA que prefieras.

4. Pegale el prompt de la skill universal:
   `despertar/skills-universales/auditoria-negocio-despertar-digital-universal.md`

5. Dale la URL del negocio del lead.

6. Esperá el output (15-30 min).

7. Revisá el resultado, hacé ajustes si hace falta.

8. Exportá a PDF.

9. Mandale email a la lead con el Acto 1 adjunto.

## Email interno que debe llegar a Naty

El payload del formulario no debe enviar links privados, URL de Notion, paths largos de skills ni links a PDFs no publicados.

Debe incluir solo:

- Nombre
- Email
- URL del negocio
- WhatsApp
- Fecha
- Consentimiento
- Próximo paso: preparar Acto 1 manualmente en 24-48h.
- Referencia interna: revisar `/despertar/README-OPERACION.md`

## Plantilla de email para enviar el Acto 1

Asunto: 🪞 Tu auditoría personalizada llegó — [Nombre]

Hola [Nombre],

Acá va tu Acto 1.

Lo preparé mirando tu web, tus redes y tu oferta con detalle. No es genérico. Es un espejo honesto sobre cómo te encuentra el mundo hoy.

📎 [Adjuntar el PDF de la auditoría]

Léelo con calma. Vas a encontrar:

· Hallazgos clave sobre tu presencia digital
· Por qué cada uno importa para tu negocio
· Qué harías vos si fueras la consultora
· Plan de 30 días con 5 acciones priorizadas

Si querés conversarlo, estoy por WhatsApp.
La auditoría es un punto de partida, no un veredicto.

Naty
Tuimagen Studios

## Métricas para registrar

Tener una hoja de Notion con:

- Fecha del lead
- Nombre
- URL
- ¿Recibió Acto 1? Sí/No
- Fecha de envío Acto 1
- ¿Respondió? Sí/No
- ¿Conversión? Llamada/Servicio/Nada
- Notas

## Checklist de testing

Antes de hacer push a main:

- [ ] Restricción de dominio configurada en Web3Forms
- [ ] PDFs finales de Naty subidos a `/despertar/recursos/`
- [ ] Links de Acto 2 y Acto 3 verificados en producción
- [ ] Form valida formato de email
- [ ] Form valida campos obligatorios
- [ ] Form valida URL y bloquea protocolos inseguros
- [ ] Honeypot `botcheck` presente
- [ ] Rate limit client-side de 60 segundos activo
- [ ] Submit con datos reales llega a Naty
- [ ] El lead recibe email automático con los 2 links, si el autoresponder está activo
- [ ] Mensaje de confirmación se ve correcto
- [ ] Responsive: la landing se ve bien en mobile
- [ ] Performance: la página carga en menos de 3 segundos
- [ ] SEO: meta tags + schema.org Article + Open Graph
- [ ] Accesibilidad: contraste, alt texts, labels

## Cuándo automatizar más

Después de 20 leads procesados manualmente, evaluar:

- Generar el Acto 1 automáticamente con la skill
- Que el email salga sin intervención manual
- CRM más robusto (HubSpot, Brevo, etc.)

Hasta entonces: HACELO A MANO. Es estratégico.
