// Run: node --test app/test
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/core.js');

const DAY = C.DAY;
const NOW = Date.parse('2026-11-03T18:30:00Z');
const dish = (o) => C.normalizeDish({ v: 2, createdAt: new Date(NOW - 5 * DAY).toISOString(), ...o });

test('parseCapture: URL-only TikTok save keeps the exact link and invents no name', () => {
  const { link, words } = C.parseCapture('https://www.tiktok.com/@chef/video/7301?is_from_webapp=1');
  assert.equal(link.type, 'tiktok');
  assert.equal(link.url, 'https://www.tiktok.com/@chef/video/7301?is_from_webapp=1');
  assert.equal(link.nameGuess, '');
  assert.equal(words, '');
});

test('parseCapture: link plus a thought splits cleanly; recipe slugs give a name guess', () => {
  const r = C.parseCapture('the crispy edges!! https://www.seriouseats.com/crispy-smashed-potatoes-recipe');
  assert.equal(r.words, 'the crispy edges!!');
  assert.equal(r.link.type, 'web');
  assert.equal(r.link.nameGuess, 'Crispy smashed potatoes');
  assert.equal(C.parseCapture('youtu.be is not a link').link, null);
});

test('migration: a v1 idea becomes a v2 dish without losing user fields', () => {
  const d = C.normalizeDish({ id: 'a', title: 'Bún chả', url: 'https://www.tiktok.com/@x/video/1', why: 'charred pork', ingredients: ['pork'], source: 'video', createdAt: '2026-10-01T00:00:00Z' });
  assert.equal(d.name, 'Bún chả');
  assert.equal(d.sources[0].url, 'https://www.tiktok.com/@x/video/1');
  assert.equal(d.sources[0].type, 'tiktok');
  assert.equal(d.sources[0].note, 'charred pork');
  assert.equal(d.sample, false);
  assert.deepEqual(d.ingredients, ['pork']);
  const s = C.normalizeDish({ id: 's', title: 'Char siu', source: 'starter' });
  assert.equal(s.sample, true);
  const m = C.normalizeMeal({ id: 'm', title: 'Pho', type: 'out', ideaId: 'a', rating: 5, createdAt: '2026-10-02T00:00:00Z' });
  assert.equal(m.where, 'restaurant');
  assert.equal(m.dishId, 'a');
  assert.equal(m.at, '2026-10-02T00:00:00Z');
});

test('groceries: shared items survive a swap and bought state is kept (bible journey C)', () => {
  const A = dish({ id: 'A', name: 'Gyudon', ingredients: ['rice', '3 cloves garlic', 'beef', 'onion'] });
  const B = dish({ id: 'B', name: 'Kra pao', ingredients: ['Rice', 'garlic', 'Thai basil', 'ground pork'] });
  const Cc = dish({ id: 'C', name: 'Fried rice', ingredients: ['rice', 'eggs', 'scallions'] });
  const dishes = [A, B, Cc];
  const g = { bought: { garlic: 1, rice: 1 }, have: {}, extras: [] };
  let r = C.groceries({ options: [{ dishId: 'A' }, { dishId: 'B' }] }, dishes, g);
  const keys = (ls) => ls.map((l) => l.key).sort();
  assert.deepEqual(keys(r.bought), ['garlic', 'rice']);
  assert.deepEqual(keys(r.need), ['beef', 'ground pork', 'onion', 'thai basil']);
  assert.deepEqual(r.bought.find((l) => l.key === 'rice').from.sort(), ['A', 'B']);
  // Swap A for C
  r = C.groceries({ options: [{ dishId: 'C' }, { dishId: 'B' }] }, dishes, g);
  assert.deepEqual(keys(r.bought), ['garlic', 'rice']);
  assert.deepEqual(keys(r.need), ['egg', 'ground pork', 'scallion', 'thai basil']);
  assert.equal(r.stray.length, 0);
  // Drop B too: garlic was bought but nothing needs it now; it must not vanish
  r = C.groceries({ options: [{ dishId: 'C' }] }, dishes, g);
  assert.deepEqual(r.stray.map((l) => l.key), ['garlic']);
});

