import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const built = spawnSync(process.execPath, ['site-hosting/build.mjs'], { cwd: root, encoding: 'utf8' });
const output = path.join(root, '.vercel/output');

test('public build provides enforced headers and excludes backend and internal files', () => {
  assert.equal(built.status, 0, 'A secure static build must complete: ' + built.stderr);
  const config = JSON.parse(readFileSync(path.join(output, 'config.json'), 'utf8'));
  assert.equal(config.version, 3);
  const headers = config.routes[0].headers;
  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.match(headers['Content-Security-Policy'], /frame-ancestors 'none'/);
  assert.match(headers['Content-Security-Policy'], /object-src 'none'/);
  assert.match(headers['Content-Security-Policy'], /base-uri 'none'/);
  assert.doesNotMatch(headers['Content-Security-Policy'].match(/script-src ([^;]+)/)[1], /unsafe-inline|unsafe-eval|https:\s/);
  for (const file of ['commerce-api/lib/security.js', 'commerce-api/.env.example', '.env', '.github/workflows/deploy.yml', 'site-hosting/build.mjs', 'despertar/_borradores-codex-no-publicar/README.md']) {
    assert.equal(existsSync(path.join(output, 'static', file)), false, `${file} must not be served`);
  }
});

test('every existing inline script has its content hash; arbitrary script does not', () => {
  assert.equal(built.status, 0, 'A secure static build must complete');
  const config = JSON.parse(readFileSync(path.join(output, 'config.json'), 'utf8'));
  const policy = config.routes[0].headers['Content-Security-Policy'];
  for (const file of ['index.html', 'despertar/index.html', 'libros/index.html']) {
    const html = readFileSync(path.join(output, 'static', file), 'utf8');
    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
      if (/\bsrc\s*=/.test(match[1]) || !match[2].trim()) continue;
      const hash = crypto.createHash('sha256').update(match[2]).digest('base64');
      assert.ok(policy.includes(`'sha256-${hash}'`), `Inline script blocked in ${file}`);
    }
  }
  const injected = crypto.createHash('sha256').update('window.untrustedInjection = true').digest('base64');
  assert.equal(policy.includes(injected), false);
  assert.ok(policy.includes('https://api.tuimagenstudios.com'));
  assert.ok(policy.includes('https://api.web3forms.com'));
});

test('public pages, free PDFs, Three.js and checkout remain available', () => {
  assert.equal(built.status, 0, 'A secure static build must complete');
  for (const file of ['index.html', 'libros/index.html', 'libros/tu-keto-hoy/index.html', 'libros/checkout.js', 'assets/vendor/three.module.min.js', 'despertar/index.html', 'despertar/recursos/despertar-digital-acto-2.pdf', 'robots.txt', 'sitemap.xml']) {
    assert.ok(existsSync(path.join(output, 'static', file)), `${file} must remain available`);
  }
  const config = JSON.parse(readFileSync(path.join(output, 'config.json'), 'utf8'));
  assert.ok(config.routes.some(route => route.src === '/libros' && route.status === 308 && route.headers.Location === '/libros/'));
  assert.ok(config.routes.some(route => route.src === '/libros/' && route.dest === '/libros/index.html'));
});
