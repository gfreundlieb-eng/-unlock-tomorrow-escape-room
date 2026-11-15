// =====================================================================
//  MAIN – Spielablauf
// =====================================================================

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

const ALL_PUZZLES = [...ROOMS.flatMap(r => r.puzzles), 'gate', 'u_explore', 'u_final'];
const WORLD_NAMES = { hub: 'Die Höhle', r1: ROOMS[0].name, r2: ROOMS[1].name, r3: ROOMS[2].name, r4: ROOMS[3].name, uruk: 'Uruk' };
const TEACHER_PIN = '1940';

function freshState(level, team) {
  return { v: 1, level, team: team || '', solved: {}, hints: {}, tablets: {}, found: {}, seen: {}, reveal: {}, introSeen: {},
    gateOpen: false, done: false, elapsed: 0, fails: 0, where: 'hub', teacherUnlock: false,
    settings: { skipAnim: matchMedia('(prefers-reduced-motion: reduce)').matches, bigText: false, invertX: false, invertY: false } };
}
let S = null;
let running = false;
let curWorld = null;

function save() { if (!S) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (_) {} }
function load() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && s.v === 1) return s; } catch (_) {} return null; }

// ------------------------------------------------------------------ Logik
const roomOf = id => ROOMS.find(r => r.id === id);
const roomComplete = r => r.puzzles.every(p => S.solved[p]);
function roomUnlocked(id) {
  const i = ROOMS.findIndex(r => r.id === id);
  return S.teacherUnlock || i <= 0 || roomComplete(ROOMS[i - 1]);
}
function requiresMet(pid) { return (PUZZLES[pid].requires || []).every(r => S.solved[r]); }
function parentSearchOf(targetId) { return Object.keys(PUZZLES).find(k => PUZZLES[k].type === 'search' && PUZZLES[k].targets.includes(targetId)); }
function searchState(pid) {
  const f = S.found[pid] || {};
  const def = PUZZLES[pid];
  return { found: f, count: def.targets.filter(t => f[t]).length,
    name: t => (PAINTINGS[t] ? PAINTINGS[t].name : INFOS[t] ? INFOS[t].title : t) };
}
function totalSolved() { return ALL_PUZZLES.filter(p => S.solved[p]).length; }
function hintsUsed() { return Object.values(S.hints).reduce((a, b) => a + b, 0); }
function fmtTime(sec) { const m = Math.floor(sec / 60), s = sec % 60; return `${m}:${String(s).padStart(2, '0')}`; }

// ------------------------------------------------------------------ UI-Helfer
function toast(msg, type) {
  const t = el('div', { class: 'toast ' + (type || '') }, msg);
  $('#toasts').appendChild(t);
  setTimeout(() => t.classList.add('out'), 3800);
  setTimeout(() => t.remove(), 4400);
}
function anyModal() { return !$('#panel').classList.contains('hidden') || $$('.overlay:not(.hidden)').length > 0 || document.body.classList.contains('menu-open'); }
function showOverlay(id) { $$('.overlay').forEach(o => o.classList.add('hidden')); if (id) $(id).classList.remove('hidden'); }
function hideOverlay(id) { $(id).classList.add('hidden'); }

function status(msg) { const s = $('#status'); s.textContent = msg || ''; s.hidden = !msg; }

