// Installable-app checks for app/dist at iPhone size: manifest, offline service worker,
// on-device photos across reloads, and backup → restore with photos. Usage: node app/test/pwa.mjs [screenshotDir]
import { createRequire } from 'node:module';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, dirname, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const DIST = join(here, '../dist');
const OUT = process.argv[2] || join(tmpdir(), 'nouri-pwa'); mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.txt': 'text/plain' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = join(DIST, p); if (!f.startsWith(DIST) || !existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL_ = `http://127.0.0.1:${server.address().port}/`;
let failures = 0; const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) failures++; };
const W = (p, ms) => p.waitForTimeout(ms);
const b = await chromium.launch();
const errsOf = (p) => { const e = []; p.on('pageerror', (x) => e.push(x.message)); p.on('console', (m) => m.type() === 'error' && !/fonts\.g|net::|ERR_|Failed to load resource/.test(m.text()) && e.push(m.text())); return e; };

let backupPath = null;
{
  const ctx = await b.newContext({ ...devices['iPhone 13'], acceptDownloads: true });
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto(URL_); await W(p, 900);
  const man = await p.evaluate(async () => { const l = document.querySelector('link[rel="manifest"]'); return l ? (await fetch(l.href)).json() : null; });
  ok(man && man.display === 'standalone' && man.icons.length >= 2 && man.start_url, 'Installable: manifest with standalone display and icons');
  ok(await p.evaluate(() => !!document.querySelector('link[rel="apple-touch-icon"]') && !!document.querySelector('meta[name="apple-mobile-web-app-capable"]')), 'Installable: iOS home-screen icon and full-screen meta');
  await p.evaluate(() => navigator.serviceWorker.ready); await p.reload(); await W(p, 700);
  ok(await p.evaluate(() => !!navigator.serviceWorker.controller), 'Offline worker is active after first visit');
  ok(/craving/i.test(await p.textContent('#v-today h1')), 'Fresh install starts empty, no fake data');

  // Save with a photo → on-device store
  await p.click('.nav .plus'); await W(p, 400);
  await p.fill('#cap-text', 'Tonkotsu ramen'); await p.fill('#cap-why', 'that milky broth');
  const fc = p.waitForEvent('filechooser'); await p.click('#sh-body [data-act="photo"]'); await (await fc).setFiles(join(here, 'fixtures/ramen.jpg'));
  ok(/Preparing photo/.test(await p.textContent('#sh-body .photo-btn')) && await p.$eval('[data-act="save-capture"]', (x) => x.disabled), 'Save waits while the photo is prepared');
  await p.waitForSelector('#sh-body .photo-btn img', { timeout: 15000 });
  await p.click('[data-act="save-capture"]'); await W(p, 700);
  const stored = await p.evaluate(() => [...NouriStore.D.dishes.values()].find((d) => d.name === 'Tonkotsu ramen'));
  ok(stored && stored.photo && stored.photo.idb && !stored.photo.data, 'Photo stored on the phone at full quality (not an inline copy)');
  await p.reload(); await W(p, 900);
  await p.click('.nav [data-go="saved"]'); await W(p, 500);
  ok(/^blob:/.test((await p.getAttribute('#v-saved .card img', 'src')) || ''), 'After reload the photo shows from on-device storage');
  await p.screenshot({ path: join(OUT, 'pwa-saved.png') });

  // Offline
  await ctx.setOffline(true); await p.reload(); await W(p, 900);
  ok(/Tonkotsu ramen/.test(await p.textContent('#v-today')), 'Offline: app opens and shows saved data');
  await p.click('.nav .plus'); await W(p, 400); await p.fill('#cap-text', 'Laksa'); await p.click('[data-act="save-capture"]'); await W(p, 500);
  ok(/Saved/.test(await p.textContent('#toast span')), 'Offline: saving still works');
  await ctx.setOffline(false);

  // Backup
  await p.click('.nav [data-go="history"]'); await W(p, 300); await p.click('#v-history [data-act="settings"]'); await W(p, 400);
  ok(/Saved on this phone/.test(await p.textContent('#sh-body')) && /No backup yet/.test(await p.textContent('#sh-body')), 'Data sheet says where data lives and that there is no backup yet');
  const dl = p.waitForEvent('download'); await p.click('#sh-body [data-act="export"]'); const d = await dl;
  backupPath = join(OUT, 'backup.json'); await d.saveAs(backupPath); await W(p, 300);
  const j = JSON.parse(readFileSync(backupPath, 'utf8'));
  ok(j.dishes.length === 2 && Object.keys(j.photos || {}).length === 1, 'Backup includes saves and the photo itself');
  ok(/Last backup today/.test(await p.textContent('#sh-body')), 'Data sheet remembers the last backup');
  ok(errs.length === 0, `No page errors ${errs.length ? JSON.stringify(errs.slice(0, 3)) : ''}`);
  await ctx.close();
}
{
  // Restore on a "new phone"
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  const p = await ctx.newPage(); const errs = errsOf(p);
  await p.goto(URL_ + '#history'); await W(p, 900);
  await p.click('#v-history [data-act="settings"]'); await W(p, 400);
  const fc = p.waitForEvent('filechooser'); await p.click('#sh-body [data-act="import"]'); await (await fc).setFiles(backupPath); await W(p, 1500);
  ok(/Imported 2 saves/.test(await p.textContent('#sh-body')), 'Restore: backup imports on a fresh install');
  await p.click('.sheet .x'); await W(p, 350); await p.click('.nav [data-go="saved"]'); await W(p, 500);
  const srcs = await p.$$eval('#v-saved .card img', (a) => a.map((x) => x.getAttribute('src') || ''));
  ok(srcs.some((s) => s.startsWith('blob:')), 'Restore: the photo comes back');
  ok(errs.length === 0, `Restore: no page errors ${errs.length ? JSON.stringify(errs.slice(0, 3)) : ''}`);
  await ctx.close();
}
await b.close(); server.close();
console.log(`\n${failures ? `${failures} FAILED` : 'ALL PASSED'}`);
process.exit(failures ? 1 : 0);
