import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const sourcePath = new URL('../../assets/ads-measurement.js', import.meta.url);
const source = existsSync(sourcePath) ? readFileSync(sourcePath, 'utf8') : '';

function browser({ url = 'https://tuimagenstudios.com/hablemos/?texto=Nombre%20privado&gclid=Click_123', choice, storageBlocked = false } = {}) {
  const listeners = {}, elements = [], scripts = [], timers = [], navigations = [];
  const storage = new Map(choice ? [['tuimagen-ads-consent-v1', choice]] : []);
  function element(tag) {
    const el = { tagName: tag.toUpperCase(), children: [], hidden: false, style: {}, attributes: {}, listeners: {},
      appendChild(child) { this.children.push(child); if (child.tagName === 'SCRIPT') scripts.push(child); return child; },
      setAttribute(key, value) { this.attributes[key] = value; },
      addEventListener(type, fn) { this.listeners[type] = fn; },
      focus() { el.focused = true; },
      click() { this.listeners.click?.({ isTrusted: true }); }
    };
    elements.push(el); return el;
  }
  const wa = element('a'); wa.href = 'https://wa.me/5492281375390?text=default';
  const chat = element('a'); chat.href = 'https://bot-tuimagen.tuimagenstudio.workers.dev/';
  const location = new URL(url);
  location.assign = href => navigations.push(href);
  const document = {
    readyState: 'loading', referrer: 'https://tuimagenstudios.com/?texto=ReferrerPrivado',
    head: element('head'), body: element('body'), createElement: element,
    querySelector: sel => sel === '.btn-wa' ? wa : sel === '.btn-web' ? chat : null,
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }
  };
  const context = { document, location, URL, URLSearchParams, Date, console,
    history: { state: null, replaceState(state, title, href) { location.href = new URL(href, location).href; } },
    localStorage: { getItem(key) { if (storageBlocked) throw Error('blocked'); return storage.get(key) || null; }, setItem(key, value) { if (storageBlocked) throw Error('blocked'); storage.set(key, value); } },
    setTimeout(fn) { timers.push(fn); return timers.length; }, clearTimeout() {},
    addEventListener() {}
  };
  context.window = context;
  vm.runInNewContext(source, context);
  listeners.DOMContentLoaded?.forEach(fn => fn());
  const button = label => elements.find(el => el.tagName === 'BUTTON' && el.textContent === label);
  const click = ({ href = wa.href, isTrusted = true, classMatches = true, ...extra } = {}) => {
    const link = { href, target: '', hasAttribute: () => false };
    const event = { isTrusted, button: 0, defaultPrevented: false, target: { closest: () => classMatches ? link : null },
      preventDefault() { this.defaultPrevented = true; }, ...extra };
    listeners.click?.forEach(fn => fn(event)); return event;
  };
  const commands = () => (context.dataLayer || []).map(args => [...args]);
  return { context, document, scripts, storage, timers, navigations, wa, chat, button, click, commands };
}

test('basic consent loads no Google code until acceptance and remembers rejection', () => {
  const b = browser();
  assert.ok(b.button('Aceptar medición'), 'measurement choice must be offered');
  assert.equal(b.scripts.length, 0);
  b.button('Rechazar medición').click();
  assert.equal(b.storage.get('tuimagen-ads-consent-v1'), 'denied');
  assert.equal(b.scripts.length, 0);
  assert.equal(b.click().defaultPrevented, false);
  assert.equal(b.commands().filter(c => c[0] === 'event').length, 0);
  assert.ok(b.button('Preferencias de medición'));
});

