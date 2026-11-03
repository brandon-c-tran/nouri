/* Nouri store: one persistence boundary for the UI.
   - Cloud: the Artifact `db` capability, per-user paths data/users/<id>/…, live across devices.
   - Local: browser storage when the page runs outside claude.ai.
   - Every write returns a promise that resolves only when the write is durable. Failed writes
     go to an on-device outbox, stay visible in the UI, and retry automatically. */
(function (root) {
  'use strict';
  const C = root.NouriCore;
  const LKEY = 'nouri-v1', OLD_LKEY = 'nouri-v0', OUTBOX = 'nouri-outbox-v1';
  const blankState = () => ({ week: { options: [] }, groceries: { bought: {}, have: {}, extras: [], names: {} }, tonight: null, dismissed: { day: '', ids: [] } });
  const lsGet = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const clean = (o) => JSON.parse(JSON.stringify(o, (k, v) => (v === undefined ? null : v)));

  /** First-version state ({plans, checked, extras, tonight}) → current shape. */
  function migrateState(raw) {
    const s = blankState();
    if (!raw) return s;
    if (raw.week) return { ...s, ...raw, groceries: { ...s.groceries, ...(raw.groceries || {}) }, week: { options: [], ...raw.week }, dismissed: raw.dismissed || s.dismissed };
    s.week.options = (raw.plans || []).map((dishId) => ({ dishId, addedAt: C.iso(Date.now()) }));
    for (const name of raw.checked || []) { const k = C.ingredientKey(name); s.groceries.bought[k] = Date.now(); s.groceries.names[k] = name; }
    s.groceries.extras = (raw.extras || []).map((n) => ({ key: C.ingredientKey(n), name: n }));
    if (raw.tonight && raw.tonight.ideaId) s.tonight = { dishId: raw.tonight.ideaId, at: raw.tonight.at || C.iso(Date.now()) };
    return s;
  }

  const D = { dishes: new Map(), meals: new Map(), cooks: new Map(), st: blankState(), ready: false, kind: 'local', err: null, pending: 0, userId: null };
  const subs = new Set();
  let notifyQueued = false;
  const notify = () => { if (notifyQueued) return; notifyQueued = true; queueMicrotask(() => { notifyQueued = false; subs.forEach((f) => f()); }); };

  const COLS = { dishes: 'ideas/items', meals: 'meals/items', cooks: 'cooks/items' };
  const NORM = { dishes: C.normalizeDish, meals: C.normalizeMeal, cooks: C.normalizeCook };

  /* ---------- Outbox ---------- */
  let outbox = lsGet(OUTBOX) || [];
  const saveOutbox = () => lsSet(OUTBOX, outbox);
  function overlayOutbox() {
    for (const o of outbox) {
      if (o.kind === 'state') { D.st = migrateState(o.data); continue; }
      const map = D[o.kind]; if (!map) continue;
      if (o.op === 'del') map.delete(o.id); else map.set(o.id, NORM[o.kind]({ ...o.data, id: o.id }));
    }
  }

  /* ---------- Adapters ---------- */
  const local = {
    load() {
      let text = null; try { text = localStorage.getItem(LKEY); } catch {}
      let raw = null;
      if (text) { try { raw = JSON.parse(text); } catch { lsSet(LKEY + '-unreadable-' + Date.now(), text); this.readOnly = true; } }
      if (!raw) {
        const old = lsGet(OLD_LKEY); // the first v0 artifact's on-device data
        raw = old ? { dishes: old.ideas || [], meals: old.meals || [], cooks: [], st: old.st || null } : { dishes: [], meals: [], cooks: [], st: null };
      }
      (raw.dishes || []).forEach((x) => D.dishes.set(x.id, C.normalizeDish(x)));
      (raw.meals || []).forEach((x) => D.meals.set(x.id, C.normalizeMeal(x)));
      (raw.cooks || []).forEach((x) => D.cooks.set(x.id, C.normalizeCook(x)));
      D.st = migrateState(raw.st);
      // Only write on load when migrating from the old key; never overwrite unreadable data.
      if (!text && !this.readOnly && (raw.dishes.length || raw.meals.length)) this.persist();
    },
    persist() {
      const ok = lsSet(LKEY, { v: 2, dishes: [...D.dishes.values()], meals: [...D.meals.values()], cooks: [...D.cooks.values()], st: D.st });
      if (!ok) throw Object.assign(new Error('Storage is full'), { code: 'quota' });
    },
    async put() { this.persist(); }, async del() { this.persist(); }, async state() { this.persist(); },
  };
  const cloud = {
    db: null, base: '',
    async init(db, id) {
      this.db = db; this.base = `data/users/${id}`;
      return new Promise((resolve) => {
        let pending = 4; const t = setTimeout(() => { D.err = D.err || 'slow'; resolve(); }, 10000);
        const done = () => { if (--pending === 0) { clearTimeout(t); resolve(); } };
        const firsts = {};
        for (const kind of ['dishes', 'meals', 'cooks']) {
          db.collection(`${this.base}/${COLS[kind]}`).onSnapshot((snap) => {
            const map = D[kind]; map.clear();
            snap.docs.forEach((doc) => map.set(doc.id, NORM[kind]({ ...doc.data(), id: doc.id })));
            overlayOutbox(); notify();
            if (!firsts[kind]) { firsts[kind] = 1; done(); }
          }, (e) => { D.err = (e && e.code) || 'error'; notify(); if (!firsts[kind]) { firsts[kind] = 1; done(); } });
        }
        db.doc(`${this.base}/state`).onSnapshot((s) => {
          D.st = migrateState(s.exists ? s.data() : null); overlayOutbox(); notify();
          if (!firsts.st) { firsts.st = 1; done(); }
        }, (e) => { D.err = (e && e.code) || 'error'; if (!firsts.st) { firsts.st = 1; done(); } });
      });
    },
    put(kind, id, data) { return this.db.doc(`${this.base}/${COLS[kind]}/${id}`).set(clean(data)); },
    del(kind, id) { return this.db.doc(`${this.base}/${COLS[kind]}/${id}`).delete(); },
    state(data) { return this.db.doc(`${this.base}/state`).set(clean(data)); },
  };
  let A = local;

  async function attempt(entry) {
    if (entry.kind === 'state') return A.state(entry.data);
    if (entry.op === 'del') return A.del(entry.kind, entry.id);
    return A.put(entry.kind, entry.id, entry.data);
  }
  let chain = Promise.resolve();
  function enqueue(entry) {
    D.pending++; notify();
    const p = chain.then(() => attempt(entry)).then(
      () => { outbox = outbox.filter((o) => !(o.kind === entry.kind && o.id === entry.id && o.t <= entry.t)); saveOutbox(); D.err = null; },
      (e) => {
        outbox = outbox.filter((o) => !(o.kind === entry.kind && o.id === entry.id)); outbox.push(entry); saveOutbox();
        D.err = (e && e.code) || 'error';
        throw e;
      }
    ).finally(() => { D.pending--; notify(); });
    chain = p.catch(() => {});
    return p;
  }

  /* ---------- Public API ---------- */
  function put(kind, obj) {
    const id = obj.id; const data = { ...obj }; delete data.id;
    data.updatedAt = C.iso(Date.now());
    D[kind].set(id, NORM[kind]({ ...data, id })); notify();
    return enqueue({ kind, id, op: 'put', data, t: Date.now() });
  }
  function del(kind, id) { D[kind].delete(id); notify(); return enqueue({ kind, id, op: 'del', t: Date.now() }); }
  function patch(p) { D.st = { ...D.st, ...p }; notify(); return enqueue({ kind: 'state', id: 'state', data: D.st, t: Date.now() }); }
  async function retry() {
    const items = outbox.slice(); if (!items.length) return;
    for (const e of items) { try { await enqueue({ ...e, t: Date.now() }); } catch { break; } }
  }

  async function boot(runtime) {
    if (runtime && runtime.db && runtime.userId) {
      try { A = cloud; D.kind = 'cloud'; D.userId = runtime.userId; await cloud.init(runtime.db, runtime.userId); }
      catch (e) { A = local; D.kind = 'local'; D.err = 'cloud-unavailable'; local.load(); }
    } else { local.load(); overlayOutbox(); }
    D.ready = true; notify();
    retry();
    setInterval(() => { if (outbox.length) retry(); }, 20000);
    if (typeof addEventListener === 'function') addEventListener('online', retry);
  }

  function exportAll() {
    return { app: 'Nouri', format: 2, exportedAt: C.iso(Date.now()), dishes: [...D.dishes.values()], meals: [...D.meals.values()], cooks: [...D.cooks.values()], state: D.st };
  }

  root.NouriStore = { D, boot, put, del, patch, retry, exportAll, subscribe: (f) => (subs.add(f), () => subs.delete(f)), outboxCount: () => outbox.length, migrateState };
})(typeof globalThis !== 'undefined' ? globalThis : this);
