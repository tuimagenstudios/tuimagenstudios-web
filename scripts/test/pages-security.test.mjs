import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const built = spawnSync(process.execPath, ['scripts/build-pages.mjs'], { cwd: root, encoding: 'utf8' });
const output = path.join(root, '.pages-output');
function requireBuild() { assert.equal(built.status, 0, 'Secure GitHub Pages build must complete: ' + built.stderr); }
function policyFrom(html) {
  return html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"[^>]*>/)?.[1];
}

test('GitHub Pages gets a CSP before resources load without publishing backend or drafts', () => {
  requireBuild();
  const html = readFileSync(path.join(output, 'index.html'), 'utf8');
  const policy = policyFrom(html);
  assert.ok(policy);
  assert.ok(html.indexOf('http-equiv="Content-Security-Policy"') < html.indexOf('<script'));
  assert.match(policy, /object-src 'none'/);
  assert.match(policy, /base-uri 'none'/);
  assert.doesNotMatch(policy, /frame-ancestors|report-uri|sandbox/); // Not supported in meta CSP.
  assert.match(html, /<meta name="referrer" content="strict-origin-when-cross-origin"/);
  for (const file of ['commerce-api/lib/security.js', '.env', 'scripts/build-pages.mjs', 'despertar/_borradores-codex-no-publicar/README.md']) {
    assert.equal(existsSync(path.join(output, file)), false, `${file} must not be published`);
  }
});

test('every page authorizes its current inline scripts but no arbitrary inline script', () => {
  requireBuild();
  const files = readdirSync(output, { recursive: true }).filter(file => file.endsWith('.html'));
  assert.ok(files.length >= 15);
  for (const file of files) {
    const html = readFileSync(path.join(output, file), 'utf8');
    const policy = policyFrom(html);
    assert.ok(policy, `Missing CSP in ${file}`);
    const scripts = policy.match(/script-src ([^;]+)/)?.[1];
    assert.doesNotMatch(scripts, /unsafe-inline|unsafe-eval/);
    const injected = crypto.createHash('sha256').update('window.untrustedInjection = true').digest('base64');
    assert.equal(scripts.includes(injected), false);
    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
      if (/\bsrc\s*=/.test(match[1]) || !match[2].trim()) continue;
      const hash = crypto.createHash('sha256').update(match[2]).digest('base64');
      assert.ok(scripts.includes(`'sha256-${hash}'`), `Blocked legitimate script in ${file}`);
    }
  }
});

test('public routes, downloads, Three.js, checkout and the custom domain survive the build', () => {
  requireBuild();
  for (const file of ['index.html', 'libros/index.html', 'libros/tu-keto-hoy/index.html', 'libros/checkout.js', 'assets/vendor/three.module.min.js', 'despertar/index.html', 'despertar/recursos/despertar-digital-acto-2.pdf', 'robots.txt', 'sitemap.xml', 'CNAME']) {
    assert.ok(existsSync(path.join(output, file)), `${file} must remain available`);
  }
  assert.equal(readFileSync(path.join(output, 'CNAME'), 'utf8').trim(), 'tuimagenstudios.com');
  const policy = policyFrom(readFileSync(path.join(output, 'libros/index.html'), 'utf8'));
  assert.ok(policy.includes('https://api.tuimagenstudios.com'));
  const leadPolicy = policyFrom(readFileSync(path.join(output, 'despertar/index.html'), 'utf8'));
  assert.ok(leadPolicy.includes('https://api.web3forms.com'));
});
