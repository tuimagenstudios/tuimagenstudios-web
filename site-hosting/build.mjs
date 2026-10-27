import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, '.vercel/output');
const expectedOutput = path.join(root, '.vercel', 'output');
// This is the only directory the build may clear. Refuse redirected parents.
if (output !== expectedOutput || !output.startsWith(root + path.sep)) throw new Error('Unsafe build output path');
for (const candidate of [path.join(root, '.vercel'), output]) {
  if (existsSync(candidate) && lstatSync(candidate).isSymbolicLink()) throw new Error('Build output cannot be a symlink');
}
if (existsSync(output)) rmSync(output, { recursive: true });
mkdirSync(path.join(output, 'static'), { recursive: true });

const directories = new Set(['assets', 'automatizaciones-ia', 'bots-ia', 'despertar', 'diseno-grafico', 'diseno-web', 'libros', 'marketing-digital', 'verificacion', 'lead-magnet']);
const rootFiles = new Set(['index.html', 'site.js', 'script.js', 'home-3d.js', 'styles.css', 'logo.png', 'logo-dark.png', 'og-image.png', 'robots.txt', 'sitemap.xml']);
const publicExtension = /\.(html|css|js|png|jpe?g|webp|svg|gif|ico|pdf|woff2?|ttf|otf|txt|xml)$/i;
const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean)
  .filter(file => {
    if (file.split('/').some(segment => segment.startsWith('.') || segment.startsWith('_'))) return false;
    if (rootFiles.has(file) || /^[a-f0-9]{32}\.txt$/.test(file)) return true;
    return directories.has(file.split('/')[0]) && publicExtension.test(file);
  });
const hashes = new Set();
const pageDirectories = new Set();
for (const file of files) {
  const source = path.resolve(root, file);
  if (!source.startsWith(root + path.sep) || lstatSync(source).isSymbolicLink()) throw new Error('Unsafe public source');
  const dest = path.join(output, 'static', file);
  mkdirSync(path.dirname(dest), { recursive: true });
  if (file.endsWith('.html')) {
    // HTML parsers normalize CRLF to LF before checking a CSP content hash.
    const html = readFileSync(source, 'utf8').replace(/\r\n?/g, '\n');
    if (/<[a-z][^>]*\s+on[a-z]+\s*=/i.test(html)) throw new Error(`Inline event handler requires removal: ${file}`);
    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
      if (/\bsrc\s*=/.test(match[1]) || !match[2].trim()) continue;
      hashes.add(`'sha256-${crypto.createHash('sha256').update(match[2]).digest('base64')}'`);
    }
    writeFileSync(dest, html);
    if (file.endsWith('/index.html')) pageDirectories.add('/' + file.slice(0, -'/index.html'.length));
  } else copyFileSync(source, dest);
}

const policy = [
  "default-src 'self'",
  `script-src 'self' https://*.clarity.ms ${[...hashes].sort().join(' ')}`,
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: https://*.clarity.ms https://c.bing.com",
  "connect-src 'self' https://api.tuimagenstudios.com https://api.web3forms.com https://*.clarity.ms https://c.bing.com",
  "object-src 'none'", "base-uri 'none'", "frame-src 'none'", "frame-ancestors 'none'",
  "form-action 'self' https://api.web3forms.com", 'upgrade-insecure-requests'
].join('; ');
const headers = {
  'Content-Security-Policy': policy,
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  // No includeSubDomains until all independently hosted subdomains are audited.
  'Strict-Transport-Security': 'max-age=31536000'
};
const routes = [{ src: '/.*', headers, continue: true }];
for (const directory of [...pageDirectories].sort()) {
  routes.push({ src: directory, headers: { Location: directory + '/' }, status: 308 });
  routes.push({ src: directory + '/', dest: directory + '/index.html' });
}
routes.push({ src: '/', dest: '/index.html' }, { handle: 'filesystem' }, { src: '/.*', status: 404, dest: '/404.html' });
writeFileSync(path.join(output, 'static/404.html'), '<!doctype html><html lang="es"><meta charset="utf-8"><title>Página no encontrada</title><h1>Página no encontrada</h1><a href="/">Volver al inicio</a></html>');
writeFileSync(path.join(output, 'config.json'), JSON.stringify({ version: 3, routes }, null, 2));
console.log(`Public build: ${files.length} files, ${hashes.size} allowed inline script hashes; backend excluded.`);