test('acceptance initializes Ads once with restricted consent and sanitized URLs', () => {
  const b = browser();
  b.button('Aceptar medición')?.click();
  assert.equal(b.scripts.length, 1);
  assert.equal(b.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=AW-18537866471');
  assert.equal(b.scripts[0].referrerPolicy, 'origin');
  assert.equal(b.storage.get('tuimagen-ads-consent-v1'), 'granted');
  const updates = b.commands().filter(c => c[0] === 'consent');
  assert.equal(updates[0][1], 'default');
  assert.equal(updates.at(-1)[2].ad_storage, 'granted');
  for (const [, , state] of updates) {
    for (const field of ['ad_user_data', 'ad_personalization', 'analytics_storage']) assert.equal(state[field], 'denied');
  }
  assert.doesNotMatch(JSON.stringify(b.commands()), /Nombre|privado|ReferrerPrivado|texto/);
  assert.match(JSON.stringify(b.commands()), /Click_123/);
  b.button('Aceptar medición').click();
  assert.equal(b.scripts.length, 1);
});

test('texto is removed before Google loads while both contact messages survive', () => {
  const b = browser({ choice: 'granted' });
  assert.equal(b.context.location.search, '?gclid=Click_123');
  assert.equal(new URL(b.wa.href).searchParams.get('text'), 'Nombre privado');
  assert.equal(new URL(b.chat.href).searchParams.get('texto'), 'Nombre privado');
  assert.equal(b.scripts.length, 1);
});

test('only actual exact BOT clicks on hablemos convert, once, with callback navigation', () => {
  const b = browser({ choice: 'granted' });
  for (const options of [{ isTrusted: false }, { classMatches: false }, { href: 'https://wa.me/79098745709' }, { href: 'https://wa.me.evil.test/5492281375390' }, { href: 'https://bot-tuimagen.tuimagenstudio.workers.dev/' }]) b.click(options);
  assert.equal(b.commands().filter(c => c[0] === 'event').length, 0);
  const click = b.click();
  assert.equal(click.defaultPrevented, true);
  const conversion = b.commands().find(c => c[0] === 'event');
  assert.equal(conversion[1], 'conversion');
  assert.equal(conversion[2].send_to, 'AW-18537866471/HEUvCNqm5LEdEOfJxYdF');
  assert.equal(conversion[2].value, 0);
  assert.equal(conversion[2].currency, 'USD');
  b.click();
  assert.equal(b.commands().filter(c => c[0] === 'event').length, 1);
  conversion[2].event_callback();
  b.timers.forEach(fn => fn());
  assert.deepEqual(b.navigations, [b.wa.href]);
});

test('blocked tag still navigates after timeout and modified clicks retain native behavior', () => {
  const b = browser({ choice: 'granted' }); b.click();
  b.timers.forEach(fn => fn());
  assert.deepEqual(b.navigations, [b.wa.href]);
  const modified = browser({ choice: 'granted' });
  assert.equal(modified.click({ ctrlKey: true }).defaultPrevented, false);
});

test('other pages never convert, including legacy whatsapp and arrivals', () => {
  for (const path of ['/', '/bots-ia/', '/whatsapp/']) {
    const b = browser({ choice: 'granted', url: `https://tuimagenstudios.com${path}` });
    b.click();
    assert.equal(b.commands().filter(c => c[0] === 'event').length, 0);
  }
});

test('saved rejection and unavailable storage keep navigation working', () => {
  for (const options of [{ choice: 'denied' }, { storageBlocked: true }]) {
    const b = browser(options);
    assert.equal(b.scripts.length, 0);
    assert.equal(b.click().defaultPrevented, false);
    b.button('Aceptar medición')?.click();
    assert.equal(b.scripts.length, 1);
  }
});

test('revoking acceptance updates consent and stops conversion events', () => {
  const b = browser({ choice: 'granted' });
  b.button('Preferencias de medición')?.click();
  b.button('Rechazar medición')?.click();
  assert.equal(b.storage.get('tuimagen-ads-consent-v1'), 'denied');
  assert.equal(b.commands().filter(c => c[0] === 'consent').at(-1)[2].ad_storage, 'denied');
  assert.equal(b.click().defaultPrevented, false);
  assert.equal(b.commands().filter(c => c[0] === 'event').length, 0);
});