test('groceries: a dish without ingredients is reported as incomplete, not silently empty', () => {
  const A = dish({ id: 'A', name: 'Mystery TikTok noodles', ingredients: [] });
  const r = C.groceries({ options: [{ dishId: 'A' }] }, [A], {});
  assert.equal(r.incomplete.length, 1);
  assert.equal(r.need.length, 0);
});

test('ingredientKey normalizes quantities and simple plurals', () => {
  assert.equal(C.ingredientKey('300 g thinly sliced beef'), 'beef');
  assert.equal(C.ingredientKey('2 tbsp fish sauce'), 'fish sauce');
  assert.equal(C.ingredientKey('Scallions (green parts)'), 'scallion');
  assert.equal(C.ingredientKey('½ cup peanuts'), 'peanut');
  assert.equal(C.ingredientKey('glass noodles'), 'glass noodle');
});

test('recommend: samples never outrank the user’s own saves once there are 3+', () => {
  const own = ['a', 'b', 'c'].map((id, i) => dish({ id, name: ['Laksa', 'Tacos al pastor', 'Mapo tofu'][i] }));
  const samples = ['s1', 's2'].map((id) => dish({ id, name: 'Sample ' + id, sample: true }));
  const { picks } = C.recommend({ dishes: [...samples, ...own], meals: [], week: { options: [] }, now: NOW });
  assert.ok(picks.every((p) => !p.dish.sample));
});

test('recommend: reasons only cite stored evidence', () => {
  const d1 = dish({ id: 'n', name: 'Crispy rice salad', createdAt: new Date(NOW - 1 * DAY).toISOString(), sources: [{ id: 'x', type: 'tiktok', url: 'https://tiktok.com/x', note: 'the crunch', at: new Date(NOW - DAY).toISOString() }] });
  const d2 = dish({ id: 'l', name: 'Pho', createdAt: new Date(NOW - 60 * DAY).toISOString() });
  const meals = [C.normalizeMeal({ v: 2, id: 'm', dishId: 'l', at: new Date(NOW - 30 * DAY).toISOString(), rating: 5, where: 'home' })];
  const { picks } = C.recommend({ dishes: [d1, d2], meals, week: { options: [] }, now: NOW });
  const byId = Object.fromEntries(picks.map((p) => [p.dish.id, p.reason]));
  assert.match(byId.n, /Saved yesterday: “the crunch”/);
  assert.match(byId.l, /You loved it/);
});

test('recommend: eaten in the last few days is pushed down; dismissed is excluded', () => {
  const a = dish({ id: 'a', name: 'Gyudon' });
  const b = dish({ id: 'b', name: 'Laksa' });
  const c = dish({ id: 'c', name: 'Tacos' });
  const meals = [C.normalizeMeal({ v: 2, id: 'm', dishId: 'a', at: new Date(NOW - DAY).toISOString(), rating: 5 })];
  const r = C.recommend({ dishes: [a, b, c], meals, week: { options: [] }, now: NOW, dismissed: ['b'] });
  assert.deepEqual(r.picks.map((p) => p.dish.id), ['c', 'a']);
});

test('recommend: quick filter never claims a time it does not know', () => {
  const a = dish({ id: 'a', name: 'Known quick', minutes: 20 });
  const b = dish({ id: 'b', name: 'Known long', minutes: 180 });
  const u = dish({ id: 'u', name: 'Unknown time' });
  const r = C.recommend({ dishes: [a, b, u], meals: [], week: { options: [] }, now: NOW, time: 'quick' });
  assert.equal(r.picks[0].dish.id, 'a');
  assert.equal(r.picks[r.picks.length - 1].dish.id, 'b');
});

test('displayName falls back to the spark, never an invented dish', () => {
  assert.equal(C.displayName(dish({ id: 'x', name: '', sources: [{ type: 'tiktok', url: 'u', note: '' }] })), 'TikTok save');
  assert.equal(C.displayName(dish({ id: 'y', name: '', sources: [{ type: 'text', note: 'that chili crisp egg thing' }] })), 'that chili crisp egg thing');
});