// ------------------------------------------------------------------ Info-Karten
let infoDone = null;
function openInfo(title, html, opts = {}) {
  const box = $('#info');
  $('#i-title').textContent = title;
  const body = $('#i-body'); body.innerHTML = html;
  const btn = $('#i-close');
  btn.textContent = opts.button || 'Verstanden';
  btn.hidden = false;
  if (opts.check) {
    const done = opts.checkDone;
    const q = el('fieldset', { class: 'q' }, el('legend', {}, opts.check.q));
    const fb = el('p', { class: 'fb-inline' });
    shuffled(opts.check.options, strSeed(opts.check.q)).forEach(o => {
      const b = el('button', { type: 'button', class: 'opt', onclick: () => {
        if (o.ok) { b.classList.add('ok'); q.querySelectorAll('button').forEach(x => (x.disabled = true)); fb.textContent = 'Richtig!'; fb.className = 'fb-inline ok'; btn.hidden = false; if (opts.onRight) opts.onRight(); }
        else { b.classList.add('bad'); b.disabled = true; fb.textContent = 'Nicht ganz. Lest den Text noch einmal genau.'; fb.className = 'fb-inline bad'; S.fails++; }
      } }, o.t);
      if (done && o.ok) { b.classList.add('ok'); }
      q.appendChild(b);
    });
    if (done) q.querySelectorAll('button').forEach(x => (x.disabled = true));
    body.appendChild(q); body.appendChild(fb);
    if (!done) btn.hidden = true;
  }
  infoDone = opts.onClose || null;
  box.classList.remove('hidden');
  Engine.player.tx = null;
  setTimeout(() => (btn.hidden ? body.querySelector('button') : btn).focus(), 30);
}
function closeInfo() { hideOverlay('#info'); const f = infoDone; infoDone = null; if (f) f(); refreshAll(); }

// ------------------------------------------------------------------ Welten
function enterWorld(name, opts = {}) {
  const go = () => {
    curWorld = BUILDERS[name]({ roomUnlocked });
    S.where = name; save();
    let spawn = curWorld.spawn;
    if (name === 'hub' && opts.from && curWorld.portals[opts.from]) {
      const it = curWorld.interacts['portal_' + opts.from];
      const sx = it.pos.x * 0.72, sz = it.pos.z * 0.85;
      spawn = { x: sx, z: sz, yaw: Math.atan2(sx, sz) };
    }
    if (name === 'hub' && opts.atGate) spawn = { x: 0, z: -4, yaw: 0 };
    if (Engine.ok) Engine.setWorld(curWorld, spawn); else { Engine.player.x = spawn.x; Engine.player.z = spawn.z; }
    if (curWorld.refresh) curWorld.refresh(S);
    refreshAll();
    $('#where').textContent = WORLD_NAMES[name];
    $('#btn-home').hidden = !(name in { r1: 1, r2: 1, r3: 1, r4: 1 });
    fade(false);
    const r = roomOf(name);
    if (r && !S.introSeen[name]) {
      S.introSeen[name] = true; save();
      openInfo(r.name, `<p>${r.intro}</p><p class="small">Ihr findet hier ${r.puzzles.length} Aufgaben. Goldene Zeichen <span class="mk mk-todo">!</span> zeigen sie euch.</p>`, { button: 'Los geht’s!' });
    } else if (name === 'uruk' && !S.introSeen.uruk) {
      S.introSeen.uruk = true; S.seen.uruk_intro = true; save();
      openInfo(INFOS.uruk_intro.title, INFOS.uruk_intro.text, { button: 'Stadt erkunden' });
    } else if (name === 'hub' && !S.introSeen.hub) {
      S.introSeen.hub = true; save();
      openInfo(INFOS.hub_help.title, INFOS.hub_help.text + '<p>Geht zuerst in den Gang <b>1 · Zeitkammer</b> (links vorne).</p>', { button: 'Los geht’s!' });
    }
    if (opts.after) opts.after();
  };
  if (S.settings.skipAnim || opts.instant) go();
  else { fade(true); setTimeout(go, 380); }
}
function fade(on, white) { const f = $('#fade'); f.classList.toggle('white', !!white); f.classList.toggle('on', on); }

function refreshAll() {
  if (!S) return;
  refreshMarkers();
  renderHUD();
  if (curWorld && curWorld.refresh) curWorld.refresh(S);
  updateStatus();
}

