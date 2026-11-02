// End-to-end journeys from docs/NOURI_PRODUCT_EXPERIENCE_BIBLE.md §18, at iPhone size, against the
// mock runtime (persisted across reloads). Usage: node app/test/e2e.mjs [screenshotDir]
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const OUT = process.argv[2] || join(tmpdir(), 'nouri-e2e'); mkdirSync(OUT, { recursive: true });
const page = readFileSync(join(here, '../nouri.html'), 'utf8');
const wrapped = join(OUT, 'page.html');
writeFileSync(wrapped, `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}body{margin:0}[hidden]{display:none!important}</style></head><body>${page}</body></html>`);
const mock = readFileSync(join(here, 'mock-runtime.js'), 'utf8');
// Serve over http: file:// storage in headless Chromium can vanish between reloads, which would fake data loss.
const { createServer } = await import('node:http');
const server = createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(readFileSync(wrapped)); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL_ = `http://127.0.0.1:${server.address().port}/`;

let failures = 0; const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) failures++; };
const b = await chromium.launch();
async function run(name, opts, fn) {
  const ctx = await b.newContext({ ...devices['iPhone 13'], ...opts });
  if (opts.mock !== false) await ctx.addInitScript({ content: mock });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/fonts\.g|net::|ERR_/.test(m.text()) && errs.push(m.text()));
  await p.goto(URL_); await p.waitForTimeout(700);
  console.log(`\n== ${name}`);
  try { await fn(p, ctx); } catch (e) { ok(false, `${name} threw: ${e.message.split('\n')[0]}`); await p.screenshot({ path: join(OUT, `${name}-crash.png`) }); }
  ok(errs.length === 0, `${name}: no page errors ${errs.length ? JSON.stringify(errs.slice(0, 3)) : ''}`);
  await ctx.close();
}
const W = (p, ms) => p.waitForTimeout(ms);
const shot = (p, n) => p.screenshot({ path: join(OUT, n + '.png') });
const text = (p, s) => p.textContent(s).catch(() => '');
const reload = async (p) => { await p.reload(); await W(p, 800); };

