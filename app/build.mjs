// Builds both targets from app/src. Usage: node app/build.mjs
//  - app/nouri.html: the claude.ai page (Artifact): cloud sync, photos and Claude assists.
//  - app/dist/: the installable PWA (GitHub Pages): on-device data, offline, home-screen icon.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const here = (p) => new URL(p, import.meta.url);
const src = (f) => readFileSync(here(`./src/${f}`), 'utf8');
const leek = src('leek.txt').trim();
const js = ['core.js', 'store.js', 'art.js', 'ui.js'].map(src).join('\n;\n').replaceAll('__LEEK__', leek);
const page = src('shell.html').replace('/*__CSS__*/', () => src('styles.css')).replace('/*__JS__*/', () => js).replaceAll('__LEEK__', leek);
writeFileSync(here('./nouri.html'), page);

const head = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f1ede3">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#15110d">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Nouri">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon.png"><link rel="icon" href="icon-192.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}</style>
</head><body>`;
const html = `${head}\n${page}\n</body></html>`;
const version = createHash('sha256').update(html).digest('hex').slice(0, 12);
mkdirSync(here('./dist/'), { recursive: true });
writeFileSync(here('./dist/index.html'), html);
writeFileSync(here('./dist/sw.js'), readFileSync(here('./pwa/sw.js'), 'utf8').replace('__VERSION__', version));
for (const f of ['manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']) copyFileSync(here(`./pwa/${f}`), here(`./dist/${f}`));
writeFileSync(here('./dist/robots.txt'), 'User-agent: *\nDisallow: /\n');
writeFileSync(here('./dist/.nojekyll'), '');
console.log(`app/nouri.html ${(page.length / 1024).toFixed(1)} KB · app/dist (PWA ${version})`);