function markerKindFor(it) {
  const id = it.id;
  switch (it.kind) {
    case 'puzzle': return S.solved[id] ? 'done' : !requiresMet(id) ? 'locked' : 'todo';
    case 'info': return S.seen[id] ? 'done' : 'info';
    case 'explore': { const p = parentSearchOf(id); return S.found[p] && S.found[p][id] ? 'done' : 'info'; }
    case 'painting': { const f = S.found.r3_search || {}; return f[id] ? 'done' : S.reveal.r3_search ? 'search' : null; }
    case 'portal': return roomUnlocked(it.room) ? (roomComplete(roomOf(it.room)) ? 'done' : 'portal') : 'locked';
    case 'gate': return S.gateOpen ? 'portal' : ROOMS.every(r => S.tablets[r.id]) ? 'todo' : 'locked';
    default: return null;
  }
}
function refreshMarkers() {
  if (!curWorld) return;
  for (const id in curWorld.interacts) {
    const it = curWorld.interacts[id];
    if (!it.sprite) continue;
    const k = markerKindFor(it);
    it.sprite.visible = !!k;
    if (k) setMarker(it.sprite, k, it.kind === 'portal' ? String(ROOMS.findIndex(r => r.id === it.room) + 1) : it.kind === 'gate' && S.gateOpen ? '→' : '');
    it.sprite.userData.small = it.kind === 'painting' && k === 'done';
  }
}

function updateStatus() {
  if (!curWorld || anyModal()) return;
  const n = curWorld.name;
  const r = roomOf(n);
  if (r) {
    const open = r.puzzles.filter(p => !S.solved[p]).length;
    status(open ? `${r.name}: noch ${open} von ${r.puzzles.length} Aufgaben offen.` : 'Kammer geschafft! Zurück zur Höhle und zum Tor.');
  } else if (n === 'hub') {
    const next = ROOMS.find(r => !roomComplete(r));
    if (S.gateOpen) status('Das Tor ist offen. Geht hindurch nach Uruk!');
    else if (!next) status('Ihr habt alle vier Täfelchen! Geht zum Tor.');
    else status(`Nächstes Ziel: Gang ${ROOMS.indexOf(next) + 1} · ${next.name}`);
  } else if (n === 'uruk') {
    const st = searchState('u_explore');
    status(S.solved.u_final ? 'Geschafft! Ihr könnt Uruk weiter erkunden.' : st.count < 7 ? `Merkmale einer Stadt gefunden: ${st.count} von 7` : 'Geht zur dunklen Stele auf dem Stadtplatz: Die große Frage wartet!');
  }
}

// ------------------------------------------------------------------ Interaktion
function onInteract(it) {
  if (anyModal()) return;
  const id = it.id;
  switch (it.kind) {
    case 'puzzle': {
      if (S.solved[id]) { const d = puzzleDef(id, S.level); openInfo(d.title + ' ✓', `<p>${d.success}</p>${id === 'u_final' ? `<div class="note"><p>${FINAL_TEXT.merksatz}</p></div>` : ''}`); return; }
      if (!requiresMet(id)) {
        const need = PUZZLES[id].requires.filter(r => !S.solved[r]).map(r => '„' + PUZZLES[r].title + '“');
        toast('Löst zuerst: ' + need.join(', '), 'warn'); return;
      }
      Puzzles.open(id); return;
    }
    case 'info': {
      S.seen[id] = true; save();
      const inf = INFOS[id]; openInfo(inf.title, inf.text); return;
    }
    case 'explore': {
      const p = parentSearchOf(id); const inf = INFOS[id];
      const done = S.found[p] && S.found[p][id];
      openInfo(inf.title, inf.text, { check: inf.check, checkDone: done, onRight: () => foundTarget(p, id) });
      return;
    }
    case 'painting': {
      const f = S.found.r3_search || (S.found.r3_search = {});
      const name = PAINTINGS[id].name;
      if (!f[id]) {
        f[id] = true; save();
        const n = searchState('r3_search').count;
        toast(`Bild entdeckt: ${name} (${n} von 8)`, 'ok');
        flashPainting(id);
        refreshAll();
        if (n >= 8 && !S.solved.r3_search) setTimeout(() => Puzzles.showSolved('r3_search'), 700);
      } else toast(`Dieses Bild habt ihr schon: ${name}`);
      return;
    }
    case 'portal': {
      if (roomUnlocked(it.room)) enterWorld(it.room);
      else { const i = ROOMS.findIndex(r => r.id === it.room); toast(`Dieser Gang ist noch verschüttet. Schafft zuerst Kammer ${i}: ${ROOMS[i - 1].name}.`, 'warn'); }
      return;
    }
    case 'exit': enterWorld('hub', { from: curWorld.name }); return;
    case 'gate': {
      if (S.gateOpen) { enterWorld('uruk'); return; }
      const miss = ROOMS.filter(r => !S.tablets[r.id]);
      if (miss.length) { openInfo('Das Tor der Zeit', `<p>Auf dem Tor sind vier Mulden für Steintäfelchen. Euch fehlen noch <b>${miss.length}</b>.</p><p>Inschrift: <i>„Wer die Steinzeit versteht, findet den Weg in die erste Stadt.“</i></p>`); return; }
      Puzzles.open('gate'); return;
    }
  }
}