await run('journeys', {}, async (p) => {
  // G: blank state
  ok(/craving/i.test(await text(p, '#v-today h1')), 'G blank: Today asks what you are craving');
  ok(await p.$('#cap-inline-text') !== null, 'G blank: capture field is right on Today');
  ok((await p.$$('#v-today .slot')).length === 0, 'G blank: no fake personalized picks');
  await shot(p, '01-blank');

  // A: URL-only save from Today
  await p.fill('#cap-inline-text', 'https://www.tiktok.com/@chef/video/7301?lang=en');
  await p.click('#cap-inline-save'); await W(p, 400);
  ok(/Saved/.test(await text(p, '#toast span')), 'A: URL-only save confirms Saved');
  await reload(p);
  await p.click('.nav [data-go="saved"]'); await W(p, 250);
  ok(/TikTok save/.test(await text(p, '#v-saved')), 'A: after reload the TikTok save is in Saved');
  await p.click('#v-saved .card'); await W(p, 400);
  ok((await p.getAttribute('#sh-body .spark a', 'href')) === 'https://www.tiktok.com/@chef/video/7301?lang=en', 'A: exact original URL preserved');
  await p.click('.sheet .x'); await W(p, 350);

  // A2: link + reason through the sheet; recipe slug gives a name guess
  await p.click('.nav .plus'); await W(p, 400);
  await p.fill('#cap-text', 'https://www.seriouseats.com/crispy-smashed-potatoes-recipe'); await W(p, 100);
  ok(/Crispy smashed potatoes/.test(await text(p, '.detected')), 'A2: link detected with a name from the recipe URL');
  await p.fill('#cap-why', 'the crispy edges');
  await shot(p, '02-capture');
  await p.click('[data-act="save-capture"]'); await W(p, 400);
  // text saves (one gets Claude enrichment)
  for (const [t, why] of [['Pad kra pao', 'need Thai basil'], ['Ginger beef gyudon', ''], ['Fried rice', '']]) {
    await p.click('.nav .plus'); await W(p, 380); await p.fill('#cap-text', t); if (why) await p.fill('#cap-why', why); await p.click('[data-act="save-capture"]'); await W(p, 380);
  }
  await W(p, 500);
  const kp = Object.values(await p.evaluate(() => window.__docs())).find((d) => d && d.name === 'Pad kra pao');
  ok(kp && kp.ingredients.length === 6 && kp.ingredientsFrom === 'claude' && kp.guessed.minutes === 'claude', 'A: enrichment filled ingredients after saving, marked as a guess');

  // B: decide
  await p.click('.nav [data-go="today"]'); await W(p, 500);
  const picks = await p.$$eval('#v-today .slot[data-id] h3', (a) => a.map((x) => x.textContent));
  const reasons = await p.$$eval('#v-today .slot[data-id]', (a) => a.map((x) => [x.querySelector('.strip p'), x.querySelector('.qt')].filter(Boolean).map((y) => y.textContent).join(' ')));
  ok(picks.length === 3, `B: three picks from my own saves (${picks.join(', ')})`);
  ok(reasons.some((r) => /the crispy edges|need Thai basil/.test(r)), `B: reasons quote what I saved (${reasons.join(' | ')})`);
  await shot(p, '03-today');
  const first = picks[0];
  await p.click('#v-today .slot[data-slot="0"] [data-act="nope"]'); await W(p, 600);
  const after = await p.$$eval('#v-today .slot[data-id] h3', (a) => a.map((x) => x.textContent));
  ok(!after.includes(first), `B: "Not tonight" replaces ${first}`);
  await p.click('#v-today .slot[data-slot="1"] [data-act="choose"]'); await W(p, 1800);
  ok((await p.$$('.tonight .btn')).length === 2, 'B: choosing shows Start cooking / We ate it');
  ok(/Tonight:/.test(await text(p, '#v-today h1')), 'B: Today header reflects the choice');
  await shot(p, '04-chosen');

  // C: grocery pivot with shared + bought items
  const dishId = async (n) => p.evaluate((n) => { for (const [k, v] of Object.entries(window.__docs())) if (v && v.name === n) return k.split('/').pop(); }, n);
  const setIngs = async (n, list) => { await p.click('.nav [data-go="saved"]'); await W(p, 200); await p.fill('#sv-q', n); await W(p, 200); await p.click('#v-saved .card'); await W(p, 380); await p.click('#sh-body [data-act="edit"]'); await W(p, 380); await p.fill('#e-ing', list.join('\n')); await p.click('[data-act="save-edit"]'); await W(p, 380); await p.click('.sheet .x'); await W(p, 330); await p.fill('#sv-q', ''); };
  await setIngs('Ginger beef gyudon', ['rice', '2 cloves garlic', 'beef']);
  await setIngs('Fried rice', ['rice', 'eggs', 'scallions']);
  await p.click('.nav [data-go="week"]'); await W(p, 300);
  await p.click('#v-week [data-act="picker"]'); await W(p, 400);
  for (const n of ['Ginger beef gyudon', 'Pad kra pao']) { const id = await dishId(n); await p.click(`#sh-body [data-act="plan"][data-id="${id}"]`); await W(p, 200); }
  await p.click('.sheet .x'); await W(p, 350);
  const need1 = await p.$$eval('#v-week .gi .n', (a) => a.map((x) => x.textContent.trim()));
  ok(need1.filter((n) => /^rice/.test(n)).length === 1 && need1.some((n) => /garlic/.test(n)), `C: rice and garlic appear once each (${need1.length} lines)`);
  await p.click('#v-week [data-act="gtoggle"][data-k="rice"]'); await W(p, 200);
  const gyu = await dishId('Ginger beef gyudon'), fr = await dishId('Fried rice');
  await p.click(`#v-week [data-act="swap"][data-id="${gyu}"]`); await W(p, 400);
  await p.click(`#sh-body [data-act="swapto"][data-id="${fr}"]`); await W(p, 400);
  await reload(p); await p.click('.nav [data-go="week"]'); await W(p, 300);
  const weekNames = await p.$$eval('#v-week .rows', (a) => [...a[0].querySelectorAll('h3')].map((x) => x.textContent));
  const needAfter = await p.$$eval('#v-week .glist .gi:not(.done) .n', (a) => a.map((x) => x.textContent.trim()));
  const boughtHtml = await p.$eval('#v-week', (e) => e.innerHTML);
  ok(weekNames.includes('Fried rice') && !weekNames.includes('Ginger beef gyudon'), 'C: swap persisted after reload');
  ok(!needAfter.some((n) => /^rice/.test(n)) && /Bought · 1/.test(boughtHtml), 'C: rice still bought after swap + reload');
  ok(needAfter.some((n) => /^egg/i.test(n)) && !needAfter.some((n) => /^beef/.test(n)), 'C: unique ingredients recomputed (eggs in, beef out)');
  ok(needAfter.some((n) => /garlic/.test(n)), 'C: garlic stays because Pad kra pao still needs it');
  await shot(p, '05-week');

  // D: cook with photos, reload, resume, finish
  await p.click('.nav [data-go="today"]'); await W(p, 400);
  if (await p.$('.tonight [data-act="cook"]')) await p.click('.tonight [data-act="cook"]'); else { await p.click('#v-today .slot[data-slot="0"] [data-act="choose"]'); await W(p, 1700); await p.click('.tonight [data-act="cook"]'); }
  await W(p, 500);
  await p.click('#cook [data-act="stage"][data-v="Sauce"]');
  await p.fill('#cook-note', 'Bloomed the garlic, smells great'); await p.press('#cook-note', 'Enter'); await W(p, 300);
  for (let i = 0; i < 3; i++) { const fc = p.waitForEvent('filechooser'); await p.click('#cookbar [data-act="cam"]'); await (await fc).setFiles(join(here, 'fixtures/step.jpg')); await W(p, 700); }
  ok((await p.$$('#cook .tl li')).length === 4, 'D: 1 note + 3 photos on the cook timeline');
  await shot(p, '06-cook');
  await reload(p);
  ok(/Back to the stove/.test(await text(p, '#v-today .banner')), 'D: after reload Today offers to resume the cook');
  if (!(await p.$('#cook.on'))) { await p.click('#v-today .banner'); await W(p, 500); } else ok(true, 'D: the cook reopened by itself after reload');
  ok((await p.$$('#cook .tl li')).length === 4, 'D: resumed cook keeps all entries');
  await p.click('#cook [data-act="finish"]'); await W(p, 400);
  await p.click('#sh-body [data-seg="rating"][data-v="5"]'); await p.fill('#f-next', 'more fish sauce');
  await p.click('[data-act="save-finish"]'); await W(p, 700);
  ok(/History/.test(await text(p, '#v-history h1')) && /Loved it/.test(await text(p, '#v-history .rows')), 'D: finished cook is in History, rated');
  await p.click('#v-history .row'); await W(p, 400);
  ok((await p.$$('#sh-body .tl li')).length >= 4 && /more fish sauce/.test(await text(p, '#sh-body')), 'D: meal shows the full timeline and next-time note');
  await shot(p, '07-meal');
  const cookedDish = await p.$eval('#sh-body [data-act="cook"]', (e) => e.dataset.id);
  await p.click('#sh-body [data-act="cook"]'); await W(p, 500);
  ok(/Last time/.test(await text(p, '#cook')) && /more fish sauce/.test(await text(p, '#cook')), 'D: a second cook shows the previous attempt');
  await p.click('#cook [data-act="cook-close"]'); await W(p, 400);

  // E: eat out → recreate
  await p.click('.nav [data-go="history"]'); await W(p, 300);
  await p.click('#v-history .hd [data-act="log"]'); await W(p, 400);
  { const fc = p.waitForEvent('filechooser'); await p.click('#sh-body [data-act="photo"]'); await (await fc).setFiles(join(here, 'fixtures/ramen.jpg')); await W(p, 500); }
  await p.fill('#l-title', 'Tonkotsu ramen'); await p.fill('#l-place', 'Ramen Tatsu');
  await p.click('#sh-body [data-seg="rating"][data-v="5"]'); await p.fill('#l-note', 'milky broth, thin noodles');
  await p.click('#sh-body [data-act="toggle-recreate"]'); await W(p, 150);
  await shot(p, '08-log');
  await p.click('[data-act="save-log"]'); await W(p, 600);
  await p.click('.nav [data-go="saved"]'); await W(p, 250);
  await p.click('#v-saved [data-act="filter"][data-v="recreate"]'); await W(p, 250);
  ok(/Tonkotsu ramen/.test(await text(p, '#v-saved')), 'E: restaurant meal saved as something to recreate');
  await p.click('#v-saved .card'); await W(p, 400);
  ok(/Ramen Tatsu/.test(await text(p, '#sh-body')) && /milky broth/.test(await text(p, '#sh-body')), 'E: dish keeps the restaurant target and tasting note');
  await shot(p, '09-recreate');
  await p.click('.sheet .x'); await W(p, 300);

  // H: mobile checks on every main view
  for (const v of ['today', 'saved', 'week', 'history']) {
    await p.click(`.nav [data-go="${v}"]`); await W(p, 300);
    const r = await p.evaluate(() => ({ w: document.documentElement.scrollWidth, small: [...document.querySelectorAll('button,input,textarea,a')].filter((e) => { const b = e.getBoundingClientRect(); return b.width && b.height && e.offsetParent !== null && (b.width < 40 || b.height < 40) && !e.closest('.spark,.note'); }).map((e) => (e.getAttribute('aria-label') || e.textContent.trim()).slice(0, 24) + ` ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`) }));
    ok(r.w <= 390, `H ${v}: no horizontal scroll (${r.w}px)`);
    ok(r.small.length === 0, `H ${v}: tap targets ≥40px ${r.small.length ? JSON.stringify(r.small.slice(0, 4)) : ''}`);
  }
  await p.click('.nav .plus'); await W(p, 400);
  ok((await p.$$eval('#sh-body input, #sh-body textarea', (a) => a.map((x) => parseFloat(getComputedStyle(x).fontSize)))).every((s) => s >= 16), 'H: capture inputs ≥16px (no iOS zoom)');
  await p.click('.sheet .x'); await W(p, 300);
  await p.click('.nav [data-go="today"]'); await W(p, 500); await shot(p, '10-today-later');
  await p.click('.nav [data-go="saved"]'); await W(p, 300); await shot(p, '11-saved');
  await p.click('.nav [data-go="history"]'); await W(p, 300); await shot(p, '12-history');
});

