/* Nouri core: data model, migration, link parsing, recommendations and grocery derivation.
   Pure functions only (no DOM, no storage), so they can be unit-tested with `node --test`. */
(function (root) {
  'use strict';
  const DAY = 864e5;
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const iso = (t) => new Date(t).toISOString();

  /* ---------- Links ---------- */
  const HOSTS = [
    ['tiktok', /(^|\.)tiktok\.com$/], ['instagram', /(^|\.)instagram\.com$/], ['youtube', /(^|\.)(youtube\.com|youtu\.be)$/],
    ['reddit', /(^|\.)reddit\.com$/], ['pinterest', /(^|\.)pinterest\./], ['maps', /(^|\.)(maps\.app\.goo\.gl|goo\.gl|google\.[a-z.]+)$/],
  ];
  const SOURCE_LABEL = { tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube', reddit: 'Reddit', pinterest: 'Pinterest', maps: 'Maps', web: 'Link', photo: 'Photo', text: 'Note', restaurant: 'Ate out', sample: 'Sample' };
  const URL_RE = /https?:\/\/[^\s<>"']+/i;
  function nameFromPath(u, type) {
    if (type !== 'web') return '';
    const segs = u.pathname.split('/').filter(Boolean).reverse();
    for (const s of segs) {
      let t; try { t = decodeURIComponent(s); } catch { t = s; }
      t = t.replace(/\.(html?|php|aspx?)$/i, '').replace(/[-_+]+/g, ' ').replace(/\b\d+\b/g, ' ').replace(/\s+/g, ' ').trim();
      if (t.length < 5 || !/[a-z]{3}/i.test(t) || /^(recipe|recipes|food|cooking|amp|index|post|posts|p|watch|blog)$/i.test(t)) continue;
      t = t.replace(/\brecipes?\b/gi, '').replace(/\s+/g, ' ').trim();
      if (t.length < 4) continue;
      return t.charAt(0).toUpperCase() + t.slice(1);
    }
    return '';
  }
  /** Split a capture string into a link (if any) and the remaining words. */
  function parseCapture(text) {
    const raw = String(text || '').trim();
    const m = raw.match(URL_RE);
    let link = null;
    if (m) {
      try {
        const u = new URL(m[0].replace(/[),.;]+$/, ''));
        const host = u.hostname.replace(/^www\./, '').toLowerCase();
        const type = (HOSTS.find(([, r]) => r.test(host)) || ['web'])[0];
        link = { url: u.href, host, type, nameGuess: nameFromPath(u, type) };
      } catch { link = null; }
    }
    const words = (m ? raw.replace(m[0], ' ') : raw).replace(/\s+/g, ' ').trim();
    return { link, words };
  }

  /* ---------- Model + migration (v1 docs from the first v0 stay readable) ---------- */
  const WHERE = ['home', 'restaurant', 'work', 'other'];
  const FEEL = [{ n: 5, label: 'Loved it' }, { n: 4, label: 'Good' }, { n: 3, label: 'Fine' }, { n: 1, label: 'Not for me' }];
  const feelLabel = (n) => (n >= 5 ? 'Loved it' : n === 4 ? 'Good' : n === 3 || n === 2 ? 'Fine' : n === 1 ? 'Not for me' : '');

  function normalizeDish(raw) {
    if (!raw) return null;
    const d = { ...raw };
    if (d.v !== 2) {
      // v1 idea → v2 dish. Keeps every field the user entered.
      d.name = d.name || d.title || '';
      d.sample = d.source === 'starter';
      const at = d.createdAt || iso(Date.now());
      d.sources = [];
      if (d.url) { const p = parseCapture(d.url).link; d.sources.push({ id: 'src-' + d.id, type: p ? p.type : 'web', url: d.url, host: p ? p.host : '', note: d.why || '', at }); }
      else if (!d.sample) d.sources.push({ id: 'src-' + d.id, type: d.source === 'restaurant' ? 'restaurant' : 'text', note: d.why || '', at });
      d.ingredientsFrom = d.sample ? 'sample' : (d.ingredients && d.ingredients.length ? 'user' : '');
      d.status = 'want';
      delete d.title; delete d.url; delete d.why; delete d.source; delete d.want; delete d.tags; delete d.emoji;
    }
    d.v = 2;
    d.name = d.name || '';
    d.sources = Array.isArray(d.sources) ? d.sources : [];
    d.ingredients = Array.isArray(d.ingredients) ? d.ingredients.map(String).filter(Boolean) : [];
    d.ingredientsFrom = d.ingredientsFrom || (d.ingredients.length ? 'user' : '');
    d.guessed = d.guessed || {};
    d.status = d.status || 'want';
    d.createdAt = d.createdAt || iso(Date.now());
    d.minutes = Number(d.minutes) || null;
    d.cuisine = d.cuisine || '';
    d.vibe = d.vibe || '';
    d.sample = !!d.sample;
    return d;
  }
  function normalizeMeal(raw) {
    if (!raw) return null;
    const m = { ...raw };
    if (m.v !== 2) {
      m.at = m.at || m.createdAt || iso(Date.now());
      m.where = m.type === 'out' || m.type === 'restaurant' ? 'restaurant' : m.type === 'work' ? 'work' : m.type === 'home' ? 'home' : 'other';
      m.dishId = m.dishId || m.ideaId || null;
      m.photos = m.photos || [];
      if (m.photo || m.photoData) m.photos.push({ url: m.photo ? m.photo.url : '', id: m.photo ? m.photo.id : '', data: m.photoData || '' });
      delete m.type; delete m.ideaId; delete m.photo; delete m.photoData; delete m.createdAt;
    }
    m.v = 2;
    m.where = WHERE.includes(m.where) ? m.where : 'other';
    m.photos = Array.isArray(m.photos) ? m.photos : [];
    m.rating = Number(m.rating) || null;
    m.title = m.title || '';
    m.note = m.note || '';
    m.place = m.place || '';
    return m;
  }
  function normalizeCook(raw) {
    if (!raw) return null;
    const c = { status: 'active', entries: [], ...raw };
    c.entries = Array.isArray(c.entries) ? c.entries : [];
    return c;
  }
  const coverOf = (d) => {
    if (!d) return null;
    if (d.photo && (d.photo.url || d.photo.data)) return d.photo;
    if (d.photoData) return { data: d.photoData };
    const s = (d.sources || []).find((x) => x.photo && (x.photo.url || x.photo.data));
    return s ? s.photo : null;
  };
  const displayName = (d) => {
    if (!d) return '';
    if (d.name) return d.name;
    const s = (d.sources || [])[0];
    if (s && s.note) return s.note.length > 48 ? s.note.slice(0, 46) + '…' : s.note;
    if (s && s.type) return `${SOURCE_LABEL[s.type] || 'Link'} save`;
    return 'Untitled';
  };

  /* ---------- Time helpers ---------- */
  function ago(at, now = Date.now()) {
    const d = Math.floor((now - new Date(at)) / DAY);
    if (d <= 0) return 'today';
    if (d === 1) return 'yesterday';
    if (d < 7) return `${d} days ago`;
    if (d < 14) return 'last week';
    if (d < 60) return `${Math.round(d / 7)} weeks ago`;
    return new Date(at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  const mins = (m) => (!m ? '' : m >= 60 ? (m % 60 ? `${Math.floor(m / 60)} hr ${m % 60} min` : `${m / 60} hr`) : `${m} min`);

  /* ---------- History per dish ---------- */
  function historyOf(dishId, meals) {
    const ms = meals.filter((m) => m.dishId === dishId).sort((a, b) => String(b.at).localeCompare(String(a.at)));
    const rated = ms.filter((m) => m.rating);
    return { meals: ms, last: ms[0] || null, count: ms.length, avg: rated.length ? rated.reduce((a, m) => a + m.rating, 0) / rated.length : null, lastRated: rated[0] || null };
  }
  const quote = (s, n = 42) => { s = String(s || '').trim(); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; };

  /* ---------- Recommendations: transparent rules, every reason cites stored data ----------
     ctx: { dishes, meals, week:{options:[{dishId}]}, now, time:'any'|'quick'|'project', mood:'any'|'comfort'|'new', dismissed:[], exclude:[], surprise:number } */
  function scoreDish(d, ctx, own) {
    const now = ctx.now || Date.now();
    const h = historyOf(d.id, ctx.meals);
    const inWeek = (ctx.week && ctx.week.options || []).some((o) => o.dishId === d.id);
    const spark = (d.sources || []).slice().sort((a, b) => String(b.at).localeCompare(String(a.at)))[0];
    const savedAt = spark && spark.at && spark.at > d.createdAt ? spark.at : d.createdAt; // a repeat save counts as fresh interest
    const savedDays = (now - new Date(savedAt)) / DAY;
    const sinceAte = h.last ? (now - new Date(h.last.at)) / DAY : null;
    const reasons = [];
    let s = 0;
    const jitter = ((hash(d.id + Math.floor(now / DAY) + (ctx.surprise || 0)) % 1000) / 1000) * (ctx.surprise ? 6 : 1.2);
    s += jitter;
    if (d.sample) { s -= own >= 3 ? 50 : 1; reasons.push({ w: 0, t: 'Sample idea' }); }
    if (inWeek) { s += 3; reasons.push({ w: 3, t: 'On your list this week' }); }
    if (!d.sample && !h.count) {
      if (savedDays <= 3) { s += 3.2; reasons.push({ w: 3.2, t: spark && spark.note ? `Saved ${ago(savedAt, now)}: “${quote(spark.note)}”` : `Saved ${ago(savedAt, now)}` }); }
      else if (savedDays > 10) { s += 2.4; reasons.push({ w: 2.4, t: spark && spark.note ? `Saved ${ago(savedAt, now)} for “${quote(spark.note, 34)}”` : `Saved ${ago(savedAt, now)}, not tried yet` }); }
      else { s += 1.6; reasons.push({ w: 1.6, t: spark && spark.note ? `“${quote(spark.note)}”` : `Saved ${ago(savedAt, now)}` }); }
    }
    if (h.avg !== null) {
      if (h.avg >= 4.5) { s += 2.6; reasons.push({ w: 2.6, t: `You loved it ${ago(h.lastRated.at, now)}` }); }
      else if (h.avg >= 3.5) { s += 1; reasons.push({ w: 1, t: `Good last time (${ago(h.lastRated.at, now)})` }); }
      else if (h.avg < 2.5) { s -= 4; }
    }
    if (sinceAte !== null) {
      if (sinceAte < 6) s -= 7;
      else if (sinceAte < 20) s -= 1.5;
      else if (h.avg !== null && h.avg >= 4) { s += 1; reasons.push({ w: 1.2, t: `Last had ${ago(h.last.at, now)}` }); }
    }
    // Time only counts when the dish has a time on record; unknown stays neutral and unclaimed.
    if (ctx.time === 'quick') { if (d.minutes) s += d.minutes <= 35 ? 3 : -9; else s -= 1; }
    if (ctx.time === 'project') { if (d.minutes) s += d.minutes >= 60 ? 3 : -6; else s -= 1; }
    if (ctx.mood === 'comfort') { if (h.avg !== null && h.avg >= 4) s += 2.5; else if (d.vibe === 'comfort') s += 1.5; else if (!h.count) s -= 1.5; }
    if (ctx.mood === 'new') { if (!h.count) { s += 3; if (!reasons.length || reasons[0].w < 1) reasons.push({ w: 0.9, t: 'Not tried yet' }); } else s -= 4; }
    reasons.sort((a, b) => b.w - a.w);
    return { dish: d, score: s, reason: reasons[0] ? reasons[0].t : '', inWeek, history: h };
  }
  const familyOf = (d) => {
    const t = (d.name || '').toLowerCase();
    if (/noodle|ramen|pho|phở|udon|soba|pasta|spaghetti|mein|bún|laksa|mì\b/.test(t)) return 'noodle';
    if (/soup|stew|curry|broth|jjigae|hot ?pot|congee/.test(t)) return 'broth';
    if (/rice|don\b|bowl|bibimbap|poke|biryani|risotto/.test(t)) return 'rice';
    return (d.cuisine || 'other').toLowerCase();
  };
  /** Top picks with diversity: avoids three of the same family/cuisine unless nothing else fits. */
  function recommend(ctx, n = 3) {
    const own = ctx.dishes.filter((d) => !d.sample && d.status !== 'archived' && !(d.origin === 'meal' && !d.target)).length;
    const pool = ctx.dishes
      .filter((d) => d.status !== 'archived' && !(d.origin === 'meal' && !d.target) && !(ctx.dismissed || []).includes(d.id) && !(ctx.exclude || []).includes(d.id))
      .map((d) => scoreDish(d, ctx, own))
      .filter((r) => r.score > -30)
      .sort((a, b) => b.score - a.score);
    const out = [];
    const fam = {}, cui = {};
    while (out.length < n && pool.length) {
      let best = -1, bestS = -Infinity;
      pool.forEach((r, i) => {
        const f = familyOf(r.dish), c = (r.dish.cuisine || '').toLowerCase();
        const adj = r.score - (fam[f] || 0) * 2.5 - (c && cui[c] ? 1.5 : 0);
        if (adj > bestS) { bestS = adj; best = i; }
      });
      const r = pool.splice(best, 1)[0];
      out.push(r);
      const f = familyOf(r.dish), c = (r.dish.cuisine || '').toLowerCase();
      fam[f] = (fam[f] || 0) + 1; if (c) cui[c] = 1;
    }
    return { picks: out, ownCount: own };
  }

  /* ---------- Groceries: derived from week options, bought state keyed by ingredient ---------- */
  const UNITS = 'g|kg|mg|ml|l|oz|lb|lbs|cups?|tbsp|tsp|tablespoons?|teaspoons?|cloves?|pieces?|pcs|bunch(?:es)?|cans?|stalks?|slices?|pinch|handful|inch(?:es)?|cm|sprigs?|packs?|packets?|bottles?|heads?|small|medium|large';
  const QTY_RE = new RegExp(`^\\s*(?:about\\s+|~\\s*)?(?:[\\d½¼¾⅓⅔.,/\\-–]+\\s*(?:x\\s*)?)(?:(?:${UNITS})\\b\\.?\\s*)?(?:of\\s+)?`, 'i');
  function splitIngredient(s) {
    let t = String(s || '').trim();
    const q = t.match(QTY_RE);
    let qty = '';
    if (q && q[0].trim()) { qty = q[0].trim(); t = t.slice(q[0].length); }
    t = t.replace(/\([^)]*\)/g, ' ').replace(/,.*$/, '').replace(/\s+/g, ' ').trim();
    return { name: t, qty };
  }
  function ingredientKey(s) {
    let t = splitIngredient(s).name.toLowerCase();
    t = t.replace(/^(fresh|freshly|chopped|minced|sliced|thinly sliced|finely|ground black|dried|large|small)\s+/g, '').trim();
    t = t.split(' ').map((w) => (w.length > 3 && /[^s]s$/.test(w) && !/(ss|us|is)$/.test(w) ? w.replace(/(ies)$/, 'y').replace(/(oes)$/, 'o').replace(/s$/, '') : w)).join(' ');
    return t;
  }
  /**
   * week: { options:[{dishId}] }, dishes: Map|Array, g: { bought:{key:at}, have:{key:true}, extras:[{key,name}] }
   * returns { need, bought, have, stray, incomplete }
   */
  function groceries(week, dishes, g) {
    const byId = dishes instanceof Map ? dishes : new Map(dishes.map((d) => [d.id, d]));
    const st = { bought: {}, have: {}, extras: [], ...(g || {}) };
    const lines = new Map();
    const incomplete = [];
    for (const o of (week && week.options) || []) {
      const d = byId.get(o.dishId); if (!d) continue;
      const list = (d.amounts && d.amounts.length ? d.amounts : d.ingredients) || [];
      if (!list.length) { incomplete.push(d); continue; }
      for (const raw of list) {
        const key = ingredientKey(raw); if (!key) continue;
        const { name, qty } = splitIngredient(raw);
        const line = lines.get(key) || { key, name: name || raw, from: [], qty: [], guessed: false };
        if (!line.from.includes(d.id)) line.from.push(d.id);
        if (qty) line.qty.push(qty);
        if (d.ingredientsFrom === 'claude') line.guessed = true;
        lines.set(key, line);
      }
    }
    for (const e of st.extras || []) {
      const key = e.key || ingredientKey(e.name);
      if (!lines.has(key)) lines.set(key, { key, name: e.name, from: [], qty: [], extra: true });
    }
    const need = [], bought = [], have = [];
    for (const l of lines.values()) {
      if (st.have[l.key]) have.push(l); else if (st.bought[l.key]) bought.push(l); else need.push(l);
    }
    // Bought earlier but no current option needs it: kept, never silently dropped.
    const stray = Object.keys(st.bought).filter((k) => !lines.has(k)).map((k) => ({ key: k, name: (st.names && st.names[k]) || k, from: [], qty: [] }));
    return { need, bought, have, stray, incomplete };
  }

  /* ---------- Simple honest stats (only shown with enough data) ---------- */
  function monthStats(meals, dishes, now = Date.now()) {
    const since = now - 28 * DAY;
    const recent = meals.filter((m) => new Date(m.at) >= since);
    const rated = recent.filter((m) => m.rating);
    const firstTimes = recent.filter((m) => m.dishId && meals.filter((x) => x.dishId === m.dishId && new Date(x.at) < new Date(m.at)).length === 0);
    return { meals: recent.length, rated: rated.length, avg: rated.length ? rated.reduce((a, m) => a + m.rating, 0) / rated.length : null, newDishes: firstTimes.length };
  }

  const NouriCore = { DAY, uid, hash, iso, parseCapture, nameFromPath, SOURCE_LABEL, WHERE, FEEL, feelLabel, normalizeDish, normalizeMeal, normalizeCook, coverOf, displayName, ago, mins, historyOf, scoreDish, recommend, familyOf, splitIngredient, ingredientKey, groceries, monthStats, quote };
  if (typeof module !== 'undefined' && module.exports) module.exports = NouriCore;
  else root.NouriCore = NouriCore;
})(typeof globalThis !== 'undefined' ? globalThis : this);