function foundTarget(pid, tid) {
  const f = S.found[pid] || (S.found[pid] = {});
  if (f[tid]) return;
  f[tid] = true; save();
  const st = searchState(pid);
  toast(`${INFOS[tid].title}: entdeckt (${st.count} von ${PUZZLES[pid].targets.length})`, 'ok');
  if (st.count >= PUZZLES[pid].targets.length && !S.solved[pid]) {
    infoDone = () => setTimeout(() => Puzzles.showSolved(pid), 200);
  }
}

function flashPainting(id) {
  if (!curWorld || !curWorld.paintings) return;
  const pl = curWorld.paintings[id]; if (!pl) return;
  pl.material.emissive = new THREE.Color('#5a3a1a');
  setTimeout(() => { pl.material.emissive = new THREE.Color('#2a1a0a'); }, 900);
}

// nach dem Schließen eines gelösten Rätsels
function afterSolved(id) {
  refreshAll();
  if (id === 'gate') return gateSequence();
  if (id === 'u_final') return showFinal();
  if (id === 'u_explore') { toast('Alle Merkmale gefunden! Geht zur dunklen Stele auf dem Stadtplatz.', 'ok'); return; }
  const r = roomOf(PUZZLES[id].room);
  if (r && roomComplete(r) && !S.tablets[r.id]) { S.tablets[r.id] = true; save(); showReward(r); }
}

function showReward(r) {
  const box = $('#reward');
  $('#rw-img').src = tabletCanvas(r, 256, true).toDataURL();
  $('#rw-text').innerHTML = `Ihr habt die Kammer <b>${r.name}</b> geschafft und ein Steintäfelchen gefunden: <b>${r.symbolName}</b> mit der Zahl <b class="digit">${r.digit}</b>.`;
  const left = ROOMS.filter(x => !S.tablets[x.id]).length;
  $('#rw-next').textContent = left ? `Noch ${left} Täfelchen bis zum Tor. Ein neuer Gang hat sich geöffnet!` : 'Ihr habt alle vier Täfelchen! Bringt sie zum Tor.';
  box.classList.toggle('noanim', S.settings.skipAnim);
  box.classList.remove('hidden');
  renderHUD();
  setTimeout(() => $('#rw-home').focus(), 50);
}