await run('trust-offline', {}, async (p) => {
  // F: writes fail → no false success; data kept and synced later
  await p.evaluate(() => { window.__failWrites = true; localStorage.setItem('__failWrites', '1'); });
  await p.fill('#cap-inline-text', 'Mapo tofu'); await p.click('#cap-inline-save'); await W(p, 400);
  ok(/Couldn't reach/.test(await text(p, '#toast span')), 'F: failed write is reported, not shown as Saved');
  ok(/Mapo tofu/.test(await text(p, '#v-today')), 'F: the save stays visible');
  await p.evaluate(() => localStorage.removeItem('__failWrites'));
  await reload(p); await W(p, 900);
  let synced = false;
  for (let i = 0; i < 20 && !synced; i++) { synced = Object.values(await p.evaluate(() => window.__docs())).some((d) => d && d.name === 'Mapo tofu'); if (!synced) await W(p, 200); }
  ok(synced, 'F: queued save synced after the connection came back');
});

await run('migration', {}, async (p) => {
  // I: old index.html export → import
  await p.click('.nav [data-go="history"]'); await W(p, 300);
  await p.click('#v-history [data-act="settings"]'); await W(p, 400);
  const fc = p.waitForEvent('filechooser'); await p.click('#sh-body [data-act="import"]'); await (await fc).setFiles(join(here, 'fixtures/old-v0-export.json')); await W(p, 1500);
  ok(/Imported 1 saves, 1 meals/.test(await text(p, '#sh-body')), 'I: import reports 1 save and 1 meal (sample skipped)');
  await p.click('.sheet .x'); await W(p, 350);
  await p.click('.nav [data-go="saved"]'); await W(p, 300);
  ok(/Bún chả/.test(await text(p, '#v-saved')) && (await p.$('#v-saved .card img')) !== null, 'I: imported save keeps its photo');
  await p.click('#v-saved .card'); await W(p, 400);
  ok(/the charred pork/.test(await text(p, '#sh-body')) && (await p.getAttribute('#sh-body .spark a', 'href')) === 'https://www.tiktok.com/@hanoi/video/42', 'I: original link and reason survive');
  await p.click('.sheet .x'); await W(p, 300);
  await p.click('.nav [data-go="history"]'); await W(p, 300);
  ok(/Loved it/.test(await text(p, '#v-history')), 'I: imported meal keeps its rating');
  await p.click('.nav [data-go="week"]'); await W(p, 300);
  ok(/Bún chả/.test(await text(p, '#v-week')), 'I: imported plan is in this week');
});

await run('local-fallback', { mock: false }, async (p) => {
  await p.fill('#cap-inline-text', 'Laksa'); await p.click('#cap-inline-save'); await W(p, 300);
  await reload(p);
  ok(/Laksa/.test(await text(p, '#v-today')), 'Local: outside claude.ai a save survives reload in browser storage');
});

await run('dark-reduced', { colorScheme: 'dark', reducedMotion: 'reduce' }, async (p) => {
  for (const [path, data] of [['data/users/u_test/ideas/items/s-gyudon', { art: 'gyudon', seed: 11, title: 'Ginger beef gyudon', source: 'starter', createdAt: '2026-10-30T07:00:00.000Z' }], ['data/users/u_test/ideas/items/s-chili', { art: 'chili', seed: 37, title: 'Crispy chili oil noodles', source: 'starter', createdAt: '2026-10-28T07:00:00.000Z' }], ['data/users/u_test/ideas/items/s-krapao', { art: 'krapao', seed: 23, title: 'Pad kra pao', source: 'starter', createdAt: '2026-10-29T07:00:00.000Z' }]]) await p.evaluate(([a, b]) => window.__seedDoc(a, b), [path, data]);
  await reload(p);
  ok(/Sample/.test(await text(p, '#v-today')), 'G samples: legacy seeded dishes are shown only as labeled samples');
  await p.click('#v-today .slot[data-slot="0"] [data-act="choose"]'); await W(p, 300);
  ok((await p.$$('.tonight .btn')).length === 2, 'Reduced motion: choose works instantly');
  await shot(p, '13-dark-samples');
});

await b.close(); server.close();
console.log(`\n${failures ? `${failures} FAILED` : 'ALL PASSED'} · screenshots in ${OUT}`);
process.exit(failures ? 1 : 0);
