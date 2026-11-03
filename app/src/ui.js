/* Nouri UI: views, sheets and cook mode. Business rules live in core.js; persistence in store.js. */
(function () {
  'use strict';
  const C = NouriCore, S = NouriStore, ART = NouriArt, D = S.D;
  const LEEK = '__LEEK__';
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ico = (p, s = 20, w = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const I = {
    x: '<path d="M18 6 6 18M6 6l12 12"/>', check: '<path d="m5 12 4 4L19 6"/>', plus: '<path d="M12 5v14M5 12h14"/>', down: '<path d="m6 9 6 6 6-6"/>',
    cam: '<path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/>',
    send: '<path d="M5 12h14M13 6l6 6-6 6"/>', swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>', more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', shuffle: '<path d="M3 7h4c4 0 6 10 10 10h4m0 0-3-3m3 3-3 3M3 17h4c1.8 0 3-1 4-3m3-4c1-2 2.2-3 4-3h3m0 0-3-3m3 3-3 3"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', note: '<path d="M5 4h14v12l-4 4H5z"/><path d="M15 20v-4h4M8 9h8M8 13h5"/>',
    play: '<rect x="3" y="5" width="18" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>', pin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
    pot: '<path d="M4 10h16v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM2 10h20M9 6c0-1 1-1.5 1-3M14 6c0-1 1-1.5 1-3"/>',
  };
  const SRC_ICO = { tiktok: I.play, instagram: I.cam, youtube: I.play, reddit: I.link, pinterest: I.link, maps: I.pin, web: I.link, photo: I.cam, text: I.note, restaurant: I.pin, sample: I.note };
  // Font loads without blocking first paint: the app must be usable instantly even on a slow connection.
  try { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&display=swap'; (document.head || document.documentElement).appendChild(l); } catch {}
  const cap = { sample: null, assets: null, downloads: null, imgs: false };
  const R = { view: 'today', time: 'any', mood: 'any', surprise: 0, openedAt: Date.now(), q: '', filter: 'all', hfilter: 'all', picks: [], reasons: {}, stage: '' };
  const today = () => new Date().toDateString();
  const dishes = () => [...D.dishes.values()];
  const meals = () => [...D.meals.values()];
  const cooks = () => [...D.cooks.values()];
  const activeCook = () => cooks().filter((c) => c.status === 'active').sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)))[0] || null;
  const dismissed = () => (D.st.dismissed && D.st.dismissed.day === today() ? D.st.dismissed.ids : []);
  const name = (d) => C.displayName(d);
  const lastSpark = (d) => (d.sources || []).slice().sort((a, b) => String(b.at).localeCompare(String(a.at)))[0];

  /* ---------- Covers: real photo → sample illustration (labeled) → honest source tile ---------- */
  /** Latest photo you took of this dish (meal or cook step): your own memories become its cover. */
  function memoryPhoto(d) {
    const m = meals().filter((x) => x.dishId === d.id && x.photos && x.photos.length).sort((a, b) => String(b.at).localeCompare(String(a.at)))[0];
    if (m) return m.photos[0];
    const e = cooks().filter((c) => c.dishId === d.id).sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt))).flatMap((c) => c.entries.filter((x) => x.photo)).pop();
    return e ? e.photo : null;
  }
  const photoOf = (x) => (x.photos ? x.photos[0] : C.coverOf(x) || (x.target && x.target.photo) || (x.id && D.dishes.has(x.id) ? memoryPhoto(x) : null));
  const sparkQuote = (x) => { const s = (x.sources || []).filter((y) => y.note).slice(-1)[0]; return s ? s.note : ''; };
  function cover(x, cls = '', opts = {}) {
    if (!x) return `<div class="cover ${cls}"></div>`;
    const ph = photoOf(x);
    if (hasPhoto(ph)) return `<div class="cover ${cls}"><img ${srcAttr(ph)} alt="" loading="lazy" decoding="async"></div>`;
    if (ART.has(x)) return `<div class="cover ${cls} ${opts.steam ? 'steamy' : ''}" style="--t:${ART.tableOf(x)}">${ART.sampleArt(x)}${opts.noMark || opts.mini ? '' : '<span class="sample-mark">Sample</span>'}</div>`;
    const s = (x.sources || [])[0] || { type: x.origin === 'meal' ? 'restaurant' : 'text' };
    const hue = C.hash(x.id || name(x)) % 7;
    const icon = SRC_ICO[s.type] || I.note;
    if (opts.mini) return `<div class="cover tilew hue${hue} ${cls}"><div class="tile mini">${ico(icon, 22, 1.8)}</div></div>`;
    const label = s.host && s.type === 'web' ? s.host : C.SOURCE_LABEL[s.type] || 'Saved';
    const q = opts.noQuote ? '' : sparkQuote(x);
    const body = q ? `<span class="qt">“${esc(q)}”</span>` : !opts.noName ? `<span class="nm">${esc(name(x))}</span>` : `<span class="wm">${ico(icon, 56, 1.4)}</span>`;
    return `<div class="cover tilew hue${hue} ${cls}"><div class="tile"><span class="src">${ico(icon, 15)} ${esc(label)}</span>${body}</div></div>`;
  }
  const knownTime = (d) => (d.minutes ? (d.guessed && d.guessed.minutes ? '~' : '') + C.mins(d.minutes) : '');
  const factLine = (d) => [knownTime(d), d.cuisine].filter(Boolean).join(' · ');

  /* ================= Today ================= */
  function computePicks() {
    const rec = C.recommend({ dishes: dishes(), meals: meals(), week: D.st.week, now: Date.now(), time: R.time, mood: R.mood, dismissed: dismissed(), surprise: R.surprise });
    const t = D.st.tonight && D.dishes.get(D.st.tonight.dishId);
    let list = rec.picks.map((p) => ({ d: p.dish, why: p.reason }));
    if (t) list = [{ d: t, why: 'Your pick for tonight' }, ...list.filter((p) => p.d.id !== t.id)];
    list = list.slice(0, 3);
    R.picks = list.map((p) => p.d.id); R.reasons = Object.fromEntries(list.map((p) => [p.d.id, p.why]));
    return { list, own: rec.ownCount };
  }
  function pickCard(d, i) {
    const hero = i === 0; let why = R.reasons[d.id] || '';
    if (!photoOf(d) && !ART.has(d) && sparkQuote(d)) why = why.replace(/:\s*“.*”$/, '').replace(/\s*for “.*”$/, '').replace(/^“.*”$/, 'Your note');
    return `<div class="slot${hero ? ' hero' : ''}" data-slot="${i}" data-id="${esc(d.id)}"><img class="peek" src="${LEEK}" alt="">
      <article class="pcard" style="--t:${ART.has(d) ? ART.tableOf(d) : 'var(--sunk)'}">
        <button class="open" data-act="dish" data-id="${esc(d.id)}" aria-label="Open ${esc(name(d))}"></button>
        ${cover(d, '', { steam: hero, noName: true })}
        ${hero && factLine(d) ? `<span class="meta-chip">${esc(factLine(d))}</span>` : ''}
        <button class="nope" data-act="nope" aria-label="Not tonight: ${esc(name(d))}">${hero ? `${ico(I.x, 15, 2.4)} Not tonight` : ico(I.x, 16, 2.4)}</button>
        <img class="cheer" src="${LEEK}" alt="">
        <div class="strip"><div class="t"><h3>${esc(name(d))}</h3>${why ? `<p>${esc(why)}</p>` : ''}</div>
        <button class="go" data-act="choose" aria-label="Choose ${esc(name(d))} for tonight">${hero ? '<span class="lb">Choose</span>' : ico(I.check, 18, 2.6)}</button></div>
      </article></div>`;
  }
  function renderToday() {
    const el = $('#v-today'); if (!el) return;
    if (!D.ready) { el.innerHTML = `<header class="hd"><h1>Nouri</h1></header><p class="muted">Loading your food…</p>`; return; }
    const ac = activeCook(), acDish = ac && D.dishes.get(ac.dishId);
    const { list, own } = computePicks();
    const t = D.st.tonight && D.dishes.get(D.st.tonight.dishId);
    const hour = new Date().getHours();
    const q = acDish ? `Still cooking ${name(acDish)}?` : t ? `Tonight: ${name(t)}` : own === 0 ? 'What are you craving?' : hour < 15 ? 'What sounds good later?' : 'What sounds good tonight?';
    let h = `<header class="hd"><img class="leek" src="${LEEK}" alt=""><h1>${esc(q)}</h1></header>`;
    if (ac) h += `<button class="banner" data-act="resume">${cover(acDish || {}, '', { mini: true })}<div class="t"><b>Back to the stove</b><span>${ac.entries.length} ${ac.entries.length === 1 ? 'entry' : 'entries'} · started ${new Date(ac.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></div>${ico(I.send, 20, 2.2)}</button>`;
    if (own === 0) {
      h += captureBox();
      if (list.length) h += `<div class="sec"><h2>Or try the flow with samples</h2></div><p class="small muted" style="margin:-4px 0 0">These aren't yours. Remove them anytime in History → ••• .</p>`;
    } else {
      h += `<div class="chips" role="group" aria-label="Adjust picks">
        ${[['time', 'quick', 'Quick'], ['time', 'project', 'Project'], ['mood', 'comfort', 'Comfort'], ['mood', 'new', 'Something new']].map(([k, v, l]) => `<button class="chip" data-act="cons" data-k="${k}" data-v="${v}" aria-pressed="${R[k] === v}">${l}</button>`).join('')}
        <button class="chip" data-act="surprise">${ico(I.shuffle, 16)} Surprise me</button></div>`;
    }
    if (list.length) {
      const cells = list.map((p, i) => pickCard(p.d, i));
      while (own > 0 && cells.length < 3) cells.push(`<div class="slot" data-slot="${cells.length}"><button class="add-slot" data-act="capture">${ico(I.plus, 22)}Save another craving</button></div>`);
      h += `<div class="picks${t ? ' has-choice' : ''}">${cells.join('')}</div>`;
      if (t) h += `<div class="tonight"><button class="btn pri" data-act="cook" data-id="${esc(t.id)}">${ico(I.pot, 18)} Start cooking</button><button class="btn soft" data-act="log" data-id="${esc(t.id)}">We ate it</button><button class="ibtn" data-act="unchoose" aria-label="Pick something else">${ico(I.swap, 18)}</button></div>`;
    } else if (own > 0) {
      h += `<div class="empty"><h2>Nothing fits that</h2><p>Try a different filter, or bring back what you passed on today.</p><button class="btn line" data-act="undismiss">Show them again</button></div>`;
    }
    // Week + groceries shortcut
    const opts = (D.st.week.options || []).map((o) => D.dishes.get(o.dishId)).filter(Boolean);
    if (opts.length) {
      const g = C.groceries(D.st.week, D.dishes, D.st.groceries);
      const gl = g.need.length ? `${g.need.length} to buy` : g.incomplete.length ? 'Needs ingredient lists' : 'All bought';
      h += `<div class="sec"><h2>This week</h2></div><button class="wk" data-act="go" data-v="week"><span class="stack">${opts.slice(0, 4).map((d) => cover(d, '', { mini: true })).join('')}</span><span class="t"><b>${opts.length} ${opts.length === 1 ? 'dish' : 'dishes'} in play</b><span>Groceries: ${esc(gl)}</span></span>${ico(I.send, 18)}</button>`;
    } else if (own >= 2) {
      h += `<div class="sec"><h2>This week</h2></div><button class="wk" data-act="go" data-v="week"><span class="t"><b>Plan a few meals</b><span>Pick 2–4 from your saves and get one grocery list.</span></span>${ico(I.send, 18)}</button>`;
    }
    // Saved recently (own only, not already shown)
    const recent = dishes().filter((d) => !d.sample && d.origin !== 'meal' && !R.picks.includes(d.id) && d.status !== 'archived').sort((a, b) => String((lastSpark(b) || b).at || b.createdAt).localeCompare(String((lastSpark(a) || a).at || a.createdAt))).slice(0, 3);
    if (recent.length) h += `<div class="sec"><h2>Saved recently</h2><button class="link" data-act="go" data-v="saved">All saves</button></div><div class="rows">${recent.map(savedRow).join('')}</div>`;
    el.innerHTML = h;
    paintChoice();
  }
  function savedRow(d) {
    const s = lastSpark(d);
    return `<button class="row" data-act="dish" data-id="${esc(d.id)}">${cover(d, '', { mini: true })}<span class="t"><h3>${esc(name(d))}</h3><p>${esc([s ? C.SOURCE_LABEL[s.type] : '', C.ago((s && s.at) || d.createdAt)].filter(Boolean).join(' · '))}${s && s.note && d.name ? ` · “${esc(C.quote(s.note, 40))}”` : ''}</p></span></button>`;
  }
  function captureBox() {
    const dr = draft();
    return `<form class="cap-inline" id="cap-inline"><label class="sr" for="cap-inline-text">Paste a link or type what you're craving</label>
      <textarea id="cap-inline-text" placeholder="Paste a TikTok, recipe link, or type a dish" rows="2" enterkeyhint="done">${esc(dr.text || '')}</textarea>
      <div class="row"><button type="button" class="ibtn" data-act="capture" aria-label="Add a photo or a reason">${ico(I.cam, 19)}</button><span style="flex:1"></span><button class="btn pri" id="cap-inline-save" ${dr.text ? '' : 'disabled'}>Save</button></div></form>`;
  }
  function paintChoice() {
    const t = D.st.tonight && D.st.tonight.dishId;
    $$('#v-today .slot[data-id]').forEach((s) => { const on = s.dataset.id === t; s.classList.toggle('chosen', on); const b = $('.go', s); if (b) { b.setAttribute('aria-pressed', on); const lb = $('.lb', b); if (lb) lb.textContent = on ? 'Tonight' : 'Choose'; } });
  }

  /* Motion */
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const anim = (el, k, o) => (!el || RM.matches || !el.animate ? null : el.animate(k, o));
  let busy = false;
  async function swapSlot(i, newId) {
    const slot = $(`#v-today .slot[data-slot="${i}"]`); if (!slot) return;
    const d = newId && D.dishes.get(newId);
    const tmp = document.createElement('div');
    tmp.innerHTML = d ? pickCard(d, i) : `<div class="slot${i === 0 ? ' hero' : ''}" data-slot="${i}"><button class="add-slot" data-act="capture">${ico(I.plus, 22)}Save another craving</button></div>`;
    const fresh = tmp.firstElementChild;
    if (RM.matches || !$('.pcard', slot)) { slot.replaceWith(fresh); paintChoice(); return; }
    $('.pcard', slot).classList.add('out'); slot.classList.add('nudging'); await wait(170);
    slot.replaceWith(fresh); const nc = $('.pcard', fresh);
    if (nc) { fresh.classList.add('nudging'); nc.classList.add('in'); await frame(); nc.classList.remove('in'); await wait(170); fresh.classList.remove('nudging'); }
    paintChoice();
  }
  async function nope(i) {
    if (busy) return; const id = R.picks[i]; if (!id) return; busy = true;
    const ids = [...dismissed(), id];
    const patch = { dismissed: { day: today(), ids } };
    if (D.st.tonight && D.st.tonight.dishId === id) patch.tonight = null;
    S.patch(patch).catch(() => {});
    const before = [...R.picks];
    computePicks();
    const next = R.picks.find((p) => !before.includes(p));
    const order = before.filter((p) => p !== id); order.splice(i, 0, next || null); R.picks = order.filter(Boolean);
    await swapSlot(i, next); busy = false;
    const d = D.dishes.get(id);
    toast(`${name(d)}: not tonight`, () => { S.patch({ dismissed: { day: today(), ids: dismissed().filter((x) => x !== id) } }); renderToday(); });
  }
  function celebrate(slot) {
    if (RM.matches || !slot) return;
    try { navigator.vibrate && navigator.vibrate(10); } catch {}
    anim($('.cheer', slot), [{ transform: 'translateY(170px) rotate(0)', easing: 'cubic-bezier(.34,1.35,.64,1)' }, { transform: 'translateY(-26px) rotate(-10deg)', offset: 0.26, easing: 'ease-in-out' }, { transform: 'translateY(-22px) rotate(9deg)', offset: 0.42, easing: 'ease-in-out' }, { transform: 'translateY(-26px) rotate(-4deg)', offset: 0.56, easing: 'ease-in-out' }, { transform: 'translateY(-24px) rotate(0)', offset: 0.78, easing: 'cubic-bezier(.55,0,.75,.3)' }, { transform: 'translateY(170px) rotate(0)' }], { duration: 1500, easing: 'linear' });
    const b = $('.go', slot).getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
    for (let n = 0; n < 10; n++) {
      const c = document.createElement('span'); c.className = 'confetti' + (n % 3 ? '' : ' s'); c.style.left = x + 'px'; c.style.top = y + 'px'; document.body.appendChild(c);
      const a = -Math.PI / 2 + (n / 9 - 0.5) * 2.6 + (Math.random() - 0.5) * 0.3, dd = 44 + Math.random() * 40;
      const k = c.animate([{ transform: 'translate(0,0) scale(.4)', opacity: 1, easing: 'cubic-bezier(.23,1,.32,1)' }, { transform: `translate(${Math.cos(a) * dd}px,${Math.sin(a) * dd}px) scale(1)`, opacity: 1, offset: 0.45, easing: 'cubic-bezier(.45,0,.75,.4)' }, { transform: `translate(${Math.cos(a) * dd * 1.1}px,${Math.sin(a) * dd * 1.1 + 28}px) scale(.75)`, opacity: 0 }], { duration: 950, easing: 'linear' });
      k.onfinish = () => c.remove();
    }
  }
  function choose(id, slot) {
    const prev = D.st.tonight;
    if (prev && prev.dishId === id) { S.patch({ tonight: null }); renderToday(); return; }
    S.patch({ tonight: { dishId: id, at: C.iso(Date.now()), secondsToChoose: Math.round((Date.now() - R.openedAt) / 1000) } }).catch(() => {});
    if (slot && R.view === 'today') { paintChoice(); celebrate(slot); busy = true; setTimeout(() => { busy = false; if (R.view === 'today') renderToday(); }, RM.matches ? 0 : 1500); }
    else renderToday();
    toast(`${name(D.dishes.get(id))} for tonight`, () => { S.patch({ tonight: prev || null }); renderToday(); });
  }
  // Swipe left on a pick = not tonight
  let drag = null;
  document.addEventListener('pointerdown', (e) => { const c = e.target.closest('#v-today .pcard'); if (!c || e.target.closest('.go,.nope') || busy) return; drag = { c, x: e.clientX, y: e.clientY, t: performance.now(), dx: 0, id: e.pointerId, on: false }; });
  document.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) { if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) { if (Math.abs(dy) > 10) drag = null; return; } drag.on = true; drag.c.classList.add('drag'); try { drag.c.setPointerCapture(e.pointerId); } catch {} }
    drag.dx = dx > 0 ? dx * 0.25 : dx; drag.c.style.transform = `translateX(${drag.dx}px) rotate(${drag.dx / 70}deg)`;
  });
  const endDrag = (e) => { if (!drag || (e && e.pointerId !== drag.id)) return; const d = drag; drag = null; if (!d.on) return; const v = Math.abs(d.dx) / (performance.now() - d.t); d.c.classList.remove('drag'); d.c.style.transform = ''; suppressClick = true; setTimeout(() => (suppressClick = false), 50); if (d.dx < -90 || (d.dx < -30 && v > 0.11)) nope(Number(d.c.closest('.slot').dataset.slot)); };
  let suppressClick = false;
  document.addEventListener('pointerup', endDrag); document.addEventListener('pointercancel', endDrag);

  /* ================= Saved ================= */
  function renderSaved() {
    const el = $('#v-saved'); if (!el) return;
    const all = dishes().filter((d) => d.status !== 'archived');
    const tried = new Set(meals().map((m) => m.dishId));
    const week = new Set((D.st.week.options || []).map((o) => o.dishId));
    const hasSamples = all.some((d) => d.sample);
    let xs = all;
    if (R.filter === 'all') xs = xs.filter((d) => !d.sample && !(d.origin === 'meal' && !d.target));
    if (R.filter === 'new') xs = xs.filter((d) => !d.sample && !tried.has(d.id) && d.origin !== 'meal');
    if (R.filter === 'tried') xs = xs.filter((d) => tried.has(d.id));
    if (R.filter === 'quick') xs = xs.filter((d) => d.minutes && d.minutes <= 35 && !d.sample);
    if (R.filter === 'recreate') xs = xs.filter((d) => d.target);
    if (R.filter === 'samples') xs = xs.filter((d) => d.sample);
    const q = R.q.trim().toLowerCase();
    if (q) xs = all.filter((d) => [d.name, d.cuisine, ...(d.ingredients || []), ...(d.sources || []).map((s) => `${s.note || ''} ${s.host || ''} ${s.place || ''}`)].join(' ').toLowerCase().includes(q));
    xs.sort((a, b) => String((lastSpark(b) || {}).at || b.createdAt).localeCompare(String((lastSpark(a) || {}).at || a.createdAt)));
    const ownCount = all.filter((d) => !d.sample && !(d.origin === 'meal' && !d.target)).length;
    const filters = [['all', 'All'], ['new', 'Not tried'], ['tried', 'Tried'], ['quick', 'Quick']];
    if (all.some((d) => d.target)) filters.push(['recreate', 'Recreating']);
    if (hasSamples) filters.push(['samples', 'Samples']);
    el.innerHTML = `<header class="hd"><h1>Saved</h1><span class="count">${ownCount}</span></header>
      <label class="sr" for="sv-q">Search saves</label><input class="search" id="sv-q" type="search" placeholder="Search dishes, notes, links" value="${esc(R.q)}" enterkeyhint="search" autocomplete="off">
      <div class="chips" role="group" aria-label="Filter">${filters.map(([v, l]) => `<button class="chip" data-act="filter" data-v="${v}" aria-pressed="${!q && R.filter === v}">${l}</button>`).join('')}</div><div style="height:14px"></div>
      ${xs.length ? `<div class="grid2">${xs.map((d) => savedCard(d, tried.has(d.id), week.has(d.id))).join('')}</div>`
        : `<div class="empty"><img class="leek" src="${LEEK}" alt=""><h2>${q ? 'No matches' : R.filter === 'all' ? 'Nothing saved yet' : 'Nothing here yet'}</h2><p>${q ? 'Try a dish, an ingredient, or words from your note.' : 'Paste a link or type a dish. It takes a few seconds.'}</p><button class="btn pri" data-act="capture">${ico(I.plus, 18)} Save a craving</button></div>`}`;
  }
  function savedCard(d, tried, inWeek) {
    const s = lastSpark(d), h = C.historyOf(d.id, meals());
    const meta = h.count ? `Had ${h.count}×${h.lastRated ? ' · ' + C.feelLabel(h.lastRated.rating) : ''}` : [s ? C.SOURCE_LABEL[s.type] : '', C.ago((s && s.at) || d.createdAt)].filter(Boolean).join(' · ');
    return `<button class="card" data-act="dish" data-id="${esc(d.id)}">${cover(d, '', { noName: !!d.name || ART.has(d) })}${inWeek ? '<span class="badge tag green">This week</span>' : d.target ? '<span class="badge tag green">Recreating</span>' : ''}<span class="b" style="display:block"><h3>${esc(name(d))}</h3><p>${esc(meta)}</p>${s && s.note && d.name ? `<p class="q">“${esc(s.note)}”</p>` : ''}</span></button>`;
  }

  /* ================= Week ================= */
  function renderWeek() {
    const el = $('#v-week'); if (!el) return;
    const opts = (D.st.week.options || []).map((o) => D.dishes.get(o.dishId)).filter(Boolean);
    const g = C.groceries(D.st.week, D.dishes, D.st.groceries);
    const nm = (id) => { const d = D.dishes.get(id); return d ? name(d) : ''; };
    const line = (l, state) => `<div class="gi${state === 'bought' || state === 'stray' ? ' done' : ''}"><button class="main" data-act="gtoggle" data-k="${esc(l.key)}" data-n="${esc(l.name)}" aria-pressed="${state === 'bought' || state === 'stray'}"><span class="ck${state === 'bought' || state === 'stray' ? ' on' : ''}">${state === 'bought' || state === 'stray' ? ico(I.check, 16, 3) : ''}</span><span style="min-width:0"><span class="n">${esc(l.name)}${l.qty && l.qty.length ? ` <span class="dim small">${esc(l.qty.join(' + '))}</span>` : ''}</span><span class="from">${esc(l.from.map(nm).join(', ') || (l.extra ? 'Added by you' : 'Not in this week\'s dishes'))}${l.guessed ? ' · est.' : ''}</span></span></button>${state === 'need' ? `<button class="have" data-act="ghave" data-k="${esc(l.key)}">Have it</button>` : state === 'have' ? `<button class="have" data-act="ghave" data-k="${esc(l.key)}">Need it</button>` : ''}</div>`;
    const sugg = opts.length < 4 ? C.recommend({ dishes: dishes(), meals: meals(), week: D.st.week, now: Date.now(), exclude: opts.map((d) => d.id) }, 3).picks.filter((p) => !p.dish.sample || dishes().filter((d) => !d.sample).length < 2) : [];
    el.innerHTML = `<header class="hd"><h1>This week</h1><button class="btn line sm" data-act="picker">${ico(I.plus, 16)} Add</button></header>
      ${opts.length ? `<div class="rows">${opts.map((d) => `<div class="row"><button class="open" data-act="dish" data-id="${esc(d.id)}">${cover(d, '', { mini: true })}<span class="t"><h3>${esc(name(d))}</h3><p>${esc(factLine(d) || (d.ingredients.length ? `${d.ingredients.length} ingredients` : 'No ingredient list yet'))}</p></span></button><button class="ibtn" data-act="swap" data-id="${esc(d.id)}" aria-label="Swap ${esc(name(d))}">${ico(I.swap, 18)}</button><button class="ibtn" data-act="unplan" data-id="${esc(d.id)}" aria-label="Remove ${esc(name(d))} from this week">${ico(I.x, 16)}</button></div>`).join('')}</div>`
        : `<p class="muted" style="margin:0 0 6px">No dates, no commitments. Keep 2–4 dishes you'd be happy to make and shop for all of them.</p>`}
      ${sugg.length ? `<div class="sec"><h2>${opts.length ? 'Add another' : 'Good candidates'}</h2></div><div class="rows">${sugg.map((p) => `<div class="row"><button class="open" data-act="dish" data-id="${esc(p.dish.id)}">${cover(p.dish, '', { mini: true })}<span class="t"><h3>${esc(name(p.dish))}</h3><p>${esc(p.reason || factLine(p.dish))}</p></span></button><button class="btn soft sm" data-act="plan" data-id="${esc(p.dish.id)}">Add</button></div>`).join('')}</div>` : ''}
      <div class="sec"><h2>Groceries</h2><span class="dim small">${g.need.length ? `${g.need.length} to buy` : ''}</span></div>
      ${g.incomplete.map((d) => `<div class="warn-row"><div style="flex:1"><p><b>${esc(name(d))}</b> has no ingredient list, so this list is incomplete.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn line sm" data-act="edit" data-id="${esc(d.id)}" data-focus="ing">Add ingredients</button>${cap.sample && d.name ? `<button class="btn soft sm" data-act="aiing" data-id="${esc(d.id)}">Ask Claude for a list</button>` : ''}</div></div></div>`).join('')}
      ${g.need.length ? `<div class="glist">${g.need.map((l) => line(l, 'need')).join('')}</div>` : opts.length && !g.incomplete.length ? `<p class="muted">Everything on the list is bought or already at home.</p>` : !opts.length ? `<p class="muted">Add dishes above and their ingredients land here, combined.</p>` : ''}
      <form class="addline" id="g-add"><label class="sr" for="g-in">Add an item</label><input id="g-in" placeholder="Add anything else" enterkeyhint="done" autocomplete="off"><button class="ibtn" aria-label="Add item">${ico(I.plus, 18)}</button></form>
      ${g.bought.length ? `<details class="more" style="margin-top:12px"><summary>${ico(I.down, 16)} Bought · ${g.bought.length}</summary><div class="glist">${g.bought.map((l) => line(l, 'bought')).join('')}</div></details>` : ''}
      ${g.have.length ? `<details class="more"><summary>${ico(I.down, 16)} Already have · ${g.have.length}</summary><div class="glist">${g.have.map((l) => line(l, 'have')).join('')}</div></details>` : ''}
      ${g.stray.length ? `<div class="sec"><h2 style="font-size:17px">Bought, not in this week's dishes</h2><button class="link" data-act="gclear">Clear</button></div><div class="glist">${g.stray.map((l) => line(l, 'stray')).join('')}</div>` : ''}`;
  }

  /* ================= History ================= */
  function mealCover(m) {
    if (m.photos && m.photos.length) return m;
    const ck = m.cookId && D.cooks.get(m.cookId);
    const e = ck && ck.entries.slice().reverse().find((x) => x.photo);
    if (e) return { id: m.id, photos: [e.photo] };
    return D.dishes.get(m.dishId) || { id: m.id, name: m.title, origin: 'meal' };
  }
  function renderHistory() {
    const el = $('#v-history'); if (!el) return;
    let ms = meals().sort((a, b) => String(b.at).localeCompare(String(a.at)));
    if (R.hfilter !== 'all') ms = ms.filter((m) => (R.hfilter === 'out' ? m.where === 'restaurant' || m.where === 'other' : m.where === R.hfilter));
    const st = C.monthStats(meals(), dishes());
    const groups = {}; const order = [];
    for (const m of ms) { const a = C.ago(m.at); const key = a === 'today' ? 'Today' : a === 'yesterday' ? 'Yesterday' : /days ago/.test(a) ? 'This week' : new Date(m.at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); if (!groups[key]) { groups[key] = []; order.push(key); } groups[key].push(m); }
    const where = { home: 'Home', restaurant: 'Out', work: 'Work', other: 'Elsewhere' };
    el.innerHTML = `<header class="hd"><h1>History</h1><button class="btn line sm" data-act="log">${ico(I.plus, 16)} Log a meal</button><button class="ibtn" data-act="settings" aria-label="Data, sync and samples">${ico(I.more, 20)}</button></header>
      ${st.meals >= 5 ? `<p class="stats">Last 4 weeks: <b>${st.meals}</b> meals · <b>${st.newDishes}</b> first tries${st.avg ? ` · mostly <b>${esc(C.feelLabel(Math.round(st.avg)).toLowerCase())}</b>` : ''}</p>` : ''}
      ${meals().length ? `<div class="chips" role="group" aria-label="Filter">${[['all', 'All'], ['home', 'Home'], ['out', 'Out'], ['work', 'Work']].map(([v, l]) => `<button class="chip" data-act="hfilter" data-v="${v}" aria-pressed="${R.hfilter === v}">${l}</button>`).join('')}</div>` : ''}
      ${ms.length ? order.map((k) => `<div class="day">${esc(k)}</div><div class="rows">${groups[k].map((m) => { const ck = m.cookId && D.cooks.get(m.cookId); return `<button class="row" data-act="meal" data-id="${esc(m.id)}">${cover(mealCover(m), '', { mini: true })}<span class="t"><h3>${esc(m.title || name(D.dishes.get(m.dishId)))}</h3><p>${esc([m.rating ? C.feelLabel(m.rating) : '', m.place || where[m.where], ck ? `${ck.entries.length} cook notes` : ''].filter(Boolean).join(' · '))}</p></span></button>`; }).join('')}</div>`).join('')
        : `<div class="empty"><img class="leek" src="${LEEK}" alt=""><h2>${meals().length ? 'Nothing here' : 'No meals yet'}</h2><p>Log what you ate at home, at work or out. A photo and how it was is enough.</p><button class="btn pri" data-act="log">${ico(I.plus, 18)} Log a meal</button></div>`}`;
  }

  /* ================= Navigation ================= */
  function go(v) {
    R.view = v;
    $$('.view').forEach((x) => x.classList.toggle('on', x.id === 'v-' + v));
    $$('.nav [data-go]').forEach((b) => (b.dataset.go === v ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
    if (v === 'today') { R.openedAt = Date.now(); renderToday(); intro(); } else render();
    window.scrollTo(0, 0);
    setHash(v);
  }
  /* Direct links for home-screen bookmarks: #today #saved #week #history, and #save opens capture. */
  const ROUTES = ['today', 'saved', 'week', 'history'];
  function setHash(v) { try { if (location.hash !== '#' + v) history.replaceState(null, '', '#' + v); } catch {} }
  function route(given) {
    const h = (typeof given === 'string' ? given : location.hash || '').replace('#', '');
    if (h === 'save') { if (R.view !== 'today') go('today'); setHash('today'); newCapture(); return true; }
    if (ROUTES.includes(h) && h !== R.view) { go(h); return true; }
    return false;
  }
  addEventListener('hashchange', route);
  function render() {
    if (R.view === 'today') { if (!busy) renderToday(); }
    else if (R.view === 'saved') { const f = document.activeElement && document.activeElement.id === 'sv-q'; if (!f) renderSaved(); }
    else if (R.view === 'week') { const f = document.activeElement && document.activeElement.id === 'g-in'; if (!f) renderWeek(); }
    else if (R.view === 'history') renderHistory();
  }
  function intro() { if (RM.matches) return; $$('#v-today .slot').forEach((s, i) => s.animate && s.animate([{ transform: 'translateY(14px)', opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 420, delay: 60 * i, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'backwards' })); }

  /* ================= Toast ================= */
  let tT, tUndo = null;
  function toast(text, undo, leek) {
    const t = $('#toast'); $('span', t).textContent = text; $('#toast-undo').hidden = !undo; $('.lk', t).hidden = !leek; tUndo = undo || null;
    t.classList.add('on'); clearTimeout(tT); tT = setTimeout(() => t.classList.remove('on'), undo ? 5000 : 3200);
  }

  /* ================= Photos ================= */
  function downscale(blob, max, q) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(blob); const img = new Image();
      img.onload = () => { const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)); const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob((b) => (b ? res({ blob: b, data: c.toDataURL('image/jpeg', q) }) : rej(new Error('encode'))), 'image/jpeg', q); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('decode')); }; img.src = url;
    });
  }
  let photoCb = null;
  function pickPhoto(cb) { photoCb = cb; const i = $('#file-photo'); i.value = ''; i.click(); }
  async function readPhoto(file) { const big = await downscale(file, 1600, 0.85); const small = await downscale(file, 420, 0.72); return { blob: big.blob, preview: small.data }; }
  /** On-device photo store (installed app, or anywhere without cloud assets): full-quality blobs in IndexedDB. */
  const PDB = (() => {
    let opening = null;
    const ok = typeof indexedDB !== 'undefined';
    const open = () => opening || (opening = new Promise((res, rej) => { const r = indexedDB.open('nouri-photos', 1); r.onupgradeneeded = () => r.result.createObjectStore('p'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
    const run = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction('p', mode); const req = fn(t.objectStore('p')); t.oncomplete = () => res(req.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }); };
    return { ok, put: (id, blob) => run('readwrite', (st) => st.put(blob, id)), get: (id) => run('readonly', (st) => st.get(id)) };
  })();
  const purl = new Map();
  async function idbUrl(id) { if (purl.has(id)) return purl.get(id); try { const b = await PDB.get(id); if (!b) return ''; const u = URL.createObjectURL(b); purl.set(id, u); return u; } catch { return ''; } }
  /** img src for any photo shape: picked preview, cloud url, inline data, or on-device id (filled in after render). */
  const srcAttr = (p) => (!p ? '' : p.idb && !p.preview ? `data-idb="${esc(p.idb)}"${purl.has(p.idb) ? ` src="${esc(purl.get(p.idb))}"` : ''}` : `src="${esc(p.preview || p.url || p.data || '')}"`);
  const hasPhoto = (p) => !!(p && (p.url || p.data || p.idb || p.preview));
  function hydrate(root = document) { root.querySelectorAll('img[data-idb]:not([src])').forEach(async (img) => { const u = await idbUrl(img.dataset.idb); if (u) img.src = u; }); }
  new MutationObserver(() => hydrate()).observe(document.body, { childList: true, subtree: true });
  /** Durable photo: cloud asset on claude.ai; on-device full quality otherwise; small inline copy as a last resort. */
  async function storePhoto(p) {
    if (!p) return null;
    if (cap.assets) { try { const r = await cap.assets.upload(p.blob, { type: 'image/jpeg' }); return { id: r.id, url: r.url }; } catch {} }
    if (PDB.ok) { try { const id = 'p' + C.uid(); await PDB.put(id, p.blob); return { idb: id }; } catch {} }
    return { data: p.preview };
  }
  const blobToData = (b) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(fr.error); fr.readAsDataURL(b); });
  /** Every photo object inside a record, so backups can carry on-device photos and imports can restore them. */
  async function mapPhotos(kind, x, fn) {
    const y = JSON.parse(JSON.stringify(x));
    const f = async (p) => (p ? (await fn(p)) || p : p);
    if (kind === 'dishes') { y.photo = await f(y.photo); for (const s of y.sources || []) s.photo = await f(s.photo); if (y.target) y.target.photo = await f(y.target.photo); }
    if (kind === 'meals') y.photos = await Promise.all((y.photos || []).map(f));
    if (kind === 'cooks') for (const e of y.entries || []) e.photo = await f(e.photo);
    return y;
  }

  /* ================= Claude assists (optional; the app never depends on them) ================= */
  async function aiEnrich(d, blob) {
    const s = lastSpark(d);
    const p = `A home cook saved a food idea. Fill in only what you can reasonably tell. Dish name: ${d.name || '(unknown)'}. Their note: ${(s && s.note) || '(none)'}. Link host: ${(s && s.host) || '(none)'}.
${blob ? 'A photo is attached. Name the dish only if the photo makes it clear.' : 'You cannot see the link contents; do not guess from the link alone.'}
Reply with only JSON: {"name": string or "" if unsure, "cuisine": string or "", "minutes": number or null (typical total home cook time), "vibe": "comfort" | "explore" | "", "ingredients": string[] (6-12 main ingredients, short names; [] if unsure)}`;
    const opts = { modelTier: 'quick' }; if (blob && cap.imgs) opts.images = [blob];
    return cap.sample.json(p, opts);
  }
  async function enrich(id, blob) {
    const d = D.dishes.get(id); if (!d || !cap.sample) return;
    const missing = !d.cuisine || !d.minutes || !d.ingredients.length || !d.name;
    if (!missing || (!d.name && !blob)) return;
    try {
      const r = await aiEnrich(d, blob);
      const cur = D.dishes.get(id); if (!cur || !r || typeof r !== 'object') return;
      const x = { ...cur, guessed: { ...cur.guessed } };
      if (!x.name && r.name) { x.name = String(r.name).slice(0, 80); x.guessed.name = 'claude'; }
      if (!x.cuisine && r.cuisine) { x.cuisine = String(r.cuisine).slice(0, 40); x.guessed.cuisine = 'claude'; }
      if (!x.minutes && Number(r.minutes)) { x.minutes = Math.round(Number(r.minutes)); x.guessed.minutes = 'claude'; }
      if (!x.vibe && (r.vibe === 'comfort' || r.vibe === 'explore')) x.vibe = r.vibe;
      if (!x.ingredients.length && Array.isArray(r.ingredients) && r.ingredients.length) { x.ingredients = r.ingredients.map(String).slice(0, 14); x.ingredientsFrom = 'claude'; }
      x.enrich = 'done';
      await S.put('dishes', x);
    } catch { const cur = D.dishes.get(id); if (cur) S.put('dishes', { ...cur, enrich: 'failed' }).catch(() => {}); }
  }
  async function aiSteps(d) {
    const p = `Write a clear home recipe for "${d.name}"${d.cuisine ? ` (${d.cuisine})` : ''}${d.ingredients.length ? `. Known ingredients: ${d.ingredients.join(', ')}` : ''}${d.target ? `. Goal: get close to a version eaten at ${d.target.place || 'a restaurant'}: ${d.target.note || ''}` : ''}.
Reply with only JSON: {"amounts": string[] (ingredients with amounts for 2 servings), "steps": [{"t": string (one short instruction), "min": number or null}]}. 5 to 10 steps, plain language. If the dish has parallel parts (stock, sauce, protein), say which part each step is for at the start, e.g. "Stock: …".`;
    return cap.sample.json(p, { modelTier: 'default' });
  }

  /* ================= Sheets ================= */
  let sheet = null;
  function openSheet(kind, data = {}) {
    sheet = { kind, data }; const root = $('#sheets');
    root.innerHTML = `<div class="scrim" data-act="close"></div><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-h"><div class="grab"></div><button class="ibtn x" data-act="close" aria-label="Close">${ico(I.x, 18)}</button><div id="sh-body"></div></section>`;
    drawSheet(true); requestAnimationFrame(() => { $('.scrim', root).classList.add('on'); $('.sheet', root).classList.add('on'); });
  }
  function closeSheet() { const root = $('#sheets'); const sh = $('.sheet', root); if (!sh) return; sh.classList.remove('on'); $('.scrim', root).classList.remove('on'); sheet = null; setTimeout(() => { if (!sheet) root.innerHTML = ''; }, RM.matches ? 120 : 320); }
  function drawSheet(first) {
    if (!sheet) return; const b = $('#sh-body'); if (!b) return; const s = SHEETS[sheet.kind]; b.innerHTML = s.html(sheet.data); s.after && s.after(sheet.data, first);
    if (sheet.data.photoBusy) { const pb = $('.photo-btn', b); if (pb) { pb.disabled = true; pb.innerHTML = '<span class="ph"><span class="spin"></span></span>Preparing photo…'; } $$('.btn.pri.block', b).forEach((x) => (x.disabled = true)); }
  }
  const seg = (k, opts, v) => `<div class="seg" role="group">${opts.map(([val, l]) => `<button type="button" data-seg="${k}" data-v="${val}" aria-pressed="${v === val}">${l}</button>`).join('')}</div>`;
  const feelSeg = (v) => `<div class="feel" role="group" aria-label="How was it">${C.FEEL.map((f) => `<button type="button" data-seg="rating" data-v="${f.n}" aria-pressed="${v === f.n}">${f.label}</button>`).join('')}</div>`;
  const photoBtn = (p, label = 'Add a photo') => `<button type="button" class="photo-btn" data-act="photo"><span class="ph">${p ? `<img ${srcAttr(p)} alt="">` : ico(I.cam, 22)}</span>${p ? 'Change photo' : label}</button>`;
  const draft = () => { try { return JSON.parse(localStorage.getItem('nouri-draft') || '{}'); } catch { return {}; } };
  const setDraft = (v) => { try { localStorage.setItem('nouri-draft', JSON.stringify(v)); } catch {} };

  const lastBackup = () => { let t = null; try { t = localStorage.getItem('nouri-last-backup'); } catch {} return t ? `Last backup ${C.ago(t)}.` : 'No backup yet.'; };
  const SHEETS = {
    capture: {
      html: (d) => { const f = d.f; const pc = C.parseCapture(f.text); return `<h2 id="sh-h">Save a craving</h2>
        <label class="fld"><span class="sr">Link or dish</span><textarea class="ta big" id="cap-text" placeholder="Paste a TikTok, recipe link, or type a dish" rows="3">${esc(f.text)}</textarea></label>
        ${pc.link ? `<p class="detected">${ico(I.check, 16, 2.6)} ${esc(pc.link.type === 'web' ? pc.link.host : C.SOURCE_LABEL[pc.link.type])} link${pc.link.nameGuess ? `: “${esc(pc.link.nameGuess)}”` : ''}</p>` : ''}
        <label class="fld"><span>What got you? <span class="dim">(optional)</span></span><input class="field" id="cap-why" value="${esc(f.why)}" placeholder="e.g. the crispy edges" autocomplete="off" enterkeyhint="done"></label>
        <div class="fld">${photoBtn(f.photo, 'Add a photo or screenshot')}</div>
        <button class="btn pri block" data-act="save-capture" ${f.text.trim() || f.photo ? '' : 'disabled'}>${d.saving ? '<span class="spin"></span> Saving…' : 'Save'}</button>
        <p class="note">Saves right away. Nouri fills in details afterwards when it can.</p>`; },
      after: (d, first) => { if (first) setTimeout(() => { const t = $('#cap-text'); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }, 330); },
    },
    dish: {
      html: (s) => {
        const d = D.dishes.get(s.id); if (!d) return '<h2 id="sh-h">This dish was removed</h2>';
        const h = C.historyOf(d.id, meals()), inWeek = (D.st.week.options || []).some((o) => o.dishId === d.id), isT = D.st.tonight && D.st.tonight.dishId === d.id;
        const dCooks = cooks().filter((c) => c.dishId === d.id && c.status === 'done').sort((a, b) => String(b.finishedAt).localeCompare(String(a.finishedAt)));
        const photos = [...h.meals.flatMap((m) => m.photos || []), ...dCooks.flatMap((c) => c.entries.filter((e) => e.photo).map((e) => e.photo))].slice(0, 8);
        return `<h2 id="sh-h">${esc(name(d))}${d.guessed && d.guessed.name ? ` <span class="guess">· name guessed</span>` : ''}</h2>
          ${cover(d, 'det-cover', { noName: !!d.name || ART.has(d) })}
          <div class="facts">${[knownTime(d), d.cuisine, h.count ? `Had ${h.count}×` : d.sample ? '' : 'Not tried yet', h.lastRated ? C.feelLabel(h.lastRated.rating) : ''].filter(Boolean).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}${d.guessed && (d.guessed.minutes || d.guessed.cuisine) ? '<span class="guess" style="align-self:center">time and cuisine are guesses</span>' : ''}</div>
          ${d.target ? `<div class="box"><h3>Recreating</h3><p class="small muted" style="margin:0">${esc([d.target.place, d.target.at ? new Date(d.target.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '', d.target.rating ? C.feelLabel(d.target.rating) : ''].filter(Boolean).join(' · '))}</p>${d.target.note ? `<p style="margin:6px 0 0">“${esc(d.target.note)}”</p>` : ''}${d.target.photo ? `<div class="thumbs" style="margin-top:8px">${cover({ id: 't', photos: [d.target.photo] })}</div>` : ''}</div>` : ''}
          ${(d.sources || []).filter((x) => x.type !== 'sample').length ? `<div class="sec" style="margin-top:6px"><h2 style="font-size:17px">Why you saved it</h2></div>${d.sources.map((x) => `<div class="spark"><span class="ico">${ico(SRC_ICO[x.type] || I.note, 18)}</span><div class="t"><p class="small dim">${esc(C.SOURCE_LABEL[x.type] || 'Saved')} · ${esc(C.ago(x.at))}${x.place ? ' · ' + esc(x.place) : ''}</p>${x.note ? `<p>“${esc(x.note)}”</p>` : ''}${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${ico(I.ext, 15)} ${esc((x.host || x.url).slice(0, 60))}</a>` : ''}${x.photo ? `<div class="thumbs" style="margin-top:6px">${cover({ id: x.id, photos: [x.photo] })}</div>` : ''}</div></div>`).join('')}` : ''}
          ${photos.length ? `<div class="sec"><h2 style="font-size:17px">Your photos</h2></div><div class="thumbs">${photos.map((p, i) => cover({ id: d.id + i, photos: [p] })).join('')}</div>` : ''}
          ${dCooks[0] && dCooks[0].nextTime ? `<div class="box" style="margin-top:12px"><h3>Next time</h3><p style="margin:0">${esc(dCooks[0].nextTime)}</p><p class="note">From your cook ${esc(C.ago(dCooks[0].finishedAt))}</p></div>` : ''}
          <div class="sec"><h2 style="font-size:17px">Ingredients</h2>${d.ingredients.length ? `<button class="link" data-act="edit" data-id="${esc(d.id)}" data-focus="ing">Edit</button>` : ''}</div>
          ${d.ingredients.length ? `<div class="ings">${d.ingredients.map((i) => `<span>${esc(i)}</span>`).join('')}</div>${d.ingredientsFrom === 'claude' ? '<p class="note">Claude\'s guess. Edit it to match what you use.</p>' : ''}`
            : `<p class="muted" style="margin:0 0 8px">None yet. Add them so this dish shows up correctly in groceries.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn line sm" data-act="edit" data-id="${esc(d.id)}" data-focus="ing">Add ingredients</button>${cap.sample && d.name ? `<button class="btn soft sm" data-act="aiing" data-id="${esc(d.id)}">${s.aiBusy ? '<span class="spin"></span>' : ''} Ask Claude for a list</button>` : ''}</div>`}
          <div class="actions">
            <button class="btn ${isT ? 'soft' : 'pri'} wide" data-act="choose-d" data-id="${esc(d.id)}">${isT ? 'Tonight ✓' : 'Choose for tonight'}</button>
            <button class="btn line" data-act="${inWeek ? 'unplan' : 'plan'}" data-id="${esc(d.id)}">${inWeek ? 'In this week ✓' : 'Add to this week'}</button>
            <button class="btn line" data-act="cook" data-id="${esc(d.id)}">${ico(I.pot, 17)} Cook it</button>
            <button class="btn line" data-act="log" data-id="${esc(d.id)}">Log I ate it</button>
            <button class="btn line" data-act="edit" data-id="${esc(d.id)}">Edit</button>
            <button class="btn line wide" data-act="addspark" data-id="${esc(d.id)}">Add another link or note</button>
            <button class="btn warn wide" data-act="del-ask">${d.sample ? 'Remove sample' : 'Delete'}</button>
          </div>
          ${s.ask ? `<div class="confirm"><span>Delete ${esc(name(d))}? Meals you logged stay in History.</span><button class="btn line sm" data-act="del-no">Keep</button><button class="btn warn sm" data-act="del-yes" data-id="${esc(d.id)}">Delete</button></div>` : ''}`;
      },
    },
    edit: {
      html: (s) => { const d = D.dishes.get(s.id); if (!d) return ''; return `<h2 id="sh-h">Edit</h2>
        <label class="fld"><span>Dish</span><input class="field" id="e-name" value="${esc(d.name)}" autocomplete="off"></label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label class="fld"><span>Cuisine</span><input class="field" id="e-cuisine" value="${esc(d.cuisine)}" autocomplete="off"></label><label class="fld"><span>Minutes</span><input class="field" id="e-min" value="${esc(d.minutes || '')}" type="number" inputmode="numeric" min="1" max="1440"></label></div>
        <label class="fld"><span>Ingredients, one per line or comma separated</span><textarea class="ta" id="e-ing" rows="6" placeholder="rice&#10;garlic&#10;Thai basil">${esc(d.ingredients.join('\n'))}</textarea></label>
        <div class="fld">${photoBtn(s.photo || C.coverOf(d), 'Add a photo')}</div>
        <button class="btn pri block" data-act="save-edit" data-id="${esc(d.id)}">Save</button>`; },
      after: (s, first) => { if (first && s.focus === 'ing') setTimeout(() => { const t = $('#e-ing'); t && t.focus(); }, 330); },
    },
    addspark: {
      html: (s) => `<h2 id="sh-h">Add a link or note</h2><label class="fld"><span class="sr">Link or note</span><textarea class="ta big" id="as-text" placeholder="Paste a link or write what you remember" rows="3">${esc(s.text || '')}</textarea></label><div class="fld">${photoBtn(s.photo)}</div><button class="btn pri block" data-act="save-spark" data-id="${esc(s.id)}">Save</button>`,
      after: (s, first) => { if (first) setTimeout(() => $('#as-text') && $('#as-text').focus(), 330); },
    },
    log: {
      html: (s) => { const f = s.f; const linked = f.dishId && D.dishes.get(f.dishId); return `<h2 id="sh-h">${s.mealId ? 'Edit meal' : linked ? esc(name(linked)) : 'Log a meal'}</h2>
        <div class="fld">${photoBtn(f.photo, 'Add a photo')}</div>
        ${linked ? '' : `<label class="fld"><span>What was it?</span><input class="field" id="l-title" list="l-dishes" value="${esc(f.title)}" placeholder="e.g. Bún chả" autocomplete="off"><datalist id="l-dishes">${dishes().filter((d) => d.name && !d.sample).map((d) => `<option value="${esc(d.name)}">`).join('')}</datalist></label>`}
        <div class="fld"><span>Where</span>${seg('where', [['home', 'Home'], ['restaurant', 'Restaurant'], ['work', 'Work'], ['other', 'Elsewhere']], f.where)}</div>
        ${f.where === 'restaurant' || f.where === 'other' ? `<label class="fld"><span>Place <span class="dim">(optional)</span></span><input class="field" id="l-place" value="${esc(f.place)}" autocomplete="off"></label>` : ''}
        <div class="fld"><span>How was it? <span class="dim">(optional)</span></span>${feelSeg(f.rating)}</div>
        <label class="fld"><span>What stood out? <span class="dim">(optional)</span></span><input class="field" id="l-note" value="${esc(f.note)}" autocomplete="off" enterkeyhint="done"></label>
        ${f.where !== 'home' && !s.mealId ? `<button type="button" class="photo-btn" data-act="toggle-recreate" aria-pressed="${!!f.recreate}" style="border-style:solid"><span class="ph">${f.recreate ? ico(I.check, 20, 2.6) : ico(I.pot, 20)}</span>${f.recreate ? 'Will save it to recreate at home' : 'I want to recreate this at home'}</button><div style="height:14px"></div>` : ''}
        <button class="btn pri block" data-act="save-log" ${f.title || linked ? '' : 'disabled'}>${s.saving ? '<span class="spin"></span> Saving…' : 'Save'}</button>
        ${s.mealId ? `<button class="btn warn block" style="margin-top:8px" data-act="meal-del" data-id="${esc(s.mealId)}">Delete meal</button>` : ''}`; },
    },
    meal: {
      html: (s) => {
        const m = D.meals.get(s.id); if (!m) return '<h2 id="sh-h">Removed</h2>';
        const d = D.dishes.get(m.dishId); const ck = m.cookId && D.cooks.get(m.cookId);
        const where = { home: 'Home', restaurant: 'Restaurant', work: 'Work', other: 'Elsewhere' }[m.where];
        const sp = d && (d.sources || []).filter((x) => x.url || (x.note && x.type !== 'restaurant'));
        const prev = d ? C.historyOf(d.id, meals()).meals.filter((x) => x.id !== m.id) : [];
        return `<h2 id="sh-h">${esc(m.title || name(d))}</h2>
          ${m.photos.length ? `<div class="thumbs" style="margin-bottom:12px">${m.photos.map((p, i) => cover({ id: m.id + i, photos: [p] }, '', {})).join('')}</div>` : ''}
          <div class="facts">${[new Date(m.at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), m.place || where, m.rating ? C.feelLabel(m.rating) : 'Not rated'].map((t) => `<span class="tag">${esc(t)}</span>`).join('')}${ck && ck.closer ? `<span class="tag green">${esc(ck.closer)}</span>` : ''}</div>
          ${m.note ? `<p style="margin:0 0 12px">“${esc(m.note)}”</p>` : ''}
          ${ck ? `<div class="sec" style="margin-top:6px"><h2 style="font-size:17px">The cook</h2><span class="dim small">${ck.entries.length} entries</span></div>${timeline(ck, false)}${ck.nextTime ? `<div class="box"><h3>Next time</h3><p style="margin:0">${esc(ck.nextTime)}</p></div>` : ''}` : ''}
          ${sp && sp.length ? `<div class="sec"><h2 style="font-size:17px">Where it started</h2></div>${sp.map((x) => `<div class="spark"><span class="ico">${ico(SRC_ICO[x.type] || I.note, 18)}</span><div class="t"><p class="small dim">${esc(C.SOURCE_LABEL[x.type])} · saved ${esc(C.ago(x.at))}</p>${x.note ? `<p>“${esc(x.note)}”</p>` : ''}${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${ico(I.ext, 15)} ${esc((x.host || x.url).slice(0, 60))}</a>` : ''}</div></div>`).join('')}` : ''}
          ${prev.length ? `<p class="note">Also had ${prev.length}× before · last ${esc(C.ago(prev[0].at))}${prev[0].rating ? ', ' + esc(C.feelLabel(prev[0].rating).toLowerCase()) : ''}</p>` : ''}
          <div class="actions">
            ${d ? `<button class="btn pri" data-act="cook" data-id="${esc(d.id)}">${ico(I.pot, 17)} ${m.where === 'home' ? 'Cook again' : 'Cook it'}</button>` : ''}
            ${d && m.where !== 'home' ? `<button class="btn soft" data-act="recreate" data-id="${esc(m.id)}">${d.target ? 'Recreating ✓' : 'Recreate at home'}</button>` : d ? `<button class="btn line" data-act="dish" data-id="${esc(d.id)}">Open dish</button>` : ''}
            <button class="btn line" data-act="meal-edit" data-id="${esc(m.id)}">Edit</button>
            ${d && m.where !== 'home' ? `<button class="btn line" data-act="dish" data-id="${esc(d.id)}">Open dish</button>` : ''}
          </div>`;
      },
    },
    picker: {
      html: (s) => { const inW = new Set((D.st.week.options || []).map((o) => o.dishId)); const own = dishes().filter((d) => !d.sample && d.status !== 'archived' && !(d.origin === 'meal' && !d.target)); const list = (own.length ? own : dishes().filter((d) => d.sample)).filter((d) => (s.swap ? d.id !== s.swap && !inW.has(d.id) : true));
        return `<h2 id="sh-h">${s.swap ? `Swap ${esc(name(D.dishes.get(s.swap)))} for` : 'Add to this week'}</h2>${list.length ? `<div class="rows">${list.map((d) => `<div class="row"><span class="open">${cover(d, '', { mini: true })}<span class="t"><h3>${esc(name(d))}</h3><p>${esc(factLine(d) || (d.ingredients.length ? `${d.ingredients.length} ingredients` : 'No ingredient list'))}</p></span></span><button class="btn ${inW.has(d.id) ? 'line' : 'soft'} sm" data-act="${s.swap ? 'swapto' : inW.has(d.id) ? 'unplan' : 'plan'}" data-id="${esc(d.id)}">${s.swap ? 'Swap' : inW.has(d.id) ? 'Added ✓' : 'Add'}</button></div>`).join('')}</div>` : '<p class="muted">Save a few cravings first.</p>'}`; },
    },
    finish: {
      html: (s) => { const ck = D.cooks.get(s.id); const d = ck && D.dishes.get(ck.dishId); if (!ck) return ''; const f = s.f; return `<h2 id="sh-h">How did ${esc(name(d))} turn out?</h2>
        <div class="fld">${photoBtn(f.photo, 'Add the finished dish')}</div>
        <div class="fld"><span>How was it?</span>${feelSeg(f.rating)}</div>
        ${d && d.target ? `<div class="fld"><span>Compared to ${esc(d.target.place || 'the original')}</span>${seg('closer', [['Closer to the original', 'Closer'], ['About the same', 'Same'], ['Further from it', 'Further']], f.closer)}</div>` : ''}
        <label class="fld"><span>Change next time <span class="dim">(optional)</span></span><input class="field" id="f-next" value="${esc(f.next)}" placeholder="e.g. more fish sauce, thinner noodles" autocomplete="off" enterkeyhint="done"></label>
        <button class="btn pri block" data-act="save-finish" data-id="${esc(ck.id)}">${s.saving ? '<span class="spin"></span> Saving…' : 'Save to History'}</button>`; },
    },
    settings: {
      html: (s) => { const samples = dishes().filter((d) => d.sample); const ob = S.outboxCount(); return `<h2 id="sh-h">Your data</h2>
        <div class="box"><h3>${D.kind === 'cloud' ? 'Synced to your Claude account' : 'Saved on this phone'}</h3><p class="small muted" style="margin:0">${D.kind === 'cloud' ? 'Open this page on any device you\'re signed in on.' : `Photos stay at full quality here. Make a backup now and then. ${lastBackup()}`}${ob ? ` ${ob} change${ob > 1 ? 's' : ''} waiting to sync.` : ''}</p>${ob ? '<button class="btn line sm" style="margin-top:10px" data-act="retry">Try syncing now</button>' : ''}</div>
        ${samples.length ? `<div class="box"><h3>Sample dishes</h3><p class="small muted" style="margin:0 0 10px">${samples.length} examples so the app isn't empty. They aren't yours and never count as your history.</p><button class="btn warn sm" data-act="rm-samples">Remove samples</button></div>` : ''}
        <div class="box"><h3>Move data in or out</h3><div style="display:grid;gap:8px;margin-top:8px"><button class="btn line" data-act="import">Import an export file</button><button class="btn line" data-act="export">Export everything</button></div><p class="note">Import accepts files from this app and from the first Nouri (History → Export all).</p></div>
        ${s.msg ? `<p class="note" role="status">${esc(s.msg)}</p>` : ''}`; },
    },
  };

  /* ================= Cook mode ================= */
  const STAGES = ['Prep', 'Stock', 'Sauce', 'Protein', 'Noodles & rice', 'Veg', 'Garnish', 'Plating'];
  let cookId = null, cookTimer = null, pendingEntry = null;
  function timeline(ck, editable) {
    if (!ck.entries.length && !pendingEntry) return `<p class="muted">${editable ? 'Add photos and notes as you go. Each one saves right away.' : 'No notes from this cook.'}</p>`;
    const t0 = new Date(ck.startedAt).getTime();
    const list = [...ck.entries, ...(editable && pendingEntry ? [pendingEntry] : [])];
    return `<ol class="tl">${list.map((e) => { const mn = Math.max(0, Math.round((new Date(e.at) - t0) / 60000)); return `<li class="${e.pending ? 'pending' : ''}"><div class="when">${mn ? `+${mn} min` : 'Start'}${e.component ? ` · ${esc(e.component)}` : ''}${e.pending ? ' · <span class="spin"></span> saving' : ''}${editable && !e.pending ? `<button class="del" data-act="entry-del" data-e="${esc(e.id)}" aria-label="Remove this entry">Remove</button>` : ''}</div>${e.photo ? `<div class="ph"><img ${srcAttr(e.photo)} alt="" loading="lazy"></div>` : ''}${e.note ? `<p>${esc(e.note)}</p>` : ''}</li>`; }).join('')}</ol>`;
  }
  function openCook(id) {
    cookId = id; const el = $('#cook'); renderCook(); el.hidden = false; $('#cookbar').hidden = false;
    requestAnimationFrame(() => el.classList.add('on')); document.body.style.overflow = 'hidden';
    clearInterval(cookTimer); cookTimer = setInterval(() => { const e = $('#cook .elapsed'); const ck = D.cooks.get(cookId); if (e && ck) e.textContent = elapsed(ck); }, 30000);
  }
  function closeCook() { const el = $('#cook'); el.classList.remove('on'); $('#cookbar').hidden = true; document.body.style.overflow = ''; clearInterval(cookTimer); setTimeout(() => { if (!el.classList.contains('on')) el.hidden = true; }, RM.matches ? 120 : 340); cookId = null; render(); }
  const elapsed = (ck) => { const m = Math.round((Date.now() - new Date(ck.startedAt)) / 60000); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} hr ${m % 60} min`; };
  function renderCook() {
    const ck = D.cooks.get(cookId); const body = $('#cook .in'); if (!ck || !body) return;
    const d = D.dishes.get(ck.dishId) || { name: 'Cook', ingredients: [], sources: [] };
    const prev = cooks().filter((c) => c.dishId === ck.dishId && c.status === 'done').sort((a, b) => String(b.finishedAt).localeCompare(String(a.finishedAt)))[0];
    const prevMeal = prev && prev.mealId && D.meals.get(prev.mealId);
    const steps = d.steps || [];
    body.innerHTML = `<div class="top"><button class="ibtn" data-act="cook-close" aria-label="Minimize cook (it stays saved)">${ico(I.down, 20)}</button><h1>${esc(name(d))}</h1><span class="elapsed">${elapsed(ck)}</span><button class="btn pri sm" data-act="finish" data-id="${esc(ck.id)}">Finish</button></div>
      ${prev ? `<div class="box"><h3>Last time · ${esc(C.ago(prev.finishedAt))}${prevMeal && prevMeal.rating ? ' · ' + esc(C.feelLabel(prevMeal.rating)) : ''}</h3>${prev.nextTime ? `<p style="margin:0">Next time: ${esc(prev.nextTime)}</p>` : '<p class="small muted" style="margin:0">No notes for next time.</p>'}${prev.entries.some((e) => e.photo) ? `<div class="thumbs" style="margin-top:8px">${prev.entries.filter((e) => e.photo).slice(0, 6).map((e, i) => cover({ id: prev.id + i, photos: [e.photo] })).join('')}</div>` : ''}</div>` : ''}
      ${d.target ? `<div class="box"><h3>Aiming for ${esc(d.target.place || 'the original')}</h3>${d.target.note ? `<p style="margin:0">“${esc(d.target.note)}”</p>` : ''}${d.target.photo ? `<div class="thumbs" style="margin-top:8px">${cover({ id: 'tg', photos: [d.target.photo] })}</div>` : ''}</div>` : ''}
      <details class="more" style="margin-top:8px"><summary>${ico(I.down, 16)} Recipe${steps.length ? ` · ${steps.length} steps` : ''}</summary>
        ${(d.amounts && d.amounts.length) || d.ingredients.length ? `<div class="ings" style="margin-bottom:10px">${(d.amounts && d.amounts.length ? d.amounts : d.ingredients).map((i) => `<span>${esc(i)}</span>`).join('')}</div>` : ''}
        ${steps.length ? `<ol style="margin:0;padding-left:20px">${steps.map((x) => `<li style="margin-bottom:8px">${esc(x.t)}${x.min ? ` <span class="dim small">· ${x.min} min</span>` : ''}</li>`).join('')}</ol><p class="note">Suggested by Claude. Your notes below are what actually happened.</p>`
          : cap.sample && d.name ? `<button class="btn soft sm" data-act="aisteps" data-id="${esc(d.id)}">${R.stepsBusy ? '<span class="spin"></span> Writing…' : 'Suggest steps'}</button>${R.stepsErr ? `<p class="note">${esc(R.stepsErr)}</p>` : ''}`
          : (d.sources || []).find((x) => x.url) ? `<a href="${esc(d.sources.find((x) => x.url).url)}" target="_blank" rel="noopener">${ico(I.ext, 15)} Open your saved link</a>` : '<p class="muted small">No recipe saved. Cook from memory and keep notes.</p>'}
      </details>
      <div class="sec" style="margin-top:14px"><h2>As you go</h2></div>
      <div class="stage" role="group" aria-label="Tag the next entry">${STAGES.map((st) => `<button class="chip" data-act="stage" data-v="${esc(st)}" aria-pressed="${R.stage === st}">${esc(st)}</button>`).join('')}</div>
      ${timeline(ck, true)}`;
  }
  async function addEntry(note, photoFile) {
    const ck = D.cooks.get(cookId); if (!ck) return;
    const id = C.uid();
    let p = null;
    if (photoFile) { try { p = await readPhoto(photoFile); } catch { toast("Couldn't read that photo"); return; } }
    pendingEntry = { id, at: C.iso(Date.now()), note: note || '', component: R.stage || '', photo: p ? { preview: p.preview } : null, pending: true };
    renderCook(); scrollCookEnd();
    const photo = p ? await storePhoto(p) : null;
    const entry = { id, at: pendingEntry.at, note: pendingEntry.note, component: pendingEntry.component, photo };
    pendingEntry = null;
    const cur = D.cooks.get(cookId) || ck;
    try { await S.put('cooks', { ...cur, entries: [...cur.entries, entry] }); } catch { toast("Saved on this phone. Will sync when it can."); }
    renderCook(); scrollCookEnd();
  }
  const scrollCookEnd = () => { const el = $('#cook'); if (el) el.scrollTo({ top: el.scrollHeight, behavior: RM.matches ? 'auto' : 'smooth' }); };
  async function startCook(dishId) {
    const ac = activeCook();
    if (ac && ac.dishId === dishId) { closeSheet(); openCook(ac.id); return; }
    if (ac) { const cur = D.cooks.get(ac.id); S.put('cooks', { ...cur, status: 'stopped', finishedAt: C.iso(Date.now()) }).catch(() => {}); }
    const ck = { id: C.uid(), dishId, status: 'active', startedAt: C.iso(Date.now()), entries: [] };
    closeSheet();
    S.put('cooks', ck).catch(() => {});
    openCook(ck.id);
  }

  /* ================= Actions ================= */
  const weekHas = (id) => (D.st.week.options || []).some((o) => o.dishId === id);
  function plan(id) { if (weekHas(id)) return; S.patch({ week: { ...D.st.week, options: [...(D.st.week.options || []), { dishId: id, addedAt: C.iso(Date.now()) }] } }); toast(`${name(D.dishes.get(id))} added to this week`); }
  function unplan(id, quiet) { const before = D.st.week; S.patch({ week: { ...before, options: (before.options || []).filter((o) => o.dishId !== id) } }); if (!quiet) toast(`Removed from this week`, () => S.patch({ week: before })); }
  function newCapture(seed) { const dr = draft(); openSheet('capture', { f: { text: seed != null ? seed : dr.text || '', why: dr.why || '', photo: null } }); }

  async function saveCapture(f, fromInline) {
    const { link, words } = C.parseCapture(f.text);
    if (!link && !words && !f.photo) return false;
    const now = C.iso(Date.now());
    let nm = '', note = (f.why || '').trim(); const guessed = {};
    if (link) { if (words && note) nm = words; else if (words) note = words; if (!nm && link.nameGuess) { nm = link.nameGuess; guessed.name = 'link'; } }
    else if (words) { if (words.length <= 60 && words.split(/\s+/).length <= 8) nm = words; else note = note ? `${words} · ${note}` : words; }
    const photo = f.photo ? await storePhoto(f.photo) : null;
    const src = { id: C.uid(), type: link ? link.type : f.photo ? 'photo' : 'text', url: link ? link.url : '', host: link ? link.host : '', note, at: now, photo: photo || null };
    const dup = link && dishes().find((d) => (d.sources || []).some((s) => s.url && s.url === link.url));
    const sameName = !dup && nm && dishes().find((d) => !d.sample && d.name && d.name.toLowerCase() === nm.toLowerCase());
    const base = dup || sameName;
    const isFirst = !dishes().some((d) => !d.sample);
    let dish;
    if (base) dish = { ...base, sources: [...base.sources, src], status: 'want', photo: base.photo || photo || null };
    else dish = { id: C.uid(), v: 2, name: nm, guessed, sources: [src], photo: photo || null, ingredients: [], status: 'want', createdAt: now };
    let ok = true;
    try { await S.put('dishes', dish); } catch { ok = false; }
    setDraft({});
    if (!ok) toast("Couldn't reach your account yet. It's kept on this phone and will sync.");
    else if (base) toast(dup ? 'Already saved. Added this as another reason.' : `Added to your ${name(base)} save`);
    else toast('Saved', null, isFirst);
    enrich(dish.id, f.photo && f.photo.blob);
    return true;
  }

  function findOrMakeDish(title, f, now) {
    const t = title.trim().toLowerCase();
    const hit = dishes().find((d) => !d.sample && d.name && d.name.toLowerCase() === t);
    if (hit) return { dish: hit, created: false };
    const dish = { id: C.uid(), v: 2, name: title.trim(), origin: f.where === 'home' ? undefined : 'meal', guessed: {}, sources: [{ id: C.uid(), type: f.where === 'home' ? 'text' : 'restaurant', note: f.note || '', place: f.place || '', at: now }], ingredients: [], status: 'want', createdAt: now };
    return { dish, created: true };
  }
  async function saveLog(s) {
    const f = s.f, now = C.iso(Date.now());
    let dish = f.dishId && D.dishes.get(f.dishId), created = false;
    if (!dish) { if (!f.title.trim()) return; const r = findOrMakeDish(f.title, f, now); dish = r.dish; created = r.created; }
    const photo = f.photo ? (f.photo.blob ? await storePhoto(f.photo) : f.photo) : null;
    if (f.recreate) dish = { ...dish, origin: dish.origin, target: { mealId: s.mealId || 'pending', place: f.place || '', at: now, note: f.note || '', rating: f.rating || null, photo }, status: 'want' };
    const prevMeal = s.mealId && D.meals.get(s.mealId);
    const meal = { ...(prevMeal || { id: C.uid(), v: 2, at: now, sparkIds: (dish.sources || []).map((x) => x.id) }), dishId: dish.id, title: f.title.trim() || name(dish), where: f.where, place: f.where === 'home' || f.where === 'work' ? '' : f.place || '', rating: f.rating || null, note: f.note || '', photos: photo ? [photo] : prevMeal ? prevMeal.photos : [] };
    if (dish.target && dish.target.mealId === 'pending') dish.target.mealId = meal.id;
    if (created && photo && !dish.photo) dish.photo = photo;
    let ok = true;
    try { if (created || f.recreate) await S.put('dishes', dish); await S.put('meals', meal); } catch { ok = false; }
    if (!s.mealId) {
      const p = {}; if (D.st.tonight && D.st.tonight.dishId === dish.id) p.tonight = null;
      const before = D.st.week; if (weekHas(dish.id)) p.week = { ...before, options: before.options.filter((o) => o.dishId !== dish.id) };
      if (Object.keys(p).length) S.patch(p).catch(() => {});
      closeSheet();
      toast(!ok ? 'Kept on this phone. Will sync.' : p.week ? 'Logged and taken off this week' : f.recreate ? 'Logged. Saved to recreate.' : 'Logged', p.week ? () => S.patch({ week: before }) : null);
    } else { closeSheet(); toast(ok ? 'Saved' : 'Kept on this phone. Will sync.'); }
    render();
  }

  async function doImport(file) {
    const say = (m) => { if (sheet && sheet.kind === 'settings') { sheet.data.msg = m; drawSheet(); } };
    let j; try { j = JSON.parse(await file.text()); } catch { say("That file isn't readable JSON."); return; }
    const st = j.state && j.state.ideas ? j.state : j; const photos = j.photos || {};
    const rawDishes = j.dishes || st.ideas; const rawMeals = j.meals || st.meals || [];
    if (!Array.isArray(rawDishes)) { say("That file isn't a Nouri export."); return; }
    say('Importing…'); let n = 0, m = 0, k = 0;
    const fromData = async (durl) => { try { return await storePhoto(await readPhoto(await (await fetch(durl)).blob())); } catch { return null; } };
    const restore = (kind, x) => mapPhotos(kind, x, async (p) => (p.idb && typeof photos[p.idb] === 'string' ? fromData(photos[p.idb]) : p.idb && !photos[p.idb] ? { data: '' } : null));
    const pic = async (pid) => { const durl = pid && photos[pid]; if (typeof durl !== 'string' || !durl.startsWith('data:image/')) return null; try { const blob = await (await fetch(durl)).blob(); return await storePhoto(await readPhoto(blob)); } catch { return null; } };
    for (const raw of rawDishes) {
      if (!raw || !raw.id || D.dishes.has(raw.id)) continue; if (raw.source === 'starter' || raw.sample) continue;
      let d = C.normalizeDish(raw); if (raw.photoId) { const p = await pic(raw.photoId); if (p) d.photo = p; } d = await restore('dishes', d);
      try { await S.put('dishes', d); n++; say(`Importing… ${n} saves`); } catch { break; }
    }
    for (const raw of rawMeals) {
      if (!raw || !raw.id || D.meals.has(raw.id)) continue;
      let me = C.normalizeMeal(raw); if (raw.photoId) { const p = await pic(raw.photoId); if (p) me.photos = [p]; } me = await restore('meals', me);
      if (me.dishId && !D.dishes.has(me.dishId)) me.dishId = null;
      try { await S.put('meals', me); m++; } catch { break; }
    }
    for (const raw of j.cooks || []) { if (raw && raw.id && !D.cooks.has(raw.id)) { try { await S.put('cooks', await restore('cooks', C.normalizeCook(raw))); k++; } catch { break; } } }
    const plans = (j.state && (j.state.plans || (j.state.week && j.state.week.options && j.state.week.options.map((o) => o.dishId)))) || st.plans || [];
    const keep = plans.filter((id) => D.dishes.has(id) && !weekHas(id));
    if (keep.length) S.patch({ week: { ...D.st.week, options: [...D.st.week.options, ...keep.map((dishId) => ({ dishId, addedAt: C.iso(Date.now()) }))] } }).catch(() => {});
    say(`Imported ${n} saves, ${m} meals${k ? `, ${k} cooks` : ''}.`); render();
  }

  document.addEventListener('click', async (e) => {
    if (suppressClick) { e.preventDefault(); return; }
    const nav = e.target.closest('[data-go]'); if (nav) { closeSheet(); go(nav.dataset.go); return; }
    const sg = e.target.closest('[data-seg]');
    if (sg && sheet) {
      const k = sg.dataset.seg, v = sg.dataset.v; readSheet();
      if (k === 'rating') sheet.data.f.rating = sheet.data.f.rating === Number(v) ? null : Number(v);
      else if (k === 'closer') sheet.data.f.closer = v;
      else if (k === 'where') sheet.data.f.where = v;
      drawSheet(); return;
    }
    const el = e.target.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act, id = el.dataset.id, slot = el.closest('.slot');
    switch (act) {
      case 'close': closeSheet(); break;
      case 'go': go(el.dataset.v); break;
      case 'capture': { const t = $('#cap-inline-text'); newCapture(t ? t.value : undefined); break; }
      case 'cons': { const k = el.dataset.k, v = el.dataset.v; R[k] = R[k] === v ? 'any' : v; renderToday(); intro(); break; }
      case 'surprise': R.surprise = (R.surprise || 0) + 1; R.time = 'any'; R.mood = 'any'; renderToday(); intro(); break;
      case 'nope': nope(Number(slot.dataset.slot)); break;
      case 'undismiss': S.patch({ dismissed: { day: today(), ids: [] } }); renderToday(); break;
      case 'choose': choose(slot.dataset.id, slot); break;
      case 'choose-d': closeSheet(); go('today'); choose(id, null); break;
      case 'unchoose': { const prev = D.st.tonight; S.patch({ tonight: null }); renderToday(); toast('Back to the options', () => { S.patch({ tonight: prev }); renderToday(); }); break; }
      case 'dish': openSheet('dish', { id }); break;
      case 'filter': R.filter = el.dataset.v; R.q = ''; renderSaved(); break;
      case 'hfilter': R.hfilter = el.dataset.v; renderHistory(); break;
      case 'plan': plan(id); if (sheet) drawSheet(); render(); break;
      case 'unplan': unplan(id); if (sheet) drawSheet(); render(); break;
      case 'picker': openSheet('picker', {}); break;
      case 'swap': openSheet('picker', { swap: id }); break;
      case 'swapto': { const before = D.st.week; const opts = before.options.map((o) => (o.dishId === sheet.data.swap ? { dishId: id, addedAt: C.iso(Date.now()) } : o)); S.patch({ week: { ...before, options: opts } }); closeSheet(); render(); toast('Swapped. Groceries updated.', () => { S.patch({ week: before }); render(); }); break; }
      case 'gtoggle': { const k = el.dataset.k, g = D.st.groceries; const bought = { ...g.bought }, names = { ...(g.names || {}) }; if (bought[k]) delete bought[k]; else { bought[k] = Date.now(); names[k] = el.dataset.n; } S.patch({ groceries: { ...g, bought, names } }); renderWeek(); break; }
      case 'ghave': { const k = el.dataset.k, g = D.st.groceries; const have = { ...g.have }; if (have[k]) delete have[k]; else have[k] = true; S.patch({ groceries: { ...g, have } }); renderWeek(); break; }
      case 'gclear': { const g = D.st.groceries; const res = C.groceries(D.st.week, D.dishes, g); const bought = { ...g.bought }; res.stray.forEach((l) => delete bought[l.key]); const extras = (g.extras || []).filter((x) => !res.stray.some((l) => l.key === x.key)); S.patch({ groceries: { ...g, bought, extras } }); renderWeek(); break; }
      case 'edit': openSheet('edit', { id, focus: el.dataset.focus }); break;
      case 'save-edit': {
        const d = D.dishes.get(id); if (!d) break; const v = (s) => ($(s) ? $(s).value : '');
        const ings = v('#e-ing').split(/\n|,/).map((x) => x.trim()).filter(Boolean);
        const x = { ...d, name: v('#e-name').trim(), cuisine: v('#e-cuisine').trim(), minutes: Number(v('#e-min')) || null, guessed: { ...d.guessed } };
        if (x.name !== d.name) delete x.guessed.name; if (x.cuisine !== d.cuisine) delete x.guessed.cuisine; if (x.minutes !== d.minutes) delete x.guessed.minutes;
        if (ings.join('|') !== d.ingredients.join('|')) { x.ingredients = ings; x.ingredientsFrom = ings.length ? 'user' : ''; x.amounts = null; }
        if (sheet.data.photo && sheet.data.photo.blob) x.photo = await storePhoto(sheet.data.photo);
        try { await S.put('dishes', x); toast('Saved'); } catch { toast('Kept on this phone. Will sync.'); }
        openSheet('dish', { id }); render(); break;
      }
      case 'addspark': openSheet('addspark', { id }); break;
      case 'save-spark': {
        const d = D.dishes.get(id); const text = $('#as-text').value; const { link, words } = C.parseCapture(text); const ph = sheet.data.photo; if (!link && !words && !ph) break;
        const photo = ph ? await storePhoto(ph) : null;
        const src = { id: C.uid(), type: link ? link.type : ph ? 'photo' : 'text', url: link ? link.url : '', host: link ? link.host : '', note: words, at: C.iso(Date.now()), photo };
        try { await S.put('dishes', { ...d, sources: [...d.sources, src], photo: d.photo || photo || null }); toast('Added'); } catch { toast('Kept on this phone. Will sync.'); }
        openSheet('dish', { id }); render(); break;
      }
      case 'aiing': {
        const d = D.dishes.get(id); if (!d) break; if (sheet && sheet.kind === 'dish') { sheet.data.aiBusy = true; drawSheet(); } el.disabled = true;
        try { const r = await aiSteps(d); const amounts = Array.isArray(r.amounts) ? r.amounts.map(String).slice(0, 24) : []; const steps = (Array.isArray(r.steps) ? r.steps : []).map((x) => ({ t: String(x.t || '').trim(), min: Number(x.min) || null })).filter((x) => x.t); if (!amounts.length) throw new Error('empty');
          await S.put('dishes', { ...D.dishes.get(id), ingredients: amounts.map((a) => C.splitIngredient(a).name).filter(Boolean), amounts, ingredientsFrom: 'claude', steps: steps.length ? steps : d.steps || null }); toast('Added Claude\'s ingredient list. Edit it to match yours.');
        } catch { toast("Couldn't get a list right now. You can type one in."); }
        if (sheet && sheet.kind === 'dish') { sheet.data.aiBusy = false; drawSheet(); } render(); break;
      }
      case 'del-ask': sheet.data.ask = true; drawSheet(); break;
      case 'del-no': sheet.data.ask = false; drawSheet(); break;
      case 'del-yes': {
        const d = D.dishes.get(id); const before = D.st; closeSheet();
        S.del('dishes', id).catch(() => {}); const p = {}; if (weekHas(id)) p.week = { ...before.week, options: before.week.options.filter((o) => o.dishId !== id) }; if (before.tonight && before.tonight.dishId === id) p.tonight = null; if (Object.keys(p).length) S.patch(p);
        render(); toast('Deleted', () => { S.put('dishes', d); if (Object.keys(p).length) S.patch({ week: before.week, tonight: before.tonight }); render(); }); break;
      }
      case 'cook': startCook(id); break;
      case 'resume': { const ac = activeCook(); if (ac) openCook(ac.id); break; }
      case 'cook-close': closeCook(); break;
      case 'stage': R.stage = R.stage === el.dataset.v ? '' : el.dataset.v; renderCook(); break;
      case 'cam': pickPhoto((file) => addEntry(($('#cook-note').value || '').trim(), file).then(() => { $('#cook-note').value = ''; })); break;
      case 'entry-del': { const ck = D.cooks.get(cookId); if (!ck) break; const ent = ck.entries.find((x) => x.id === el.dataset.e); S.put('cooks', { ...ck, entries: ck.entries.filter((x) => x.id !== el.dataset.e) }).catch(() => {}); renderCook(); toast('Entry removed', () => { const c2 = D.cooks.get(cookId) || ck; S.put('cooks', { ...c2, entries: [...c2.entries, ent].sort((a, b) => String(a.at).localeCompare(String(b.at))) }); renderCook(); }); break; }
      case 'aisteps': {
        const d = D.dishes.get(id); R.stepsBusy = true; R.stepsErr = ''; renderCook();
        try { const r = await aiSteps(d); const steps = (Array.isArray(r.steps) ? r.steps : []).map((x) => ({ t: String(x.t || '').trim(), min: Number(x.min) || null })).filter((x) => x.t).slice(0, 12); if (!steps.length) throw new Error('empty');
          const cur = D.dishes.get(id); const x = { ...cur, steps, amounts: Array.isArray(r.amounts) ? r.amounts.map(String).slice(0, 24) : cur.amounts || null }; if (!cur.ingredients.length && x.amounts) { x.ingredients = x.amounts.map((a) => C.splitIngredient(a).name).filter(Boolean); x.ingredientsFrom = 'claude'; } await S.put('dishes', x);
        } catch { R.stepsErr = "Couldn't get steps right now."; }
        R.stepsBusy = false; renderCook(); break;
      }
      case 'finish': openSheet('finish', { id, f: { rating: null, next: '', closer: '', photo: null } }); break;
      case 'save-finish': {
        const ck = D.cooks.get(id); if (!ck) break; readSheet(); const f = sheet.data.f; sheet.data.saving = true; drawSheet();
        const d = D.dishes.get(ck.dishId); const now = C.iso(Date.now());
        const photo = f.photo ? await storePhoto(f.photo) : null;
        const meal = { id: C.uid(), v: 2, dishId: ck.dishId, title: name(d), where: 'home', place: '', at: now, rating: f.rating || null, note: f.next || '', photos: photo ? [photo] : [], cookId: ck.id, sparkIds: d ? (d.sources || []).map((x) => x.id) : [] };
        const done = { ...ck, status: 'done', finishedAt: now, rating: f.rating || null, nextTime: f.next || '', closer: f.closer || '', mealId: meal.id, entries: photo ? [...ck.entries, { id: C.uid(), at: now, note: 'Finished', component: 'Plating', photo }] : ck.entries };
        let ok = true; try { await S.put('meals', meal); await S.put('cooks', done); } catch { ok = false; }
        const p = {}; if (D.st.tonight && D.st.tonight.dishId === ck.dishId) p.tonight = null; if (weekHas(ck.dishId)) p.week = { ...D.st.week, options: D.st.week.options.filter((o) => o.dishId !== ck.dishId) }; if (Object.keys(p).length) S.patch(p).catch(() => {});
        closeSheet(); closeCook(); go('history'); toast(ok ? 'Saved to History' : 'Kept on this phone. Will sync.', null, ok && f.rating >= 4); break;
      }
      case 'log': openSheet('log', { f: { dishId: id || null, title: '', where: id ? 'home' : 'restaurant', place: '', rating: null, note: '', photo: null, recreate: false } }); break;
      case 'toggle-recreate': readSheet(); sheet.data.f.recreate = !sheet.data.f.recreate; drawSheet(); break;
      case 'save-log': readSheet(); sheet.data.saving = true; drawSheet(); await saveLog(sheet.data); break;
      case 'meal': openSheet('meal', { id }); break;
      case 'meal-edit': { const m = D.meals.get(id); openSheet('log', { mealId: id, f: { dishId: m.dishId, title: m.title, where: m.where, place: m.place, rating: m.rating, note: m.note, photo: m.photos[0] || null, recreate: false } }); break; }
      case 'meal-del': { const m = D.meals.get(id); closeSheet(); S.del('meals', id).catch(() => {}); render(); toast('Meal deleted', () => { S.put('meals', m); render(); }); break; }
      case 'recreate': {
        const m = D.meals.get(id); const d = m && D.dishes.get(m.dishId); if (!d) break;
        if (!d.target) { const x = { ...d, status: 'want', target: { mealId: m.id, place: m.place, at: m.at, note: m.note, rating: m.rating, photo: m.photos[0] || null } }; try { await S.put('dishes', x); toast('Saved to recreate. It can show up in your picks now.'); } catch { toast('Kept on this phone. Will sync.'); } }
        openSheet('dish', { id: d.id }); render(); break;
      }
      case 'photo': {
        const kind = sheet && sheet.kind; readSheet();
        pickPhoto(async (file) => {
          const data = sheet && sheet.data; if (data) { data.photoBusy = true; drawSheet(); }
          try { const p = await readPhoto(file); if (!sheet || sheet.kind !== kind || sheet.data !== data) return; if (data.f) data.f.photo = p; else data.photo = p; }
          catch { toast("Couldn't read that photo"); }
          if (data) data.photoBusy = false; if (sheet && sheet.data === data) drawSheet();
        });
        break;
      }
      case 'save-capture': {
        readSheet(); const f = sheet.data.f; if (!f.text.trim() && !f.photo) break; sheet.data.saving = true; drawSheet();
        const ok = await saveCapture(f); if (ok) { closeSheet(); render(); } break;
      }
      case 'settings': openSheet('settings', {}); break;
      case 'retry': S.retry().then(() => drawSheet()); break;
      case 'rm-samples': { const ss = dishes().filter((d) => d.sample); for (const d of ss) S.del('dishes', d.id).catch(() => {}); const before = D.st.week; const opts = before.options.filter((o) => !ss.some((d) => d.id === o.dishId)); if (opts.length !== before.options.length) S.patch({ week: { ...before, options: opts } }); if (D.st.tonight && ss.some((d) => d.id === D.st.tonight.dishId)) S.patch({ tonight: null }); sheet.data.msg = 'Samples removed.'; drawSheet(); render(); break; }
      case 'import': $('#file-import').click(); break;
      case 'export': {
        sheet.data.msg = 'Preparing backup…'; drawSheet();
        const all = S.exportAll(); const photos = {};
        const grab = async (p) => { if (p.idb && !photos[p.idb]) { const b = await PDB.get(p.idb).catch(() => null); if (b) photos[p.idb] = await blobToData(b); } return null; };
        for (const kind of ['dishes', 'meals', 'cooks']) for (const x of all[kind]) await mapPhotos(kind, x, grab);
        const data = JSON.stringify({ ...all, photos }, null, 2); const fn = `nouri-backup-${new Date().toISOString().slice(0, 10)}.json`;
        const done = (m) => { sheet.data.msg = m; try { localStorage.setItem('nouri-last-backup', C.iso(Date.now())); } catch {} };
        try {
          if (cap.downloads) { await cap.downloads.save({ filename: fn, data }); done('Exported.'); }
          else {
            const file = new File([data], fn, { type: 'application/json' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Nouri backup' }); done('Backup shared. Save it to Files to keep it safe.'); }
            else { const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = fn; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); done('Backup downloaded.'); }
          }
        } catch (err) { sheet.data.msg = (err && (err.name === 'AbortError' || err.code === 'declined')) ? 'Backup cancelled.' : "Couldn't make a backup from here."; }
        drawSheet(); break;
      }
    }
  });
  function readSheet() {
    if (!sheet) return; const f = sheet.data.f; const v = (s) => ($(s) ? $(s).value : null);
    if (sheet.kind === 'capture') { f.text = v('#cap-text') ?? f.text; f.why = v('#cap-why') ?? f.why; setDraft({ text: f.text, why: f.why }); }
    if (sheet.kind === 'log') { if (v('#l-title') !== null) f.title = v('#l-title'); if (v('#l-place') !== null) f.place = v('#l-place'); if (v('#l-note') !== null) f.note = v('#l-note'); }
    if (sheet.kind === 'finish') { if (v('#f-next') !== null) f.next = v('#f-next'); }
  }
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.id === 'sv-q') { R.q = t.value; const pos = t.selectionStart; renderSaved(); const n = $('#sv-q'); n.focus(); try { n.setSelectionRange(pos, pos); } catch {} }
    if (t.id === 'cap-text' || t.id === 'cap-why') { readSheet(); const b = $('[data-act="save-capture"]'); if (b) b.disabled = sheet.data.photoBusy || !(sheet.data.f.text.trim() || sheet.data.f.photo); if (t.id === 'cap-text') { const had = !!$('.detected'); const has = !!C.parseCapture(t.value).link; if (had !== has) { const pos = t.selectionStart; drawSheet(); const n = $('#cap-text'); n.focus(); n.setSelectionRange(pos, pos); } } }
    if (t.id === 'cap-inline-text') { setDraft({ ...draft(), text: t.value }); const b = $('#cap-inline-save'); if (b) b.disabled = !t.value.trim(); }
    if (t.id === 'l-title') { const b = $('[data-act="save-log"]'); if (b) b.disabled = (sheet && sheet.data.photoBusy) || !t.value.trim(); }
  });
  document.addEventListener('submit', async (e) => {
    if (e.target.id === 'g-add') { e.preventDefault(); const v = $('#g-in').value.trim(); if (!v) return; const g = D.st.groceries; S.patch({ groceries: { ...g, extras: [...(g.extras || []), { key: C.ingredientKey(v), name: v }] } }); renderWeek(); const n = $('#g-in'); n && n.focus(); }
    if (e.target.id === 'cap-inline') { e.preventDefault(); const t = $('#cap-inline-text'); const b = $('#cap-inline-save'); if (!t.value.trim()) return; b.disabled = true; b.innerHTML = '<span class="spin"></span>'; await saveCapture({ text: t.value, why: '', photo: null }, true); render(); }
    if (e.target.id === 'cook-form') { e.preventDefault(); const n = $('#cook-note'); const v = n.value.trim(); if (!v) return; n.value = ''; await addEntry(v, null); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (sheet) closeSheet(); else if (cookId) closeCook(); }
    if (e.key === 'Enter' && !e.shiftKey && e.target.id === 'cap-inline-text') { e.preventDefault(); $('#cap-inline').requestSubmit(); }
  });
  $('#toast-undo').addEventListener('click', () => { const u = tUndo; tUndo = null; $('#toast').classList.remove('on'); u && u(); });
  $('#file-photo').addEventListener('change', (e) => { const f = e.target.files[0]; e.target.value = ''; const cb = photoCb; photoCb = null; if (f && cb) cb(f); });
  $('#file-import').addEventListener('change', (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) doImport(f); });

  /* ================= Boot ================= */
  async function boot() {
    const use = window.claude && window.claude.use;
    let runtime = null;
    if (use) {
      try { const [db, user] = await Promise.all([use('db'), use('user')]); const uid = user && (await user.id()); if (db && uid) runtime = { db, userId: uid }; } catch {}
      use('sample').then((s) => { cap.sample = s; if (s) s.limits().then((l) => { cap.imgs = !!(l && l.images); }).catch(() => {}); render(); }).catch(() => {});
      use('assets').then((a) => { cap.assets = a; }).catch(() => {});
      use('downloads').then((d) => { cap.downloads = d; }).catch(() => {});
    }
    S.subscribe(() => { render(); if (cookId && !pendingEntry) { const f = document.activeElement && document.activeElement.id === 'cook-note'; renderCook(); if (f) $('#cook-note').focus(); } if (sheet && (sheet.kind === 'dish' || sheet.kind === 'meal' || sheet.kind === 'settings')) drawSheet(); });
    renderToday();
    if (!runtime) {
      // Installed app / outside claude.ai: ask the phone to keep this data, and cache the app for offline use.
      try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch {}
      if ('serviceWorker' in navigator && document.querySelector('link[rel="manifest"]')) navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    await S.boot(runtime);
    const incoming = location.hash;
    go('today');
    route(incoming);
    const ac = activeCook(); if (ac && sessionStorage.getItem('nouri-cook-open') === ac.id) openCook(ac.id);
  }
  addEventListener('visibilitychange', () => { try { if (cookId) sessionStorage.setItem('nouri-cook-open', cookId); else sessionStorage.removeItem('nouri-cook-open'); } catch {} });
  window.NouriUI = { go, render, state: R };
  boot();
})();