function gateSequence() {
  S.gateOpen = true; save();
  const w = curWorld;
  if (!Engine.ok || S.settings.skipAnim || !w.gate) { enterWorld('uruk'); return; }
  $('#skip').hidden = false;
  const cam = Engine.camera; const p = Engine.player;
  const sx = p.x, sz = p.z, sy = p.y;
  const doors = w.gate;
  doors.doorL.rotation.y = 0; doors.doorR.rotation.y = 0;
  status('');
  Engine.playCutscene((k, c) => {
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    c.position.set(sx * (1 - e), sy + Math.sin(k * 60) * 0.02 * (1 - k), sz + (-5.5 - sz) * e);
    c.rotation.set(0.05, 0, 0);
    const d = Math.max(0, (k - 0.15) / 0.6);
    doors.doorL.rotation.y = -Math.min(1, d) * 1.4; doors.doorR.rotation.y = Math.min(1, d) * 1.4;
    if (k > 0.8) fade(true, true);
  }, 4.5, () => {
    $('#skip').hidden = true;
    enterWorld('uruk', { instant: false });
    setTimeout(() => fade(false), 50);
  });
}

function showFinal() {
  S.done = true; save();
  running = false;
  $('#f-team').textContent = S.team ? `Team: ${S.team}` : '';
  $('#f-stats').innerHTML = `<span>Stufe: <b>${LEVELS[S.level].name}</b></span><span>Spielzeit: <b>${fmtTime(S.elapsed)}</b></span><span>Rätsel: <b>${totalSolved()} / ${ALL_PUZZLES.length}</b></span><span>Tipps genutzt: <b>${hintsUsed()}</b></span>`;
  $('#f-merk').textContent = FINAL_TEXT.merksatz;
  $('#f-aus').textContent = FINAL_TEXT.ausblick;
  $('#f-code').textContent = `URUK-${GATE_CODE}-${S.level === 'experten' ? 'EX' : 'EN'}`;
  $('#final').classList.toggle('noanim', S.settings.skipAnim);
  showOverlay('#final');
}

// ------------------------------------------------------------------ HUD
function renderHUD() {
  if (!S) return;
  const tabs = $('#tabs'); tabs.innerHTML = '';
  ROOMS.forEach(r => {
    const got = !!S.tablets[r.id];
    tabs.appendChild(el('span', { class: 'tabslot' + (got ? ' got' : ''), title: got ? `${r.symbolName}: ${r.digit}` : 'noch nicht gefunden' },
      el('img', { src: symbolURL(r.symbol, got ? '#2d2216' : '#8a7a66', 64), alt: '' }), got ? el('b', {}, String(r.digit)) : el('b', {}, '?')));
  });
  $('#prog').textContent = `${totalSolved()}/${ALL_PUZZLES.length}`;
  $('#lvl').textContent = LEVELS[S.level].name;
  $('#timer').textContent = fmtTime(S.elapsed);
}

