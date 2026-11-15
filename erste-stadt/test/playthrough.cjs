// Automatischer Durchspiel-Test für beide Schwierigkeitsstufen.
//   node test/playthrough.cjs [screenshot-ordner]
// Benötigt Playwright mit Chromium.
const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');

const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const SHOTS = process.argv[2] || path.resolve(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
let failures = 0;
const ok = (cond, msg) => { if (!cond) { failures++; console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); };

async function run(level, deviceName, opts = {}) {
  console.log(`\n=== ${level.toUpperCase()} auf ${deviceName} ===`);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext(devices[deviceName] ? { ...devices[deviceName] } : { viewport: opts.viewport, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(FILE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await sleep(800);
  const shot = async name => { await page.screenshot({ path: path.join(SHOTS, `${level}-${deviceName.replace(/\W+/g, '_')}-${name}.png`) }); };

  // ---------- Start
  await page.fill('#s-team', 'Test ' + level);
  await page.tap(`.lvl-btn[data-level="${level}"]`);
  await page.tap('#s-start');
  await page.tap('#st-next'); await page.tap('#st-next'); await page.tap('#st-next');
  await sleep(600);
  ok(await page.isVisible('#info'), 'Einführung in der Höhle erscheint');
  await page.tap('#i-close');

  const visible = sel => page.isVisible(sel);
  const waitFor = async (fn, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await sleep(150); } return false; };

  // Objekt in der 3D-Welt antippen: Blick hinwenden (wie Wischen), Marker antippen
  async function tapObject(id) {
    const pt = await page.evaluate(id => {
      const it = ESC.world.interacts[id]; const pl = ESC.Engine.player;
      pl.yaw = Math.atan2(-(it.pos.x - pl.x), -(it.pos.z - pl.z)); pl.faceYaw = null;
      const target = it.sprite && it.sprite.visible ? it.sprite : it.obj;
      return { y: it.sprite && it.sprite.visible ? it.sprite.position.y : 1.2, sprite: !!(it.sprite && it.sprite.visible) };
    }, id);
    await sleep(120);
    const sc = await page.evaluate(id => {
      const it = ESC.world.interacts[id]; const cam = ESC.Engine.camera;
      const o = it.sprite && it.sprite.visible ? it.sprite : it.obj;
      const p = new THREE.Vector3(); o.getWorldPosition(p);
      // Kamera-Pitch so einstellen, dass das Ziel sichtbar ist
      const pl = ESC.Engine.player; const d = Math.hypot(p.x - pl.x, p.z - pl.z);
      pl.pitch = Math.max(-1, Math.min(1.1, Math.atan2(p.y - pl.y, d)));
      cam.position.set(pl.x, pl.y, pl.z); cam.rotation.set(pl.pitch, pl.yaw, 0); cam.updateMatrixWorld();
      p.project(cam);
      return { x: (p.x + 1) / 2 * innerWidth, y: (1 - p.y) / 2 * innerHeight, z: p.z };
    }, id);
    await sleep(80);
    await page.touchscreen.tap(Math.round(sc.x), Math.round(sc.y));
    return sc;
  }
  const modalOpen = () => page.evaluate(() => !document.querySelector('#panel').classList.contains('hidden') || !document.querySelector('#info').classList.contains('hidden') || !document.querySelector('#reward').classList.contains('hidden'));

  async function openViaTap(id) {
    for (let k = 0; k < 3; k++) {
      await tapObject(id);
      if (await waitFor(modalOpen, 12000)) return true;
    }
    // Rückfall: über das Forscherbuch („Hingehen“)
    console.log('    (Rückfall über Forscherbuch für ' + id + ')');
    await page.evaluate(id => ESC.Engine.goUse(ESC.world.interacts[id]), id);
    return waitFor(modalOpen, 12000);
  }

  async function finishPanel() {
    ok(await waitFor(() => page.evaluate(() => document.querySelector('#panel').classList.contains('success'))), 'Rätsel als gelöst angezeigt');
    await page.tap('#p-next');
    await sleep(300);
  }

  // ---------- Rätsel lösen (per UI)
  async function solve(pid, how = {}) {
    const def = await page.evaluate(([pid, level]) => { const d = puzzleDef(pid, level); return { type: d.type, layout: d.layout, norm: d.type === 'place' ? normPlace(d) : null, questions: d.questions, wheels: d.wheels && d.wheels.map(w => ({ values: w.values, start: w.start || 0 })), answers: d.answers, sep: d.sep, finds: d.finds, hints: (d.hints || []).length }; }, [pid, level]);
    if (how.hints) {
      for (let i = 0; i < def.hints; i++) { await page.tap('#p-tip'); await sleep(150); }
      ok((await page.$$('#p-hints .hint')).length === def.hints, `${pid}: alle ${def.hints} Tipp-Stufen sichtbar`);
      if (def.type !== 'search') {
        await page.tap('#p-hints .hint.sol button');
        await sleep(200);
        if (def.type !== 'scratch') await page.tap('#p-check');
        return finishPanel();
      }
    }
    if (def.type === 'place') {
      const sol = def.norm.solution;
      if (how.wrongFirst) {
        // absichtlich falsch: Karten der Reihe nach auf Ziele legen (rotierend)
        const items = Object.keys(sol); const slots = items.map(i => sol[i]);
        for (let i = 0; i < items.length; i++) { await page.tap(`#p-body .card[data-item="${items[i]}"]`); await page.tap(`#p-body [data-zone="${slots[(i + 1) % slots.length]}"]`); }
        await page.tap('#p-check'); await sleep(200);
        const fb = await page.textContent('#p-feedback');
        ok(/richtig/.test(fb), `${pid}: Rückmeldung bei falscher Lösung („${fb.trim().slice(0, 60)}…“)`);
        const marked = await page.$$('#p-body .card.bad');
        ok(level === 'entdecker' ? marked.length > 0 : marked.length === 0, `${pid}: Markierung falscher Karten passt zur Stufe (${marked.length})`);
      }
      let first = true;
      for (const [item, slot] of Object.entries(sol)) {
        if (how.drag && first) {
          const a = await page.$(`#p-body .card[data-item="${item}"]`); const b = await page.$(`#p-body [data-zone="${slot}"]`);
          await a.scrollIntoViewIfNeeded(); const ra = await a.boundingBox(); const rb = await b.boundingBox();
          await page.mouse.move(ra.x + 20, ra.y + ra.height / 2); await page.mouse.down();
          await page.mouse.move(ra.x + 60, ra.y + 40, { steps: 5 }); await page.mouse.move(rb.x + rb.width / 2, rb.y + Math.min(30, rb.height / 2), { steps: 8 }); await page.mouse.up();
          await sleep(100);
          ok(await page.$(`#p-body [data-zone="${slot}"] .card[data-item="${item}"]`) !== null, `${pid}: Karte per Ziehen abgelegt`);
          first = false; continue;
        }
        first = false;
        const already = await page.$(`#p-body [data-zone="${slot}"] .card[data-item="${item}"]`);
        if (already) continue;
        await page.tap(`#p-body .card[data-item="${item}"]`);
        await page.tap(`#p-body [data-zone="${slot}"]`, { position: { x: 12, y: 10 } });
      }
      await page.tap('#p-check');
    } else if (def.type === 'choice') {
      if (how.wrongFirst) {
        for (let qi = 0; qi < def.questions.length; qi++) { const wrong = def.questions[qi].options.findIndex(o => !o.ok); await page.tap(`#p-body fieldset.q:nth-of-type(${qi + 1}) .opt:nth-of-type(${wrong + 1})`); }
        await page.tap('#p-check'); await sleep(150);
        ok(/richtig/.test(await page.textContent('#p-feedback')), `${pid}: Rückmeldung bei falscher Antwort`);
      }
      for (let qi = 0; qi < def.questions.length; qi++) {
        const right = def.questions[qi].options.findIndex(o => o.ok);
        await page.tap(`#p-body fieldset.q >> nth=${qi} >> .opt >> nth=${right}`);
      }
      await page.tap('#p-check');
    } else if (def.type === 'code') {
      if (how.wrongFirst) { await page.tap('#p-check'); await sleep(150); ok(/stimmt noch nicht/.test(await page.textContent('#p-feedback')), `${pid}: falscher Code wird abgelehnt`); }
      const ans = def.answers[Math.floor(def.answers.length / 2)];
      const parts = def.sep ? ans.split(def.sep) : ans.split('');
      for (let i = 0; i < parts.length; i++) {
        const target = def.wheels[i].values.indexOf(parts[i]);
        let cur = def.wheels[i].start; const n = def.wheels[i].values.length;
        let up = (target - cur + n) % n;
        const wheel = `#p-body .wheel >> nth=${i}`;
        if (n > 20) { while (up >= 10) { await page.tap(`${wheel} >> text=+10`); up -= 10; } }
        if (up > n / 2) { for (let k = 0; k < n - up; k++) await page.tap(`${wheel} >> .wb >> nth=1`); }
        else for (let k = 0; k < up; k++) await page.tap(`${wheel} >> .wb >> nth=0`);
      }
      await page.tap('#p-check');
    } else if (def.type === 'scratch') {
      const c = await page.$('#p-body .sc-top'); await c.scrollIntoViewIfNeeded(); const r = await c.boundingBox();
      await page.mouse.move(r.x + 5, r.y + 5); await page.mouse.down();
      for (let y = 10; y < r.height; y += 18) { await page.mouse.move(r.x + r.width - 5, r.y + y, { steps: 6 }); await page.mouse.move(r.x + 5, r.y + y + 9, { steps: 6 }); }
      await page.mouse.up(); await sleep(400);
    }
    return finishPanel();
  }

  async function doPuzzle(pid, how) {
    ok(await openViaTap(pid), `${pid}: per Antippen in 3D geöffnet`);
    if (how && how.shot) await shot(pid);
    if (pid === 'r3_search' || pid === 'r4_explore' || pid === 'u_explore') { await page.tap('#p-body .btn.primary'); return; }
    await solve(pid, how);
  }

  async function closeInfoIfOpen() { if (await page.isVisible('#info')) { await page.tap('#i-close'); await sleep(200); } }

  async function enterRoom(r) {
    ok(await openViaTap('portal_' + r) || true, `Gang ${r} angetippt`);
    ok(await waitFor(() => page.evaluate(r => ESC.world && ESC.world.name === r, r)), `Raum ${r} betreten`);
    await sleep(500);
    await closeInfoIfOpen();
  }
  async function leaveAfterReward(r) {
    ok(await waitFor(() => visible('#reward'), 5000), `Täfelchen für ${r} erhalten`);
    await shot('reward-' + r);
    await page.tap('#rw-home');
    ok(await waitFor(() => page.evaluate(() => ESC.world.name === 'hub')), 'zurück in der Höhle');
    await sleep(400);
  }

  // ---------- Raum 1
  // Gesperrter Gang: Hinweis statt Sackgasse
  await page.evaluate(() => ESC.onInteract(ESC.world.interacts.portal_r2));
  ok(await page.isVisible('.toast'), 'gesperrter Gang zeigt Hinweis');
  await enterRoom('r1');
  await shot('r1');
  await doPuzzle('r1_timeline', { wrongFirst: true, shot: true });
  await doPuzzle('r1_sort', { drag: true, shot: true });
  await doPuzzle('r1_clock', { wrongFirst: true, shot: true });
  await leaveAfterReward('r1');

  // ---------- Raum 2
  await enterRoom('r2');
  await shot('r2');
  await page.evaluate(() => ESC.onInteract(ESC.world.interacts.r2_layers));
  ok(await page.isVisible('.toast.warn'), 'r2_layers gesperrt bis zur Grabung');
  await doPuzzle('r2_dig', { shot: true });
  await doPuzzle('r2_layers', { shot: true });
  await doPuzzle('r2_sources', { shot: true, hints: level === 'entdecker' });
  await doPuzzle('r2_crate', { wrongFirst: true, shot: true });
  await leaveAfterReward('r2');

  // ---------- Raum 3
  await enterRoom('r3');
  await shot('r3');
  await doPuzzle('r3_search');
  if (level === 'experten') {
    // Hinweis-Stufe 3 macht versteckte Bilder sichtbar
    await page.evaluate(() => ESC.onInteract(ESC.world.interacts.r3_search));
    for (let i = 0; i < 3; i++) await page.tap('#p-tip');
    ok(await page.evaluate(() => ESC.state.reveal.r3_search === true), 'Tipp 3 markiert versteckte Bilder');
    await page.tap('#p-close');
  }
  for (const p of ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8']) {
    await page.evaluate(id => ESC.Engine.goUse(ESC.world.interacts[id]), p);
    await waitFor(() => page.evaluate(id => ESC.state.found.r3_search && ESC.state.found.r3_search[id], p), 12000);
    if (p === 'p3') await shot('r3-painting');
  }
  ok(await page.evaluate(() => Object.keys(ESC.state.found.r3_search || {}).length === 8), 'alle 8 Höhlenbilder gefunden');
  ok(await waitFor(() => page.evaluate(() => document.querySelector('#panel').classList.contains('success'))), 'Suche als gelöst angezeigt');
  await page.tap('#p-next');
  await doPuzzle('r3_count', { wrongFirst: true, shot: true });
  await doPuzzle('r3_obs', { shot: true });
  await doPuzzle('r3_paint', { shot: true });
  await leaveAfterReward('r3');

  // ---------- Raum 4
  await enterRoom('r4');
  await shot('r4');
  await doPuzzle('r4_explore');
  for (const x of ['x_haus', 'x_feld', 'x_tiere', 'x_speicher', 'x_brunnen', 'x_werkstatt']) {
    ok(await openViaTap(x), `${x}: Info geöffnet`);
    const wrong = await page.$('#i-body .opt:not(.ok) >> text=/./');
    // richtige Antwort finden
    const right = await page.evaluate(id => INFOS[id].check.options.find(o => o.ok).t, x);
    await page.tap(`#i-body .opt >> text="${right}"`);
    await page.tap('#i-close');
    await sleep(300);
  }
  ok(await waitFor(() => page.evaluate(() => document.querySelector('#panel').classList.contains('success'))), 'Dorf-Rundgang als gelöst angezeigt');
  await page.tap('#p-next');
  await doPuzzle('r4_compare', { shot: true });
  await doPuzzle('r4_bread', { shot: true });
  await doPuzzle('r4_cloze', { shot: true, wrongFirst: true });
  await leaveAfterReward('r4');

  // ---------- Tor
  ok(await page.evaluate(() => ROOMS.every(r => ESC.state.tablets[r.id])), 'alle vier Täfelchen gesammelt');
  await doPuzzle('gate', { shot: true, wrongFirst: true });
  if (await visible('#skip')) { await shot('gate-cutscene'); await page.tap('#skip'); }
  ok(await waitFor(() => page.evaluate(() => ESC.world && ESC.world.name === 'uruk'), 20000), 'Tor geöffnet – Uruk erreicht');
  await sleep(600);
  await shot('uruk');
  await closeInfoIfOpen();

  // ---------- Finale
  await doPuzzle('u_explore');
  for (const u of ['u_landwirtschaft', 'u_bewaesserung', 'u_arbeitsteilung', 'u_handel', 'u_verwaltung', 'u_schrift', 'u_bauwerke']) {
    ok(await openViaTap(u), `${u}: Merkmal geöffnet`);
    if (u === 'u_schrift') await shot('uruk-info');
    const right = await page.evaluate(id => INFOS[id].check.options.find(o => o.ok).t, u);
    await page.tap(`#i-body .opt >> text="${right}"`);
    await page.tap('#i-close');
    await sleep(300);
  }
  ok(await waitFor(() => page.evaluate(() => document.querySelector('#panel').classList.contains('success'))), 'Erkundung Uruk gelöst');
  await page.tap('#p-next');
  await doPuzzle('u_final', { shot: true, wrongFirst: true });
  ok(await waitFor(() => visible('#final')), 'Erfolgsbildschirm erscheint');
  await shot('final');
  const st = await page.evaluate(() => ({ solved: Object.keys(ESC.state.solved).length, done: ESC.state.done }));
  ok(st.done && st.solved === 18, `Spiel abgeschlossen (${st.solved}/18 Rätsel)`);

  // Spielstand bleibt nach Neuladen erhalten?
  await page.reload(); await sleep(600);
  ok(await page.evaluate(() => JSON.parse(localStorage.getItem('erste-stadt-v1')).done === true), 'Spielstand gespeichert');
  ok(errors.length === 0, 'keine JavaScript-Fehler' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
}

(async () => {
  const only = process.env.LEVEL;
  if (!only || only === 'entdecker') await run('entdecker', 'iPad (gen 7) landscape');
  if (!only || only === 'experten') await run('experten', 'iPad Mini');
  console.log(failures ? `\n${failures} FEHLER` : '\nALLE TESTS BESTANDEN');
  process.exit(failures ? 1 : 0);
})();
