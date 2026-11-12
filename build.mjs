// Builds public/index.html from src/ and stamps public/sw.js with a cache version.
// Usage: node build.mjs        (no dependencies, Node 18+)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const src = f => readFileSync(join(root, 'src', f), 'utf8');
const pub = join(root, 'public');

const css = src('style.css');
const body = src('body.html');
const js = ['p1_core.js', 'i18n.js', 'p2_geom.js', 'p3_layout.js', 'p4_ui.js', 'p6_cards.js', 'p5_io.js'].map(src).join('');

const html = `<!DOCTYPE html>
<html lang="fil">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Family Sign Studio</title>
<meta name="description" content="Design and align hanging family welcome signs: preview the layout, let the customer adjust it, and send the shop a finished spec.">
<meta name="theme-color" content="#ffffff">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/svg+xml" href="icons/icon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Sign Studio">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="preload" as="font" type="font/woff2" href="fonts/figtree-latin-600-normal.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="fonts/bricolage-grotesque-latin-700-normal.woff2" crossorigin>
<style>
${css}
</style>
</head>
<body>
${body}
<script>
${js}
</script>
</body>
</html>
`;
writeFileSync(join(pub, 'index.html'), html);

// everything in public/ except the worker itself and licence texts gets precached
const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (n !== 'sw.js' && !n.endsWith('.txt')) files.push(relative(pub, p).split(sep).join('/'));
  }
})(pub);
files.sort();
const precache = ['./', ...files];
const hash = createHash('sha1');
for (const f of files) hash.update(f).update(readFileSync(join(pub, f)));
const version = hash.digest('hex').slice(0, 10);
const sw = src('sw.template.js').replace('__VERSION__', version).replace('__PRECACHE__', JSON.stringify(precache, null, 2));
writeFileSync(join(pub, 'sw.js'), sw);
console.log(`built public/index.html (${(html.length / 1024).toFixed(1)} KB), sw cache fss-${version}, ${precache.length} precached files`);