// ------------------------------------------------------------------ Forscherbuch
function openJournal() {
  const body = $('#j-body'); body.innerHTML = '';
  const here = curWorld && curWorld.name;
  const goBtn = (id, label = 'Hingehen') => el('button', { type: 'button', class: 'btn small', onclick: () => { closeJournal(); const it = curWorld.interacts[id]; if (!it) return; if (Engine.ok) Engine.goUse(it); else onInteract(it); } }, label);
  const pRow = pid => {
    const d = puzzleDef(pid, S.level);
    const solved = S.solved[pid], locked = !requiresMet(pid);
    let extra = '';
    if (d.type === 'search') { const st = searchState(pid); extra = ` (${st.count}/${d.targets.length})`; }
    const row = el('div', { class: 'jrow' + (solved ? ' ok' : '') },
      el('span', { class: 'jst' }, solved ? '✓' : locked ? '🔒' : '•'),
      el('span', { class: 'jt' }, el('b', {}, d.title + extra), el('small', {}, d.kind + (locked && !solved ? ' – zuerst: ' + PUZZLES[pid].requires.map(r => PUZZLES[r].title).join(', ') : ''))),
      here === PUZZLES[pid].room && curWorld.interacts[pid] ? goBtn(pid, solved ? 'Ansehen' : 'Hingehen') : null);
    body.appendChild(row);
    if (d.type === 'search' && here === PUZZLES[pid].room && (d.infoTargets || !Engine.ok || S.reveal[pid])) {
      d.targets.forEach(t => { const f = S.found[pid] && S.found[pid][t]; if (f && !d.infoTargets) return;
        body.appendChild(el('div', { class: 'jrow sub' + (f ? ' ok' : '') }, el('span', { class: 'jst' }, f ? '✓' : '○'), el('span', { class: 'jt' }, d.infoTargets ? INFOS[t].title : 'Verstecktes Bild'), curWorld.interacts[t] ? goBtn(t) : null)); });
    }
  };
  ROOMS.forEach((r, i) => {
    const open = roomUnlocked(r.id);
    body.appendChild(el('h3', { class: 'jh' + (S.tablets[r.id] ? ' ok' : '') }, el('img', { src: symbolURL(r.symbol, S.tablets[r.id] ? r.color : '#8a7a66', 48), alt: '' }), `${i + 1} · ${r.name}`, S.tablets[r.id] ? el('span', { class: 'jd' }, 'Täfelchen ' + r.digit) : !open ? el('span', { class: 'jd' }, 'verschüttet') : null));
    if (open) r.puzzles.forEach(pRow);
    if (here === 'hub' && open && curWorld.interacts['portal_' + r.id]) body.appendChild(el('div', { class: 'jrow sub' }, el('span', { class: 'jst' }, '→'), el('span', { class: 'jt' }, 'Gang ' + (i + 1)), goBtn('portal_' + r.id, 'Hingehen')));
  });
  body.appendChild(el('h3', { class: 'jh' + (S.gateOpen ? ' ok' : '') }, '⛩ Das Tor der Zeit'));
  pRow('gate');
  if (S.gateOpen || here === 'uruk') {
    body.appendChild(el('h3', { class: 'jh' + (S.solved.u_final ? ' ok' : '') }, '🏛 Finale: Uruk'));
    pRow('u_explore'); pRow('u_final');
  }
  if (here === 'hub' && curWorld.interacts.gate) body.appendChild(el('div', { class: 'jrow sub' }, el('span', { class: 'jst' }, '→'), el('span', { class: 'jt' }, 'Zum Tor'), goBtn('gate')));
  if (here !== 'hub' && here !== 'uruk') body.appendChild(el('div', { class: 'jrow sub' }, el('span', { class: 'jst' }, '↩'), el('span', { class: 'jt' }, 'Zurück zur Höhle'), el('button', { type: 'button', class: 'btn small', onclick: () => { closeJournal(); enterWorld('hub', { from: here }); } }, 'Gehen')));
  $('#journal').classList.remove('hidden');
}
function closeJournal() { hideOverlay('#journal'); refreshAll(); }

// ------------------------------------------------------------------ Menü
function openMenu() {
  $('#m-skip').checked = S.settings.skipAnim;
  $('#m-big').checked = S.settings.bigText;
  $('#m-invy').checked = !!S.settings.invertY;
  $('#m-invx').checked = !!S.settings.invertX;
  $('#m-level').textContent = LEVELS[S.level].name;
  $('#menu').classList.remove('hidden');
}
function applySettings() {
  document.documentElement.classList.toggle('big', !!(S && S.settings.bigText));
  document.documentElement.classList.toggle('noanim', !!(S && S.settings.skipAnim));
  Engine.look.ix = S && S.settings.invertX ? -1 : 1;
  Engine.look.iy = S && S.settings.invertY ? -1 : 1;
}

