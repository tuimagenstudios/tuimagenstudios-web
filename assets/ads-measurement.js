/* Google Ads basic consent mode. No Google resources load before acceptance. */
(function () {
  'use strict';
  var tagId = 'AW-18537866471';
  var conversionId = tagId + '/HEUvCNqm5LEdEOfJxYdF';
  var preferenceKey = 'tuimagen-ads-consent-v1';
  var choice = null;
  var loaded = false;
  var converted = false;
  var url = new URL(window.location.href);
  var contactText = (url.searchParams.get('texto') || '').slice(0, 1000);
  var safeToLoad = true;

  // Keep the contact message only in this closure, never in Google's URL fields.
  if (url.searchParams.has('texto')) {
    url.searchParams.delete('texto');
    try { window.history.replaceState(window.history.state, '', url.href); }
    catch (_) { safeToLoad = false; }
  }

  function measurementUrl(value, keepClickIds) {
    try {
      var clean = new URL(value);
      if (clean.protocol !== 'https:' && clean.protocol !== 'http:') return '';
      var params = new URLSearchParams();
      if (keepClickIds) ['gclid', 'wbraid', 'gbraid'].forEach(function (key) {
        var id = clean.searchParams.get(key);
        if (id && /^[A-Za-z0-9_-]{1,512}$/.test(id)) params.set(key, id);
      });
      clean.search = params.toString();
      clean.hash = '';
      clean.username = '';
      clean.password = '';
      return clean.href;
    } catch (_) { return ''; }
  }

  function consentState(granted) {
    return { ad_storage: granted ? 'granted' : 'denied', ad_user_data: 'denied',
      ad_personalization: 'denied', analytics_storage: 'denied' };
  }

  function loadGoogle() {
    if (loaded || !safeToLoad || choice !== 'granted') return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', consentState(false));
    window.gtag('consent', 'update', consentState(true));
    window.gtag('set', 'ads_data_redaction', true);
    window.gtag('set', { page_location: measurementUrl(window.location.href, true),
      page_referrer: measurementUrl(document.referrer, false),
      allow_ad_personalization_signals: false });
    window.gtag('js', new Date());
    window.gtag('config', tagId, { allow_enhanced_conversions: false });
    var script = document.createElement('script');
    script.async = true;
    script.referrerPolicy = 'origin';
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + tagId;
    document.head.appendChild(script);
  }

  try { choice = window.localStorage.getItem(preferenceKey); } catch (_) {}
  loadGoogle();

  function ready() {
    if (contactText && /^\/(hablemos|whatsapp)\/(?:index\.html)?$/.test(window.location.pathname)) {
      var wa = document.querySelector('.btn-wa');
      var chat = document.querySelector('.btn-web');
      if (wa) wa.href = 'https://wa.me/5492281375390?text=' + encodeURIComponent(contactText);
      if (chat) chat.href = 'https://bot-tuimagen.tuimagenstudio.workers.dev/?texto=' + encodeURIComponent(contactText);
    }
    contactText = '';

    var panel = document.createElement('section');
    panel.className = 'ads-consent-panel';
    panel.id = 'ads-measurement-preferences';
    panel.setAttribute('aria-label', 'Preferencias de medición publicitaria');
    panel.hidden = choice === 'granted' || choice === 'denied';
    var text = document.createElement('p');
    text.textContent = '¿Nos permitís medir con Google Ads si nuestros anuncios generan clics a WhatsApp? Se usan cookies de medición, sin personalización de anuncios ni envío del mensaje que escribas. Podés rechazar o cambiar tu elección cuando quieras. Esta elección solo controla Google Ads; no modifica Clarity, la herramienta de análisis ya presente en el sitio.';
    panel.appendChild(text);
    var settings = document.createElement('button');
    settings.type = 'button';
    settings.className = 'ads-consent-settings';
    settings.textContent = 'Preferencias de medición';
    settings.setAttribute('aria-controls', panel.id);
    settings.setAttribute('aria-expanded', String(!panel.hidden));

    function choose(value) {
      choice = value;
      try { window.localStorage.setItem(preferenceKey, value); } catch (_) {}
      if (loaded) window.gtag('consent', 'update', consentState(value === 'granted'));
      else loadGoogle();
      panel.hidden = true;
      settings.setAttribute('aria-expanded', 'false');
      settings.focus();
    }
    var accept = document.createElement('button');
    accept.type = 'button';
    accept.textContent = 'Aceptar medición';
    accept.addEventListener('click', function () { choose('granted'); });
    var reject = document.createElement('button');
    reject.type = 'button';
    reject.textContent = 'Rechazar medición';
    reject.addEventListener('click', function () { choose('denied'); });
    panel.appendChild(accept);
    panel.appendChild(reject);
    settings.addEventListener('click', function () {
      panel.hidden = !panel.hidden;
      settings.setAttribute('aria-expanded', String(!panel.hidden));
      if (!panel.hidden) accept.focus();
    });
    panel.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        panel.hidden = true;
        settings.setAttribute('aria-expanded', 'false');
        settings.focus();
      }
    });
    document.body.appendChild(panel);
    document.body.appendChild(settings);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();

  document.addEventListener('click', function (event) {
    if (!event.isTrusted || event.defaultPrevented || choice !== 'granted' || !loaded || converted) return;
    if (!/^\/hablemos\/(?:index\.html)?$/.test(window.location.pathname)) return;
    var link = event.target.closest && event.target.closest('a.btn-wa');
    if (!link) return;
    var destination;
    try { destination = new URL(link.href); } catch (_) { return; }
    if (destination.origin !== 'https://wa.me' || destination.pathname !== '/5492281375390') return;
    converted = true;
    var sameTab = !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey &&
      (!link.target || link.target === '_self') && !link.hasAttribute('download');
    var navigated = false;
    function navigate() {
      if (sameTab && !navigated) { navigated = true; window.location.assign(destination.href); }
    }
    if (sameTab) {
      event.preventDefault();
      window.setTimeout(navigate, 1200);
    }
    window.gtag('event', 'conversion', { send_to: conversionId, value: 0, currency: 'USD',
      page_location: measurementUrl(window.location.href, true),
      page_referrer: measurementUrl(document.referrer, false),
      event_callback: navigate, event_timeout: 1000 });
  });
})();
