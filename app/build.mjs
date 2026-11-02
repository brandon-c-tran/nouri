// Builds app/nouri.html (the published claude.ai page) from app/src. Usage: node app/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const src = (f) => readFileSync(new URL(`./src/${f}`, import.meta.url), 'utf8');
const leek = src('leek.txt').trim();
const js = ['core.js', 'store.js', 'art.js', 'ui.js'].map(src).join('\n;\n').replaceAll('__LEEK__', leek);
const html = src('shell.html').replace('/*__CSS__*/', () => src('styles.css')).replace('/*__JS__*/', () => js).replaceAll('__LEEK__', leek);
writeFileSync(new URL('./nouri.html', import.meta.url), html);
console.log(`app/nouri.html ${(html.length / 1024).toFixed(1)} KB`);
