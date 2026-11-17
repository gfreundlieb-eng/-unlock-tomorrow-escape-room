// Regressionstest: Beim Ziehen von Karten darf keine "Geisterkarte" hängen bleiben.
//   node test/dragghost.cjs
const { chromium, devices } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ ...devices['iPad (gen 7) landscape'] });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  let fails = 0;
  const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
  await page.goto(FILE); await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.click('#s-start'); await page.click('#st-skip'); await page.waitForTimeout(600);
  await page.evaluate(() => { const c = document.querySelector('#i-close'); if (c && !c.hidden) c.click(); });
  const cdp = await page.context().newCDPSession(page);
  const pts = {};
  const send = (type) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: Object.values(pts) });
  const down = async (id, x, y) => { pts[id] = { x, y, id }; await send('touchStart'); };
  const move = async (id, x, y) => { pts[id] = { x, y, id }; await send('touchMove'); };
  const up = async id => { delete pts[id]; await send('touchEnd'); };
  const cancelAll = async () => { for (const k in pts) delete pts[k]; await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }); };
  const ghosts = () => page.evaluate(() => document.querySelectorAll('.ghost').length);
  const center = async sel => page.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; }, sel);
  const openSort = async () => { await page.evaluate(() => { ESC.Puzzles.close(); ESC.Puzzles.open('r1_sort'); }); await page.waitForTimeout(150); };

  console.log('Fall 1: zwei Finger ziehen gleichzeitig zwei Karten');
  await openSort();
  let a = await center('#p-body .pool .card:nth-child(1)'), b = await center('#p-body .pool .card:nth-child(2)');
  await down(1, a.x, a.y); await move(1, a.x + 30, a.y + 40);
  await down(2, b.x, b.y); await move(2, b.x + 30, b.y + 40);
  await up(2); await up(1);
  await page.waitForTimeout(150);
  ok(await ghosts() === 0, `keine Geisterkarte nach Zwei-Finger-Ziehen (gefunden: ${await ghosts()})`);
  await page.evaluate(() => document.querySelectorAll('.ghost').forEach(g => g.remove()));

  console.log('Fall 2: Rätsel wird während des Ziehens geschlossen');
  await openSort();
  a = await center('#p-body .pool .card:nth-child(1)');
  await down(1, a.x, a.y); await move(1, a.x + 40, a.y + 40);
  await page.evaluate(() => ESC.Puzzles.close());
  await page.waitForTimeout(100);
  ok(await ghosts() === 0, `keine Geisterkarte nach Schließen mitten im Ziehen (gefunden: ${await ghosts()})`);
  await up(1);
  await page.evaluate(() => document.querySelectorAll('.ghost').forEach(g => g.remove()));

  console.log('Fall 3: System-Geste bricht die Berührung ab (touchcancel)');
  await openSort();
  a = await center('#p-body .pool .card:nth-child(1)');
  await down(1, a.x, a.y); await move(1, a.x + 40, a.y + 40);
  await cancelAll();
  await page.waitForTimeout(100);
  ok(await ghosts() === 0, `keine Geisterkarte nach Abbruch der Berührung (gefunden: ${await ghosts()})`);
  await page.evaluate(() => document.querySelectorAll('.ghost').forEach(g => g.remove()));

  console.log('Fall 4: Seite wird in den Hintergrund geschickt (App-Wechsel)');
  await openSort();
  a = await center('#p-body .pool .card:nth-child(1)');
  await down(1, a.x, a.y); await move(1, a.x + 40, a.y + 40);
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(100);
  ok(await ghosts() === 0, `keine Geisterkarte nach App-Wechsel (gefunden: ${await ghosts()})`);
  await page.evaluate(() => { delete document.visibilityState; delete document.hidden; });
  await up(1);
  await page.evaluate(() => document.querySelectorAll('.ghost').forEach(g => g.remove()));

  console.log('Fall 5: normales Ziehen funktioniert weiterhin');
  await openSort();
  const item = await page.evaluate(() => document.querySelector('#p-body .pool .card').dataset.item);
  a = await center(`#p-body .card[data-item="${item}"]`);
  const z = await center('#p-body [data-zone="alt"]');
  await down(1, a.x, a.y); await move(1, a.x + 20, a.y + 20); await move(1, z.x, z.y); await up(1);
  await page.waitForTimeout(150);
  ok(await page.$(`#p-body [data-zone="alt"] .card[data-item="${item}"]`) !== null, 'Karte landet per Ziehen im Korb');
  ok(await ghosts() === 0, 'danach keine Geisterkarte');
  ok(await page.evaluate(() => document.querySelectorAll('#p-body .card.dragging').length === 0), 'keine halbtransparente Karte übrig');

  console.log('Fall 6: Antippen (ohne Ziehen) funktioniert weiterhin');
  const it2 = await page.evaluate(() => document.querySelector('#p-body .pool .card').dataset.item);
  await page.tap(`#p-body .card[data-item="${it2}"]`);
  ok(await page.evaluate(id => document.querySelector(`#p-body .card[data-item="${id}"]`).classList.contains('sel'), it2), 'Antippen wählt Karte aus');
  await page.tap('#p-body [data-zone="jung"]', { position: { x: 12, y: 10 } });
  ok(await page.$(`#p-body [data-zone="jung"] .card[data-item="${it2}"]`) !== null, 'Tippen auf Korb legt Karte ab');

  ok(errors.length === 0, 'keine JavaScript-Fehler' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  console.log(fails ? `${fails} FEHLER` : 'DRAG-TEST BESTANDEN');
  process.exit(fails ? 1 : 0);
})();
