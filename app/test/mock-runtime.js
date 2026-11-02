// Test-only stand-in for the claude.ai Artifact runtime: db (persisted in localStorage so reloads are real),
// user, sample (canned answers), assets (blob URLs), downloads. Set window.__failWrites = true to simulate outages.
(() => {
  const KEY = '__mockdb';
  const load = () => { try { return new Map(Object.entries(JSON.parse(localStorage.getItem(KEY) || '{}'))); } catch { return new Map(); } };
  const docs = load(); const persist = () => localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(docs)));
  const subs = []; const notify = () => setTimeout(() => subs.forEach((f) => f()), 5);
  window.__failWrites = !!localStorage.getItem('__failWrites');
  const fail = () => { if (window.__failWrites) { const e = new Error('offline'); e.code = 'unavailable'; throw e; } };
  const snap = (p) => ({ id: p.split('/').pop(), exists: docs.has(p), data: () => (docs.has(p) ? JSON.parse(JSON.stringify(docs.get(p))) : undefined), metadata: {} });
  const db = {
    doc: (p) => ({
      get: async () => snap(p),
      set: async (d) => { await new Promise((r) => setTimeout(r, 15)); fail(); docs.set(p, JSON.parse(JSON.stringify(d))); persist(); notify(); },
      update: async (d) => { fail(); docs.set(p, { ...(docs.get(p) || {}), ...d }); persist(); notify(); },
      delete: async () => { fail(); docs.delete(p); persist(); notify(); },
      onSnapshot: (next) => { const f = () => next(snap(p)); subs.push(f); setTimeout(f, 20); return () => {}; },
    }),
    collection: (path) => ({
      onSnapshot: (next) => { const f = () => { const ds = [...docs.keys()].filter((k) => k.startsWith(path + '/') && k.split('/').length === path.split('/').length + 1).map(snap); next({ docs: ds, size: ds.length, empty: !ds.length, docChanges: () => [], metadata: {} }); }; subs.push(f); setTimeout(f, 30); return () => {}; },
    }),
  };
  window.__seedDoc = (path, data) => { docs.set(path, data); persist(); };
  window.__docs = () => Object.fromEntries(docs);
  const sample = async () => ({ text: '' });
  sample.limits = async () => ({ maxPromptBytes: 1e6, images: { maxCount: 4 } });
  sample.json = async (p) => {
    await new Promise((r) => setTimeout(r, 120));
    if (p.includes('Fill in only what you can')) {
      const m = p.match(/Dish name: (.*?)\. Their note/); const nm = m ? m[1] : '';
      if (/kra pao/i.test(nm)) return { name: '', cuisine: 'Thai', minutes: 25, vibe: 'explore', ingredients: ['ground pork', 'Thai basil', 'garlic', 'fish sauce', 'rice', 'egg'] };
      if (nm === '(unknown)') return { name: 'Spicy wontons', cuisine: 'Sichuan', minutes: 40, vibe: 'comfort', ingredients: ['wonton wrappers', 'pork', 'chili oil'] };
      return { name: '', cuisine: '', minutes: null, vibe: '', ingredients: [] };
    }
    if (p.includes('home recipe')) return { amounts: ['300 g pork belly', '2 cloves garlic', '200 g rice noodles'], steps: [{ t: 'Marinate the pork.', min: 20 }, { t: 'Grill until charred.', min: 8 }, { t: 'Serve with noodles and herbs.', min: null }] };
    return {};
  };
  const api = { db, user: { id: async () => 'u_test' }, sample, assets: { upload: async (b) => { fail(); const url = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }); return { id: 'a' + Math.random().toString(36).slice(2), url, sizeBytes: b.size, contentType: 'image/jpeg' }; } }, downloads: { save: async () => ({ status: 'saved' }) } };
  window.claude = { use: async (n) => api[n] || null };
})();
