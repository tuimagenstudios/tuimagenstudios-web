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
  assert.ok(files.length >= 12);
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
  for (const file of ['index.html', 'assets/vendor/three.module.min.js', 'despertar/index.html', 'despertar/recursos/despertar-digital-acto-2.pdf', 'robots.txt', 'sitemap.xml', 'CNAME']) {
    assert.ok(existsSync(path.join(output, file)), `${file} must remain available`);
  }
  assert.equal(readFileSync(path.join(output, 'CNAME'), 'utf8').trim(), 'tuimagenstudios.com');
  const policy = policyFrom(readFileSync(path.join(output, 'index.html'), 'utf8'));
  assert.ok(policy.includes('https://api.tuimagenstudios.com'));
  const leadPolicy = policyFrom(readFileSync(path.join(output, 'despertar/index.html'), 'utf8'));
  assert.ok(leadPolicy.includes('https://api.web3forms.com'));
});

test('all published pages initialize local consent before other scripts and permit only named Ads hosts', () => {
  requireBuild();
  for (const file of readdirSync(output, { recursive: true }).filter(file => file.endsWith('.html'))) {
    const html = readFileSync(path.join(output, file), 'utf8');
    assert.equal((html.match(/src="\/assets\/ads-measurement.js"/g) || []).length, 1, file);
    assert.ok(html.indexOf('http-equiv="Content-Security-Policy"') < html.indexOf('/assets/ads-measurement.js'));
    assert.match(html, /<link rel="stylesheet" href="\/assets\/ads-measurement.css">/);
    const policy = policyFrom(html);
    for (const host of ['www.googletagmanager.com', 'www.googleadservices.com', 'www.google.com', 'googleads.g.doubleclick.net', 'pagead2.googlesyndication.com']) {
      assert.ok(policy.includes('https://' + host), host);
    }
    assert.match(policy, /frame-src https:\/\/www\.googletagmanager\.com(?:;|$)/);
    assert.doesNotMatch(policy, /https:\/\/\*\.(?:google|doubleclick|googlesyndication)|unsafe-eval/);
  }
  for (const asset of ['assets/ads-measurement.js', 'assets/ads-measurement.css']) assert.ok(existsSync(path.join(output, asset)), asset);
});
