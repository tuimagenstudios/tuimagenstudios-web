import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, '.pages-output');
if (output !== path.join(root, '.pages-output') || !output.startsWith(root + path.sep)) throw new Error('Unsafe output directory');
if (existsSync(output)) {
  if (lstatSync(output).isSymbolicLink()) throw new Error('Output directory cannot be a symlink');
  rmSync(output, { recursive: true });
}
mkdirSync(output, { recursive: true });

const directories = new Set(['assets', 'automatizaciones-ia', 'bots-ia', 'despertar', 'diseno-grafico', 'diseno-web', 'libros', 'marketing-digital', 'verificacion', 'lead-magnet']);
const rootFiles = new Set(['CNAME', 'index.html', 'site.js', 'script.js', 'home-3d.js', 'styles.css', 'logo.png', 'logo-dark.png', 'og-image.png', 'robots.txt', 'sitemap.xml']);
const publicExtension = /\.(html|css|js|png|jpe?g|webp|svg|gif|ico|pdf|woff2?|ttf|otf|txt|xml)$/i;
const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean)
  .filter(file => {
    if (file.split('/').some(segment => segment.startsWith('.') || segment.startsWith('_'))) return false;
    return rootFiles.has(file) || /^[a-f0-9]{32}\.txt$/.test(file) ||
      (directories.has(file.split('/')[0]) && publicExtension.test(file));
  });

function hardenHtml(source, file) {
  const html = source.replace(/\r\n?/g, '\n');
  if (!/<head\b[^>]*>/i.test(html)) throw new Error(`Missing head element: ${file}`);
  if (/<meta\b[^>]*http-equiv\s*=\s*["']?Content-Security-Policy/i.test(html)) throw new Error(`Review the pre-existing CSP: ${file}`);
  if (/<[a-z][^>]*\s+on[a-z]+\s*=/i.test(html)) throw new Error(`Remove inline event attributes: ${file}`);
  const hashes = new Set();
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (/\bsrc\s*=/.test(match[1]) || !match[2].trim()) continue;
    hashes.add(`'sha256-${crypto.createHash('sha256').update(match[2]).digest('base64')}'`);
  }
  const policy = [
    "default-src 'self'",
    `script-src 'self' https://*.clarity.ms ${[...hashes].sort().join(' ')}`.trim(),
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: https://*.clarity.ms https://c.bing.com",
    "connect-src 'self' https://api.tuimagenstudios.com https://api.web3forms.com https://*.clarity.ms https://c.bing.com",
    "object-src 'none'", "base-uri 'none'", "frame-src 'none'",
    "form-action 'self' https://api.web3forms.com", 'upgrade-insecure-requests'
  ].join('; ');
  // frame-ancestors, X-Frame-Options, HSTS and nosniff cannot be enforced by
  // HTML meta tags. Do not advertise unsupported HTTP protections on Pages.
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}">\n<meta name="referrer" content="strict-origin-when-cross-origin">`;
  const charset = /<meta\b[^>]*charset\s*=[^>]*>/i;
  return charset.test(html) ? html.replace(charset, match => `${match}\n${meta}`)
    : html.replace(/<head\b[^>]*>/i, match => `${match}\n<meta charset="utf-8">\n${meta}`);
}

let pages = 0;
for (const file of files) {
  const source = path.resolve(root, file);
  if (!source.startsWith(root + path.sep) || lstatSync(source).isSymbolicLink()) throw new Error('Unsafe public source');
  const dest = path.join(output, file);
  mkdirSync(path.dirname(dest), { recursive: true });
  if (file.endsWith('.html')) {
    writeFileSync(dest, hardenHtml(readFileSync(source, 'utf8'), file));
    pages++;
  } else copyFileSync(source, dest);
}
// Publish prebuilt HTML directly: do not run Jekyll or expose internal sources.
writeFileSync(path.join(output, '.nojekyll'), '');
console.log(`GitHub Pages: ${files.length} public files, ${pages} pages protected with meta CSP.`);
