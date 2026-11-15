// Baut das Spiel zu EINER eigenständigen HTML-Datei (index.html),
// die ohne Internet und ohne Server funktioniert.
//   node build.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const src = f => readFileSync(join(dir, 'src', f), 'utf8');

// three.js (MIT-Lizenz) liegt als ES-Modul in vendor/. Das abschließende
// export-Statement wird in ein Objekt umgewandelt, damit alles in einem
// normalen <script> läuft (auch per Doppelklick über file://).
const threePath = join(dir, 'vendor', 'three.module.min.js');
if (!existsSync(threePath)) throw new Error('vendor/three.module.min.js fehlt');
let three = readFileSync(threePath, 'utf8');
const m = three.match(/export\s*\{([^}]*)\};?\s*$/);
if (!m) throw new Error('export-Statement in three.js nicht gefunden');
const pairs = m[1].split(',').map(s => s.trim()).filter(Boolean).map(s => {
  const [local, , exported] = s.split(/\s+/);
  return `${exported || local}:${local}`;
});
three = three.slice(0, m.index) + `\nreturn {${pairs.join(',')}};`;
const threeWrapped = `const THREE = (function(){\n${three}\n})();`;

const js = [
  '"use strict";',
  threeWrapped,
  src('content.js'),
  src('art.js'),
  src('engine.js'),
  src('scenes.js'),
  src('puzzles.js'),
  src('main.js')
].join('\n;\n');

const html = src('shell.html')
  .replace('/*CSS*/', () => src('style.css'))
  .replace('/*JS*/', () => js.replace(/<\/script/gi, '<\\/script'));

writeFileSync(join(dir, 'index.html'), html);
console.log(`index.html geschrieben (${(html.length / 1024).toFixed(0)} KB)`);