function teacherMenu() {
  const pin = prompt('Lehrkraft-PIN eingeben:');
  if (pin !== TEACHER_PIN) { if (pin != null) toast('Falsche PIN.', 'warn'); return; }
  const body = $('#t-body'); body.innerHTML = '';
  body.appendChild(el('p', {}, `Fortschritt: ${totalSolved()}/${ALL_PUZZLES.length} Rätsel · ${fmtTime(S.elapsed)} · Tipps: ${hintsUsed()} · Fehlversuche: ${S.fails}`));
  body.appendChild(el('button', { type: 'button', class: 'btn', onclick: () => { S.teacherUnlock = true; save(); hideOverlay('#teacher'); refreshAll(); toast('Alle Kammern sind freigeschaltet.', 'ok'); } }, 'Alle Kammern freischalten'));
  const pid = curWorld && Object.keys(curWorld.interacts).find(k => PUZZLES[k] && !S.solved[k] && requiresMet(k));
  ['hub', 'r1', 'r2', 'r3', 'r4'].forEach(w => body.appendChild(el('button', { type: 'button', class: 'btn', onclick: () => { hideOverlay('#teacher'); S.teacherUnlock = true; enterWorld(w); } }, 'Springen: ' + WORLD_NAMES[w])));
  body.appendChild(el('button', { type: 'button', class: 'btn', onclick: () => { hideOverlay('#teacher'); ROOMS.forEach(r => (S.tablets[r.id] = true)); save(); enterWorld('hub', { atGate: true }); } }, 'Alle Täfelchen geben (zum Tor)'));
  body.appendChild(el('button', { type: 'button', class: 'btn', onclick: () => { hideOverlay('#teacher'); S.gateOpen = true; S.solved.gate = true; ROOMS.forEach(r => (S.tablets[r.id] = true)); save(); enterWorld('uruk'); } }, 'Springen: Uruk (Finale)'));
  showOverlay('#teacher');
}

// ------------------------------------------------------------------ Start
function showStart() {
  const saved = load();
  const cont = $('#s-continue');
  if (saved && !saved.done) {
    cont.hidden = false;
    cont.querySelector('span').textContent = `${saved.team ? saved.team + ' · ' : ''}${LEVELS[saved.level].name} · ${ALL_PUZZLES.filter(p => saved.solved[p]).length}/${ALL_PUZZLES.length} Rätsel`;
    cont.onclick = () => { S = saved; applySettings(); startPlaying(saved.where === 'uruk' && !saved.gateOpen ? 'hub' : saved.where); };
  } else cont.hidden = true;
  showOverlay('#start');
}
let chosenLevel = 'entdecker';
function startNew() {
  S = freshState(chosenLevel, $('#s-team').value.trim().slice(0, 40));
  S.settings.skipAnim = $('#s-skip').checked;
  applySettings(); save();
  showStory(0);
}
function showStory(i) {
  if (i >= STORY.length || S.settings.skipAnim && i > 0) { hideOverlay('#story'); startPlaying('hub'); return; }
  const st = STORY[i];
  $('#st-title').textContent = st.title;
  $('#st-text').textContent = st.text;
  $('#st-dots').innerHTML = STORY.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
  $('#st-next').textContent = i === STORY.length - 1 ? 'Abenteuer beginnen' : 'Weiter';
  $('#st-next').onclick = () => showStory(i + 1);
  const t = $('#st-text'); t.classList.remove('in'); void t.offsetWidth; t.classList.add('in');
  showOverlay('#story');
  $('#st-next').focus();
}
function startPlaying(where) {
  showOverlay(null);
  document.body.classList.add('playing');
  running = true;
  enterWorld(where || 'hub', { instant: true });
}

