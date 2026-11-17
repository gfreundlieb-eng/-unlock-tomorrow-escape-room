// =====================================================================
//  RÄTSEL-OBERFLÄCHE
// =====================================================================

function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) { if (c == null || c === false) continue; e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); }
  return e;
}

function shuffled(arr, seed) { const a = arr.slice(); const r = rng(seed); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function strSeed(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

// Definition eines Rätsels für die aktuelle Stufe zusammenführen
function puzzleDef(id, level) {
  const base = PUZZLES[id];
  const lv = base[level] || {};
  const d = Object.assign({}, base, lv);
  delete d.entdecker; delete d.experten;
  d.id = id;
  return d;
}

// Platzierungs-Rätsel normalisieren
function normPlace(d) {
  let slots = [], solution = {};
  if (d.layout === 'sequence') {
    slots = d.order.map((_, i) => ({ id: 's' + i, label: String(i + 1), cap: 1 }));
    d.order.forEach((itemId, i) => { solution[itemId] = 's' + i; });
  } else if (d.layout === 'bins') {
    slots = d.slots.map(s => Object.assign({ cap: 99 }, s));
    d.items.forEach(it => { if (it.to) solution[it.id] = it.to; });
  } else if (d.layout === 'grid') {
    d.rows.forEach(r => d.cols.forEach(c => slots.push({ id: r.id + '_' + c.id, cap: 1, row: r.id, col: c.id })));
    d.items.forEach(it => { if (it.to) solution[it.id] = it.to; });
  } else if (d.layout === 'pairs') {
    slots = d.slots.map(s => Object.assign({ cap: 1 }, s));
    d.items.forEach(it => { if (it.to) solution[it.id] = it.to; });
  } else if (d.layout === 'cloze') {
    const re = /\[\[(\w+)\]\]/g; let m;
    while ((m = re.exec(d.text))) slots.push({ id: m[1], cap: 1 });
    d.items.forEach(it => { if (it.to) solution[it.id] = it.to; });
  }
  return { slots, solution };
}

const Puzzles = (() => {
  const work = {}; // Zwischenstand je Rätsel (im Speicher)
  let cur = null; // { id, def, norm, w }
  let api = null; // Callbacks von main

  function init(a) { api = a; }

  const $ = s => document.querySelector(s);

  function open(id) {
    killDrag();
    const level = api.level();
    const def = puzzleDef(id, level);
    const key = id + ':' + level;
    if (!work[key]) work[key] = { place: {}, sel: null, marks: null, answers: {}, wheels: null, fails: 0, found: {} };
    const w = work[key];
    cur = { id, def, w, norm: def.type === 'place' ? normPlace(def) : null };
    const panel = $('#panel');
    panel.classList.remove('hidden', 'success');
    $('#p-kind').textContent = def.kind || '';
    $('#p-title').textContent = def.title;
    $('#p-check').hidden = def.type === 'search';
    $('#p-check').textContent = def.type === 'code' ? 'Öffnen' : 'Prüfen';
    $('#p-next').hidden = true;
    $('#p-tip').hidden = false;
    setFeedback('');
    renderHints();
    render();
    $('#p-body').scrollTop = 0;
    api.onPanel(true);
  }
  function showSolved(id) { open(id); solved(); }

  function close() {
    killDrag();
    const panel = $('#panel');
    if (panel.classList.contains('hidden')) return;
    panel.classList.add('hidden');
    const wasSolved = cur && cur.justSolved;
    const id = cur && cur.id;
    cur = null;
    api.onPanel(false);
    if (wasSolved) api.afterSolved(id);
  }

  function setFeedback(msg, type) {
    const f = $('#p-feedback'); f.innerHTML = msg || ''; f.dataset.type = type || '';
  }

  // --------------------------------------------------- Rendering
  function render() {
    killDrag();
    const body = $('#p-body'); body.innerHTML = '';
    const d = cur.def;
    if (d.intro) body.appendChild(el('div', { class: 'intro', html: d.intro }));
    if (d.clock) body.appendChild(el('div', { class: 'clockwrap', html: clockSVG() }));
    if (d.type === 'place') renderPlace(body);
    else if (d.type === 'choice') renderChoice(body);
    else if (d.type === 'code') renderCode(body);
    else if (d.type === 'scratch') renderScratch(body);
    else if (d.type === 'search') renderSearch(body);
  }

  // ---------- Platzieren (Zuordnen / Reihenfolge / Tabelle / Lückentext)
  function renderPlace(body) {
    const d = cur.def, w = cur.w, n = cur.norm;
    const items = w.order || (w.order = shuffled(d.items.map(i => i.id), strSeed(d.id + api.level())));
    const byId = Object.fromEntries(d.items.map(i => [i.id, i]));
    const inZone = z => items.filter(i => (w.place[i] || null) === z);
    body.appendChild(el('p', { class: 'howto' }, 'Karte antippen und dann das Ziel antippen – oder die Karte mit dem Finger ziehen.'));

    const card = id => {
      const it = byId[id];
      const mark = w.marks && w.marks[id];
      return el('button', { class: 'card' + (w.sel === id ? ' sel' : '') + (mark ? ' ' + mark : ''), 'data-item': id, type: 'button' },
        it.icon ? el('img', { src: findURL(it.icon), alt: '', class: 'ic' }) : null,
        el('span', { class: 'ct' }, el('span', { class: 't' }, it.text), it.sub ? el('span', { class: 's' }, it.sub) : null));
    };
    const zone = (zid, cls, kids, label) => el('div', { class: 'zone ' + (cls || '') + (w.sel ? ' armed' : ''), 'data-zone': zid, 'aria-label': label || '' }, kids);

    const pool = el('div', { class: 'pool', 'data-zone': 'pool' }, inZone(null).map(card));
    if (!inZone(null).length) pool.appendChild(el('span', { class: 'pool-empty' }, 'Alle Karten liegen. Jetzt „Prüfen“ antippen!'));
    const wrap = el('div', { class: 'place place-' + d.layout });

    if (d.layout === 'sequence') {
      const list = el('div', { class: 'seq' },
        el('div', { class: 'seq-end' }, '▲ ' + d.ends[0]),
        n.slots.map((s, i) => el('div', { class: 'seq-row' }, el('span', { class: 'num' }, String(i + 1)), zone(s.id, 'one', inZone(s.id).map(card), 'Platz ' + (i + 1)))),
        el('div', { class: 'seq-end' }, '▼ ' + d.ends[1]));
      if (d.showProfile) wrap.appendChild(el('div', { class: 'profile-img' }, el('img', { src: profileURL(api.level()), alt: 'Grabungswand mit Funden' })));
      wrap.appendChild(el('div', { class: 'pool-wrap' }, el('h4', {}, 'Karten'), pool));
      wrap.appendChild(list);
    } else if (d.layout === 'bins') {
      wrap.appendChild(el('div', { class: 'pool-wrap' }, pool));
      wrap.appendChild(el('div', { class: 'bins', style: `--n:${n.slots.length}` }, n.slots.map(s =>
        el('div', { class: 'bin' }, el('div', { class: 'bin-h' }, el('b', {}, s.label), s.sub ? el('span', {}, s.sub) : null), zone(s.id, 'many', inZone(s.id).map(card), s.label)))));
    } else if (d.layout === 'grid') {
      wrap.appendChild(el('div', { class: 'pool-wrap' }, pool));
      const tbl = el('div', { class: 'grid', style: `--c:${d.cols.length}` },
        el('div', { class: 'gh' }), d.cols.map(c => el('div', { class: 'gh' }, c.label)),
        d.rows.map(r => [el('div', { class: 'gr' }, r.label), d.cols.map(c => zone(r.id + '_' + c.id, 'one', inZone(r.id + '_' + c.id).map(card), r.label + ' – ' + c.label))]));
      wrap.appendChild(tbl);
    } else if (d.layout === 'pairs') {
      wrap.appendChild(el('div', { class: 'pool-wrap' }, pool));
      wrap.appendChild(el('div', { class: 'pairs' }, n.slots.map(s => el('div', { class: 'pair' },
        el('div', { class: 'pair-l' }, s.icon ? el('img', { src: findURL(s.icon), alt: '' }) : null, el('b', {}, s.label)),
        el('span', { class: 'arrow' }, '→'), zone(s.id, 'one', inZone(s.id).map(card), s.label)))));
    } else if (d.layout === 'cloze') {
      wrap.appendChild(el('div', { class: 'pool-wrap' }, el('h4', {}, 'Wörter'), pool));
      const p = el('p', { class: 'cloze' });
      d.text.split(/(\[\[\w+\]\])/).forEach(part => {
        const m = part.match(/^\[\[(\w+)\]\]$/);
        if (m) p.appendChild(zone(m[1], 'gap', inZone(m[1]).map(card), 'Lücke'));
        else p.appendChild(document.createTextNode(part));
      });
      wrap.appendChild(el('div', { class: 'tablet' }, p));
    }
    body.appendChild(wrap);
    bindDnD(body);
  }

  let drag = null;
  // Räumt jede Spur eines Ziehvorgangs weg: schwebende Kopie, halbtransparente
  // Karte, Hervorhebungen. Wird bei jedem Ende, Abbruch, Neuzeichnen, Öffnen und
  // Schließen aufgerufen – so kann keine Kopie hängen bleiben.
  function killDrag() {
    if (drag && drag.el) { try { drag.el.releasePointerCapture(drag.pid); } catch (_) {} }
    drag = null;
    document.querySelectorAll('.card.ghost').forEach(g => g.remove());
    document.querySelectorAll('.card.dragging').forEach(c => c.classList.remove('dragging'));
    document.querySelectorAll('.zone.hover, .pool.hover').forEach(z => z.classList.remove('hover'));
  }
  function bindDnD(body) {
    body.querySelectorAll('.card').forEach(c => {
      c.addEventListener('pointerdown', e => {
        if (e.button > 0) return;
        e.preventDefault();
        if (drag) return; // immer nur eine Karte gleichzeitig (zweiter Finger wird ignoriert)
        drag = { id: c.dataset.item, x0: e.clientX, y0: e.clientY, el: c, dragging: false, pid: e.pointerId };
        try { c.setPointerCapture(e.pointerId); } catch (_) {}
      });
      // Verliert die Karte den Finger unerwartet (z. B. weil sie neu gezeichnet wurde), Ziehen abbrechen
      c.addEventListener('lostpointercapture', e => { if (drag && drag.pid === e.pointerId && drag.el === c) killDrag(); });
    });
    body.querySelectorAll('[data-zone]').forEach(z => {
      z.addEventListener('click', e => {
        if (e.target.closest('.card')) return;
        if (cur && cur.w.sel) place(cur.w.sel, z.dataset.zone);
      });
    });
  }
  window.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.pid) return;
    // Maus: Taste schon losgelassen, aber kein pointerup angekommen → aufräumen
    if (e.pointerType === 'mouse' && e.buttons === 0) { const wasDragging = drag.dragging; killDrag(); if (wasDragging && cur) render(); return; }
    if (!drag.el.isConnected) { killDrag(); return; }
    if (!drag.dragging && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 10) {
      drag.dragging = true;
      const r = drag.el.getBoundingClientRect();
      const g = drag.el.cloneNode(true); g.classList.add('ghost'); g.style.width = r.width + 'px';
      g.removeAttribute('data-item'); g.setAttribute('aria-hidden', 'true');
      drag.dx = e.clientX - r.left; drag.dy = e.clientY - r.top;
      // Kopie im Rätselfenster statt auf der Seite: verschwindet garantiert mit dem Fenster
      document.getElementById('panel').appendChild(g); drag.ghost = g; drag.el.classList.add('dragging');
    }
    if (drag.dragging) {
      drag.ghost.style.left = (e.clientX - drag.dx) + 'px'; drag.ghost.style.top = (e.clientY - drag.dy) + 'px';
      document.querySelectorAll('.zone.hover, .pool.hover').forEach(z => z.classList.remove('hover'));
      const t = document.elementFromPoint(e.clientX, e.clientY); const z = t && t.closest('[data-zone]'); if (z) z.classList.add('hover');
    }
  });
  const endDrag = e => {
    if (!drag || e.pointerId !== drag.pid) return;
    const dd = drag;
    killDrag(); // zuerst aufräumen – egal was danach passiert
    if (!cur) return;
    if (dd.dragging) {
      if (e.type === 'pointerup') {
        const t = document.elementFromPoint(e.clientX, e.clientY); const z = t && t.closest('[data-zone]');
        if (z) { place(dd.id, z.dataset.zone); return; }
      }
      render();
    } else if (e.type === 'pointerup' && dd.el.isConnected) tapCard(dd.id, dd.el);
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  // App-Wechsel, Bildschirmsperre, Drehen des iPads: laufendes Ziehen sicher beenden
  const abortDrag = () => { if (!drag && !document.querySelector('.card.ghost')) return; const was = drag && drag.dragging; killDrag(); if (was && cur && !cur.justSolved) render(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) abortDrag(); });
  window.addEventListener('blur', abortDrag);
  window.addEventListener('pagehide', abortDrag);
  window.addEventListener('orientationchange', abortDrag);

  function tapCard(id, elc) {
    const w = cur.w;
    const zoneEl = elc.closest('[data-zone]');
    const z = zoneEl ? zoneEl.dataset.zone : 'pool';
    if (w.sel === id) { w.sel = null; render(); return; }
    if (w.sel && z !== 'pool' && (w.place[w.sel] || 'pool') !== z) { place(w.sel, z); return; }
    w.sel = id; render();
  }

  function slotCap(z) { const s = cur.norm.slots.find(s => s.id === z); return s ? s.cap : 99; }
  function place(item, zone) {
    const w = cur.w;
    const from = w.place[item] || null;
    if (zone === 'pool') w.place[item] = null;
    else {
      const occ = Object.keys(w.place).filter(k => w.place[k] === zone && k !== item);
      if (occ.length >= slotCap(zone)) w.place[occ[0]] = from;
      w.place[item] = zone;
    }
    w.sel = null; w.marks = null; setFeedback('');
    render();
  }

  // ---------- Auswahl (Multiple Choice / Schlussfolgerung)
  function renderChoice(body) {
    const d = cur.def, w = cur.w;
    if (d.showFound) {
      const found = api.foundList('r3_search');
      body.appendChild(el('div', { class: 'foundlist' }, el('b', {}, 'Eure gefundenen Bilder: '), found.length ? found.join(' · ') : '–'));
    }
    d.questions.forEach((q, qi) => {
      const box = el('fieldset', { class: 'q' }, el('legend', {}, q.q));
      q.options.forEach((o, oi) => {
        const sel = w.answers[qi] === oi;
        const mark = w.marks && w.marks[qi + ':' + oi];
        box.appendChild(el('button', { type: 'button', class: 'opt' + (sel ? ' sel' : '') + (mark ? ' ' + mark : ''), 'aria-pressed': sel ? 'true' : 'false',
          onclick: () => { w.answers[qi] = oi; w.marks = null; setFeedback(''); render(); } }, o.t));
      });
      body.appendChild(box);
    });
  }

  // ---------- Zahlenschloss / Uhr
  function renderCode(body) {
    const d = cur.def, w = cur.w;
    if (d.clue) body.appendChild(el('div', { class: 'clue', html: d.clue }));
    if (d.gate) {
      const row = el('div', { class: 'tablets' });
      shuffled(ROOMS, 4).forEach(r => {
        row.appendChild(el('div', { class: 'tab' }, el('img', { src: tabletCanvas(r, 160).toDataURL(), alt: r.symbolName + ' ' + r.digit }),
          el('span', {}, r.symbolName)));
      });
      body.appendChild(row);
      if (d.gateLabels) body.appendChild(el('p', { class: 'small' }, 'Faustkeil = älteste Werkzeuge · Höhlenpferd = Höhle von Lascaux · Getreideähre = erste Bauern · Forscherpinsel = Archäologen heute'));
    }
    if (!w.wheels) w.wheels = d.wheels.map(wh => wh.start || 0);
    const lock = el('div', { class: 'lock' });
    d.wheels.forEach((wh, i) => {
      if (i && d.sep) lock.appendChild(el('span', { class: 'sep' }, d.sep));
      const step = delta => { w.wheels[i] = (w.wheels[i] + delta + wh.values.length) % wh.values.length; setFeedback(''); valEl.textContent = wh.values[w.wheels[i]]; };
      const valEl = el('div', { class: 'val', 'aria-live': 'polite' }, wh.values[w.wheels[i]]);
      lock.appendChild(el('div', { class: 'wheel' },
        wh.label ? el('span', { class: 'wl' }, wh.label) : null,
        el('button', { type: 'button', class: 'wb', 'aria-label': 'höher', onclick: () => step(1) }, '▲'),
        valEl,
        el('button', { type: 'button', class: 'wb', 'aria-label': 'niedriger', onclick: () => step(-1) }, '▼'),
        wh.values.length > 20 ? el('div', { class: 'wfast' },
          el('button', { type: 'button', class: 'wb small', onclick: () => step(-10) }, '−10'),
          el('button', { type: 'button', class: 'wb small', onclick: () => step(10) }, '+10')) : null));
    });
    body.appendChild(lock);
  }

  // ---------- Ausgrabung (freiwischen)
  function profileLayout(level) {
    const d = puzzleDef('r2_dig', level);
    const finds = d.finds.slice().sort((a, b) => FINDS[a].layer - FINDS[b].layer);
    const r = rng(level === 'experten' ? 77 : 33);
    return finds.map((id, i) => ({ id, layer: i, fx: 0.18 + r() * 0.62 }));
  }
  const LAYER_COLORS = ['#b08a5c', '#946c44', '#7c5634', '#664428', '#52361f'];
  function drawProfile(g, W, H, level, labels = true) {
    const lay = profileLayout(level), n = lay.length, lh = H / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle = LAYER_COLORS[i + (5 - n)] || LAYER_COLORS[i];
      g.fillRect(0, i * lh, W, lh + 1);
      const r = rng(i * 13 + 5); g.globalAlpha = 0.25;
      for (let k = 0; k < 120; k++) { g.fillStyle = r() > 0.5 ? '#2a1a0e' : '#d8c09a'; g.beginPath(); g.arc(r() * W, i * lh + r() * lh, 1 + r() * 4, 0, 7); g.fill(); }
      g.globalAlpha = 1;
      g.strokeStyle = 'rgba(30,18,8,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, i * lh); g.lineTo(W, i * lh); g.stroke();
      if (labels) { g.fillStyle = 'rgba(255,248,232,.92)'; g.font = `bold ${Math.round(W * 0.03)}px system-ui`; g.fillText('Schicht ' + (i + 1) + (i === 0 ? ' (oben)' : i === n - 1 ? ' (unten)' : ''), 8, i * lh + W * 0.04); }
    }
    const s = Math.min(lh * 0.75, W * 0.14);
    return lay.map(f => { const x = f.fx * W, y = f.layer * lh + lh * 0.55 - s / 2; drawFind(g, f.id, x - s / 2, y, s); return { id: f.id, x: x - s / 2, y, s }; });
  }
  const profileCache = {};
  function profileURL(level) {
    if (profileCache[level]) return profileCache[level];
    const c = makeCanvas(640, 420); drawProfile(c.getContext('2d'), 640, 420, level);
    return (profileCache[level] = c.toDataURL());
  }

  function renderScratch(body) {
    const d = cur.def, w = cur.w, level = api.level();
    const wrap = el('div', { class: 'scratch' });
    const base = makeCanvas(640, 420), top = makeCanvas(640, 420);
    base.className = 'sc-base'; top.className = 'sc-top';
    const boxes = drawProfile(base.getContext('2d'), 640, 420, level);
    const tg = top.getContext('2d');
    if (!w.scratchImg) {
      tg.fillStyle = '#6b4a2c'; tg.fillRect(0, 0, 640, 420);
      const r = rng(9); for (let k = 0; k < 2500; k++) { tg.fillStyle = ['#4a321c', '#8a6640', '#5a3e24', '#9c7a50'][k % 4]; tg.globalAlpha = 0.6; tg.beginPath(); tg.arc(r() * 640, r() * 420, 1 + r() * 6, 0, 7); tg.fill(); }
      tg.globalAlpha = 1; tg.fillStyle = 'rgba(255,240,210,.85)'; tg.font = 'bold 26px system-ui'; tg.textAlign = 'center'; tg.fillText('Hier mit dem Finger wischen', 320, 210);
    } else tg.putImageData(w.scratchImg, 0, 0);
    wrap.appendChild(base); wrap.appendChild(top);
    const list = el('div', { class: 'found' });
    const updList = () => {
      list.innerHTML = '';
      list.appendChild(el('b', {}, `Gefunden: ${Object.keys(w.found).length} von ${d.finds.length}`));
      d.finds.forEach(id => list.appendChild(el('span', { class: 'chip' + (w.found[id] ? ' ok' : '') }, w.found[id] ? FINDS[id].name : '?')));
    };
    updList();
    let painting = false, last = null, pending = false;
    const pos = e => { const r = top.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * 640, y: (e.clientY - r.top) / r.height * 420 }; };
    const brush = p => {
      tg.globalCompositeOperation = 'destination-out'; tg.lineCap = 'round'; tg.lineWidth = 46;
      tg.beginPath(); tg.moveTo((last || p).x, (last || p).y); tg.lineTo(p.x, p.y); tg.stroke();
      tg.globalCompositeOperation = 'source-over'; last = p;
      if (!pending) { pending = true; setTimeout(() => { pending = false; evaluate(); }, 120); }
    };
    const evaluate = () => {
      boxes.forEach(b => {
        if (w.found[b.id]) return;
        const img = tg.getImageData(Math.max(0, b.x), Math.max(0, b.y), Math.max(1, b.s), Math.max(1, b.s)).data;
        let clear = 0, tot = 0; for (let i = 3; i < img.length; i += 16) { tot++; if (img[i] < 60) clear++; }
        if (clear / tot > 0.42) { w.found[b.id] = true; api.toast('Fund: ' + FINDS[b.id].name + ' – ' + FINDS[b.id].desc); }
      });
      w.scratchImg = tg.getImageData(0, 0, 640, 420);
      updList();
      if (Object.keys(w.found).length >= d.finds.length) solved();
    };
    top.addEventListener('pointerdown', e => { painting = true; last = null; top.setPointerCapture(e.pointerId); brush(pos(e)); e.preventDefault(); });
    top.addEventListener('pointermove', e => { if (painting) brush(pos(e)); });
    top.addEventListener('pointerup', () => { painting = false; last = null; });
    top.addEventListener('pointercancel', () => { painting = false; last = null; });
    cur.scratchClear = () => { tg.clearRect(0, 0, 640, 420); d.finds.forEach(id => (w.found[id] = true)); w.scratchImg = tg.getImageData(0, 0, 640, 420); updList(); };
    body.appendChild(wrap); body.appendChild(list);
  }

  // ---------- Suchen in der 3D-Welt
  function renderSearch(body) {
    const d = cur.def;
    const st = api.searchState(d.id);
    const list = el('div', { class: 'found' }, el('b', {}, `Gefunden: ${st.count} von ${d.targets.length}`));
    d.targets.forEach(t => list.appendChild(el('span', { class: 'chip' + (st.found[t] ? ' ok' : '') }, st.found[t] ? st.name(t) : '?')));
    body.appendChild(list);
    body.appendChild(el('button', { type: 'button', class: 'btn primary big', onclick: () => close() }, 'Los geht’s – erkunden!'));
  }

  // --------------------------------------------------- Prüfen
  function check() {
    if (!cur || cur.justSolved) return;
    const d = cur.def, w = cur.w, level = api.level();
    const exp = level === 'experten';
    if (d.type === 'place') {
      const sol = cur.norm.solution;
      const ids = d.items.map(i => i.id);
      const needed = Object.keys(sol).length;
      const placedNeeded = cur.norm.slots.filter(s => ids.some(i => w.place[i] === s.id)).length;
      const emptySlots = cur.norm.slots.filter(s => s.cap === 1 && !ids.some(i => w.place[i] === s.id)).length;
      const unplacedReal = ids.filter(i => sol[i] && !w.place[i]).length;
      if ((d.layout !== 'bins' && emptySlots > 0) || (d.layout === 'bins' && unplacedReal > 0)) {
        setFeedback(d.layout === 'cloze' ? 'Füllt zuerst alle Lücken aus.' : 'Legt zuerst alle Karten ab.', 'warn'); return;
      }
      let correct = 0; const marks = {};
      ids.forEach(i => {
        const p = w.place[i] || null, s = sol[i] || null;
        if (s) { if (p === s) { correct++; marks[i] = 'ok'; } else if (p) marks[i] = 'bad'; }
        else if (p) marks[i] = 'bad';
      });
      if (correct === needed && !Object.values(marks).includes('bad')) return solved();
      fail(exp ? `${correct} von ${needed} richtig. Überprüft eure Zuordnung noch einmal.` : `${correct} von ${needed} richtig. Die <span class="bad-t">rot</span> markierten Karten liegen noch falsch.`);
      if (!exp) w.marks = marks;
      render();
    } else if (d.type === 'choice') {
      if (d.questions.some((_, qi) => w.answers[qi] == null)) { setFeedback('Beantwortet zuerst alle Fragen.', 'warn'); return; }
      let correct = 0; const marks = {};
      d.questions.forEach((q, qi) => { const o = q.options[w.answers[qi]]; if (o.ok) { correct++; marks[qi + ':' + w.answers[qi]] = 'ok'; } else marks[qi + ':' + w.answers[qi]] = 'bad'; });
      if (correct === d.questions.length) return solved();
      fail(exp ? `${correct} von ${d.questions.length} Fragen richtig.` : `${correct} von ${d.questions.length} Fragen richtig. Die rot markierte Antwort stimmt noch nicht.`);
      if (!exp) w.marks = marks;
      render();
    } else if (d.type === 'code') {
      const val = d.wheels.map((wh, i) => wh.values[w.wheels[i]]).join(d.sep || '');
      if (d.answers.includes(val)) return solved();
      fail(d.clock ? 'Das Zeitrad bewegt sich nicht. Die Uhrzeit stimmt noch nicht.' : 'Das Schloss bleibt zu. Der Code stimmt noch nicht.');
    } else if (d.type === 'scratch') {
      const n = Object.keys(w.found).length;
      if (n >= d.finds.length) return solved();
      setFeedback(`Ihr habt erst ${n} von ${d.finds.length} Funden freigelegt. Wischt weiter!`, 'warn');
    }
  }

  function fail(msg) {
    const w = cur.w; w.fails++;
    api.onFail(cur.id);
    let m = msg;
    if (w.fails >= 2 && (api.hintLevel(cur.id) < 3)) { m += ' <b>Tipp:</b> Nutzt die Hilfe-Taste!'; $('#p-tip').classList.add('pulse'); }
    setFeedback(m, 'bad');
    const card = $('#panel .panel-card'); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
  }

  function solved() {
    killDrag();
    const d = cur.def;
    cur.justSolved = true;
    api.markSolved(cur.id);
    const panel = $('#panel'); panel.classList.add('success');
    $('#p-check').hidden = true; $('#p-tip').hidden = true; $('#p-next').hidden = false;
    $('#p-tip').classList.remove('pulse');
    setFeedback('');
    $('#p-hints').innerHTML = '';
    const body = $('#p-body'); body.innerHTML = '';
    body.appendChild(el('div', { class: 'win' }, el('div', { class: 'win-ic' }, '✓'), el('h3', {}, 'Rätsel gelöst!'), el('p', { html: d.success })));
    if (d.id === 'u_final') body.appendChild(el('div', { class: 'note' }, el('p', {}, FINAL_TEXT.merksatz)));
    $('#p-next').focus();
  }

  // --------------------------------------------------- Hilfe
  function renderHints() {
    const box = $('#p-hints'); box.innerHTML = '';
    const d = cur.def, lvl = api.hintLevel(cur.id);
    const hints = d.hints || [];
    $('#p-tip').textContent = lvl >= hints.length ? 'Alle Tipps genutzt' : `Tipp ${lvl + 1} von ${hints.length}`;
    $('#p-tip').disabled = lvl >= hints.length;
    for (let i = 0; i < Math.min(lvl, hints.length); i++) {
      const last = i === hints.length - 1;
      const h = el('div', { class: 'hint' + (last ? ' sol' : '') }, el('b', {}, last ? 'Lösung: ' : `Tipp ${i + 1}: `), el('span', {}, hints[i].replace(/^Lösung:\s*/, '')));
      if (last && d.type !== 'search') h.appendChild(el('button', { type: 'button', class: 'btn small', onclick: applySolution }, 'Lösung einsetzen'));
      box.appendChild(h);
    }
  }
  function nextHint() {
    if (!cur) return;
    const hints = cur.def.hints || [];
    const lvl = api.hintLevel(cur.id);
    if (lvl >= hints.length) return;
    if (lvl === hints.length - 1 && !confirm('Wollt ihr wirklich die Lösung sehen? Versucht es vorher ruhig noch einmal gemeinsam!')) return;
    api.useHint(cur.id, lvl + 1);
    $('#p-tip').classList.remove('pulse');
    renderHints();
    if (cur.def.type === 'search' && lvl + 1 >= hints.length) api.revealSearch(cur.id);
    const hb = $('#p-hints'); hb.lastElementChild && hb.lastElementChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function applySolution() {
    const d = cur.def, w = cur.w;
    if (d.type === 'place') { w.place = {}; Object.entries(cur.norm.solution).forEach(([i, s]) => (w.place[i] = s)); w.marks = null; w.sel = null; render(); }
    else if (d.type === 'choice') { d.questions.forEach((q, qi) => (w.answers[qi] = q.options.findIndex(o => o.ok))); w.marks = null; render(); }
    else if (d.type === 'code') {
      const ans = d.answers[Math.floor(d.answers.length / 2)];
      const parts = d.sep ? ans.split(d.sep) : ans.split('');
      w.wheels = parts.map((p, i) => d.wheels[i].values.indexOf(p)); render();
    } else if (d.type === 'scratch') { cur.scratchClear && cur.scratchClear(); }
    setFeedback('Die Lösung ist eingesetzt. Lest sie euch durch und tippt dann auf „' + ($('#p-check').textContent) + '“.', 'info');
    if (d.type === 'scratch') check();
  }

  function isOpen() { return !!cur; }
  function currentId() { return cur && cur.id; }
  function rerender() { if (cur && !cur.justSolved) render(); }

  return { init, open, close, check, nextHint, isOpen, currentId, rerender, profileURL, showSolved };
})();
