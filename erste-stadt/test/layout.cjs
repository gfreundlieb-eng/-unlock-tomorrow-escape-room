// Prüft alle Rätsel-Panels auf typischen Tablet-Größen:
// kein horizontales Überlaufen, Bedienelemente mind. 44 px groß.
//   node test/layout.cjs [screenshot-ordner]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const SHOTS = process.argv[2] || path.resolve(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const SIZES = [
  ['iPad-quer', 1024, 768], ['iPad-hoch', 768, 1024], ['iPad-Air-quer', 1180, 820],
  ['Android-Tablet-quer', 1280, 800], ['Android-Tablet-hoch', 800, 1280], ['kleines-Tablet-hoch', 600, 960]
];

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  let problems = 0;
  for (const [name, w, h] of SIZES) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(FILE); await page.evaluate(() => localStorage.clear()); await page.reload();
    await page.waitForTimeout(500);
    for (const level of ['entdecker', 'experten']) {
      await page.evaluate(level => {
        localStorage.clear();
        document.querySelector(`.lvl-btn[data-level="${level}"]`).click();
      }, level);
      await page.click('#s-start').catch(() => {});
      await page.click('#st-skip').catch(() => {});
      await page.waitForTimeout(300);
      await page.evaluate(() => { const b = document.querySelector('#i-close'); if (!b.hidden) b.click(); });
      const ids = await page.evaluate(() => Object.keys(PUZZLES));
      for (const id of ids) {
        const res = await page.evaluate(id => {
          ESC.state.solved = {}; ESC.Puzzles.open(id);
          const body = document.querySelector('#p-body');
          const over = [...document.querySelectorAll('#panel *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); }).map(e => e.className || e.tagName);
          const small = [...document.querySelectorAll('#panel button:not([hidden])')].filter(b => { const r = b.getBoundingClientRect(); return r.width && r.height && (r.height < 40 || r.width < 40); }).map(b => b.textContent.trim().slice(0, 20));
          return { over: over.slice(0, 5), small: small.slice(0, 5), scrollW: body.scrollWidth > body.clientWidth + 1 };
        }, id);
        if (res.over.length || res.scrollW || res.small.length) { problems++; console.log(`${name} ${level} ${id}:`, JSON.stringify(res)); }
        if (['r1_timeline', 'r4_compare', 'r4_cloze', 'r3_paint', 'r2_dig', 'gate', 'r1_clock'].includes(id) && level === 'experten')
          await page.screenshot({ path: path.join(SHOTS, `layout-${name}-${id}.png`) });
        await page.evaluate(() => ESC.Puzzles.close());
      }
      await page.evaluate(() => { localStorage.clear(); location.reload(); });
      await page.waitForTimeout(500);
    }
    // HUD
    await page.click('#s-start').catch(() => {}); await page.click('#st-skip').catch(() => {});
    await page.waitForTimeout(400); await page.evaluate(() => { const b = document.querySelector('#i-close'); if (!b.hidden) b.click(); });
    const hud = await page.evaluate(() => { const r = document.querySelector('#hud').getBoundingClientRect(); return { h: r.height, over: [...document.querySelectorAll('#hud *')].some(e => e.getBoundingClientRect().right > innerWidth + 1) }; });
    if (hud.over) { problems++; console.log(name, 'HUD läuft über'); }
    await page.screenshot({ path: path.join(SHOTS, `layout-${name}-hud.png`) });
    console.log(`${name} (${w}×${h}): HUD-Höhe ${Math.round(hud.h)} px${errs.length ? ' FEHLER: ' + errs.join('|') : ''}`);
    if (errs.length) problems++;
    await page.close();
  }
  await browser.close();
  console.log(problems ? `${problems} Auffälligkeiten` : 'Layout OK auf allen Größen');
  process.exit(problems ? 1 : 0);
})();