// ------------------------------------------------------------------ Boot
function boot() {
  const glOK = Engine.init({ blocked: () => anyModal() || !running, onInteract, onWalkTap: () => status('') });
  if (!glOK) { document.body.classList.add('nogl'); }
  Puzzles.init({
    level: () => S.level,
    hintLevel: id => S.hints[id] || 0,
    useHint: (id, n) => { S.hints[id] = n; save(); },
    markSolved: id => { S.solved[id] = true; save(); renderHUD(); },
    afterSolved,
    onFail: () => { S.fails++; },
    onPanel: () => { if (!anyModal()) updateStatus(); },
    toast,
    foundList: pid => { const f = S.found[pid] || {}; return PUZZLES[pid].targets.filter(t => f[t]).map(t => PAINTINGS[t].name); },
    searchState,
    revealSearch: pid => { S.reveal[pid] = true; save(); refreshMarkers(); }
  });

  // Start-Bildschirm
  $$('.lvl-btn').forEach(b => b.addEventListener('click', () => { chosenLevel = b.dataset.level; $$('.lvl-btn').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); }));
  $('#s-skip').checked = matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('#s-start').addEventListener('click', () => {
    const saved = load();
    if (saved && !saved.done && ALL_PUZZLES.some(p => saved.solved[p]) && !confirm('Es gibt einen gespeicherten Spielstand. Wirklich ein neues Spiel starten? Der alte Spielstand wird gelöscht.')) return;
    startNew();
  });
  $('#st-skip').addEventListener('click', () => { hideOverlay('#story'); startPlaying('hub'); });

  // Panel
  $('#p-close').addEventListener('click', () => Puzzles.close());
  $('#p-next').addEventListener('click', () => Puzzles.close());
  $('#p-check').addEventListener('click', () => Puzzles.check());
  $('#p-tip').addEventListener('click', () => Puzzles.nextHint());
  $('#i-close').addEventListener('click', closeInfo);

  // HUD
  $('#btn-journal').addEventListener('click', openJournal);
  $('#j-close').addEventListener('click', closeJournal);
  $('#btn-help').addEventListener('click', () => openInfo(INFOS.hub_help.title, INFOS.hub_help.text));
  $('#btn-menu').addEventListener('click', openMenu);
  $('#btn-home').addEventListener('click', () => { if (curWorld && roomOf(curWorld.name)) enterWorld('hub', { from: curWorld.name }); });
  $('#m-close').addEventListener('click', () => hideOverlay('#menu'));
  $('#m-skip').addEventListener('change', e => { S.settings.skipAnim = e.target.checked; save(); applySettings(); });
  $('#m-big').addEventListener('change', e => { S.settings.bigText = e.target.checked; save(); applySettings(); });
  $('#m-invy').addEventListener('change', e => { S.settings.invertY = e.target.checked; save(); applySettings(); });
  $('#m-invx').addEventListener('change', e => { S.settings.invertX = e.target.checked; save(); applySettings(); });
  $('#m-restart').addEventListener('click', () => { if (confirm('Spiel wirklich neu starten? Der ganze Fortschritt geht verloren.')) { try { localStorage.removeItem(SAVE_KEY); } catch (_) {} location.reload(); } });
  $('#m-teacher').addEventListener('click', () => { hideOverlay('#menu'); teacherMenu(); });
  $('#t-close').addEventListener('click', () => hideOverlay('#teacher'));
  $('#rw-home').addEventListener('click', () => { hideOverlay('#reward'); enterWorld('hub', { from: curWorld.name }); });
  $('#rw-stay').addEventListener('click', () => { hideOverlay('#reward'); refreshAll(); });
  $('#skip').addEventListener('click', () => Engine.finishCutscene());
  $('#f-stay').addEventListener('click', () => { hideOverlay('#final'); running = true; refreshAll(); });
  $('#f-new').addEventListener('click', () => { try { localStorage.removeItem(SAVE_KEY); } catch (_) {} location.reload(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!$('#panel').classList.contains('hidden')) Puzzles.close();
      else if (!$('#info').classList.contains('hidden') && !$('#i-close').hidden) closeInfo();
      else if (!$('#journal').classList.contains('hidden')) closeJournal();
      else if (!$('#menu').classList.contains('hidden')) hideOverlay('#menu');
    }
  });

  setInterval(() => {
    if (!S || !running || document.hidden || S.done) return;
    S.elapsed++; $('#timer').textContent = fmtTime(S.elapsed);
    if (S.elapsed % 10 === 0) save();
  }, 1000);

  showStart();
  $('#loading').remove();
}

// Test-/Lehrkraft-Schnittstelle (für automatische Tests)
window.ESC = { get state() { return S; }, get world() { return curWorld; }, enterWorld, onInteract, Puzzles, Engine };

boot();
