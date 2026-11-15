// =====================================================================
//  ART – prozedurale Grafiken (Canvas). Keine externen Bilddateien.
// =====================================================================

function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// deterministischer Zufall
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0; s ^= s >>> 13; return (s >>> 0) / 4294967296; }; }

// ---------- 3D-Value-Noise ----------
function hash3(x, y, z) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const s = t => t * t * (3 - 2 * t);
  const u = s(xf), v = s(yf), w = s(zf);
  const L = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz);
  return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v),
    L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w) * 2 - 1;
}
function fbm3(x, y, z) { return noise3(x, y, z) * 0.65 + noise3(x * 2.1, y * 2.1, z * 2.1) * 0.35; }

// ---------- Texturen ----------
function noiseTexture(base, vari, opts = {}) {
  const size = opts.size || 256, c = makeCanvas(size, size), g = c.getContext('2d');
  const r = rng(opts.seed || 7);
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  const n = opts.count || 900;
  for (let i = 0; i < n; i++) {
    const col = vari[Math.floor(r() * vari.length)];
    g.globalAlpha = (opts.alpha || 0.25) * (0.4 + r());
    g.fillStyle = col;
    const x = r() * size, y = r() * size, rad = (opts.min || 2) + r() * (opts.max || 14);
    g.beginPath();
    if (opts.streak) g.ellipse(x, y, rad * 3, rad * 0.5, 0, 0, Math.PI * 2);
    else g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
    // nahtlos: Ränder spiegeln
    if (x < 20 || y < 20) { g.beginPath(); g.arc(x + size, y + size, rad, 0, 7); g.arc(x + size, y, rad, 0, 7); g.arc(x, y + size, rad, 0, 7); g.fill(); }
  }
  g.globalAlpha = 1;
  if (opts.bricks) {
    g.strokeStyle = opts.bricks; g.lineWidth = 3;
    const bh = size / 8;
    for (let row = 0; row < 8; row++) {
      g.beginPath(); g.moveTo(0, row * bh); g.lineTo(size, row * bh); g.stroke();
      const off = row % 2 ? size / 8 : 0;
      for (let k = 0; k < 5; k++) { const x = off + k * size / 4; g.beginPath(); g.moveTo(x, row * bh); g.lineTo(x, row * bh + bh); g.stroke(); }
    }
  }
  if (opts.planks) {
    g.strokeStyle = opts.planks; g.lineWidth = 2;
    for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(0, k * size / 6); g.lineTo(size, k * size / 6); g.stroke(); }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
  return t;
}

function gradientTexture(stops) {
  const c = makeCanvas(4, 256), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256);
  stops.forEach(([p, col]) => gr.addColorStop(p, col));
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- Marker (schwebende Zeichen) ----------
const markerCache = {};
function markerTexture(kind, label) {
  const key = kind + (label || '');
  if (markerCache[key]) return markerCache[key];
  const c = makeCanvas(128, 128), g = c.getContext('2d');
  const colors = { todo: ['#ffd36b', '#5a3a00'], done: ['#79d98a', '#0d3b18'], info: ['#7cc4ff', '#08324f'], locked: ['#a8a29a', '#2b2723'], portal: ['#ffd36b', '#4a2a00'], search: ['#ffd36b', '#5a3a00'] };
  const [fill, ink] = colors[kind] || colors.todo;
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 10;
  g.fillStyle = fill; g.beginPath(); g.arc(64, 64, 50, 0, Math.PI * 2); g.fill();
  g.shadowBlur = 0; g.lineWidth = 6; g.strokeStyle = 'rgba(255,255,255,.85)'; g.stroke();
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'bold 64px system-ui, sans-serif';
  const sym = { todo: '!', done: '✓', info: 'i', locked: '', portal: label || '', search: '?' }[kind];
  if (kind === 'locked') {
    g.fillRect(42, 60, 44, 32); g.lineWidth = 8; g.strokeStyle = ink; g.beginPath(); g.arc(64, 58, 14, Math.PI, 0); g.stroke();
  } else g.fillText(sym, 64, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  markerCache[key] = t; return t;
}

function labelTexture(text, opts = {}) {
  const w = opts.w || 512, h = opts.h || 128, c = makeCanvas(w, h), g = c.getContext('2d');
  g.fillStyle = opts.bg || 'rgba(30,22,14,.85)';
  roundRect(g, 4, 4, w - 8, h - 8, 22); g.fill();
  g.strokeStyle = opts.border || '#d9b26a'; g.lineWidth = 5; g.stroke();
  g.fillStyle = opts.color || '#fbefd8'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${opts.size || 54}px system-ui, sans-serif`;
  g.fillText(text, w / 2, h / 2 + 3, w - 30);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

// ---------- Symbole der Täfelchen ----------
function drawSymbol(g, name, s, color) {
  g.save(); g.scale(s / 100, s / 100);
  g.fillStyle = color; g.strokeStyle = color; g.lineCap = 'round'; g.lineJoin = 'round';
  if (name === 'faustkeil') {
    g.beginPath(); g.moveTo(50, 6); g.bezierCurveTo(70, 26, 80, 50, 76, 70); g.bezierCurveTo(72, 88, 60, 94, 50, 94); g.bezierCurveTo(40, 94, 28, 88, 24, 70); g.bezierCurveTo(20, 50, 30, 26, 50, 6); g.closePath(); g.fill();
    g.globalCompositeOperation = 'destination-out'; g.lineWidth = 3.5;
    [[50, 14, 42, 40], [50, 14, 60, 42], [42, 40, 34, 66], [60, 42, 66, 66], [42, 40, 60, 42], [34, 66, 50, 84], [66, 66, 50, 84], [50, 60, 50, 84]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
  } else if (name === 'pinsel') {
    g.beginPath(); g.moveTo(66, 8); g.lineTo(90, 32); g.lineTo(52, 66); g.lineTo(36, 52); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(34, 54); g.lineTo(50, 70); g.bezierCurveTo(42, 86, 24, 94, 8, 92); g.bezierCurveTo(8, 76, 18, 60, 34, 54); g.closePath(); g.fill();
    g.globalCompositeOperation = 'destination-out'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(40, 66); g.lineTo(16, 86); g.moveTo(32, 62); g.lineTo(14, 78); g.stroke();
  } else if (name === 'pferd') {
    g.beginPath(); g.moveTo(26, 94); g.bezierCurveTo(24, 70, 28, 52, 38, 40); g.bezierCurveTo(32, 30, 32, 20, 36, 8); g.lineTo(46, 22); g.bezierCurveTo(54, 20, 62, 22, 68, 28); g.bezierCurveTo(78, 38, 90, 54, 92, 64); g.bezierCurveTo(93, 72, 86, 76, 78, 72); g.bezierCurveTo(72, 69, 66, 62, 60, 60); g.bezierCurveTo(58, 72, 62, 84, 66, 94); g.closePath(); g.fill();
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(62, 38, 4, 0, 7); g.fill();
  } else if (name === 'aehre') {
    g.lineWidth = 5; g.beginPath(); g.moveTo(50, 96); g.lineTo(50, 14); g.stroke();
    for (let i = 0; i < 6; i++) {
      const y = 20 + i * 12;
      g.save(); g.translate(50, y); g.rotate(-0.6); g.beginPath(); g.ellipse(-12, 0, 13, 6, 0, 0, 7); g.fill(); g.restore();
      g.save(); g.translate(50, y); g.rotate(0.6); g.beginPath(); g.ellipse(12, 0, 13, 6, 0, 0, 7); g.fill(); g.restore();
    }
    g.beginPath(); g.ellipse(50, 10, 6, 11, 0, 0, 7); g.fill();
    g.lineWidth = 2; g.beginPath(); g.moveTo(50, 0); g.lineTo(50, -6); g.stroke();
  }
  g.restore();
}
const symbolURLCache = {};
function symbolURL(name, color = '#3a2a1a', size = 128) {
  const key = name + color + size; if (symbolURLCache[key]) return symbolURLCache[key];
  const c = makeCanvas(size, size), g = c.getContext('2d');
  g.translate(size * 0.08, size * 0.08); drawSymbol(g, name, size * 0.84, color);
  return (symbolURLCache[key] = c.toDataURL());
}

// Steintäfelchen als Textur/Bild
function tabletCanvas(room, size = 256, glow = false) {
  const c = makeCanvas(size, size * 1.25), g = c.getContext('2d');
  const w = size, h = size * 1.25;
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#b9a88e'); gr.addColorStop(1, '#7c6a52');
  g.fillStyle = gr; roundRect(g, 6, 6, w - 12, h - 12, 26); g.fill();
  const r = rng(room.digit * 31 + 5);
  for (let i = 0; i < 160; i++) { g.globalAlpha = 0.12; g.fillStyle = r() > 0.5 ? '#3d3122' : '#efe3cf'; g.beginPath(); g.arc(r() * w, r() * h, 1 + r() * 5, 0, 7); g.fill(); }
  g.globalAlpha = 1; g.lineWidth = 6; g.strokeStyle = glow ? room.color : '#5a4a36'; roundRect(g, 6, 6, w - 12, h - 12, 26); g.stroke();
  g.save(); g.translate(w * 0.2, h * 0.08); drawSymbol(g, room.symbol, w * 0.6, '#3a2c1c'); g.restore();
  g.fillStyle = '#2d2216'; g.font = `bold ${w * 0.38}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String(room.digit), w / 2, h * 0.8);
  return c;
}

// ---------- Höhlenbilder (vereinfachte Nachzeichnungen) ----------
function drawPainting(kind, seed = 1) {
  const W = 512, H = 300, c = makeCanvas(W, H), g = c.getContext('2d');
  const r = rng(seed * 97 + 3);
  const shapes = [];
  const E = (x, y, rx, ry, rot = 0) => shapes.push(gg => { gg.beginPath(); gg.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); });
  const P = pts => shapes.push(gg => { gg.beginPath(); gg.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) gg.lineTo(pts[i][0], pts[i][1]); gg.closePath(); });
  const leg = (x, y, len, w, ang = 0) => P([[x - w, y], [x + w, y], [x + w * 0.45 + ang, y + len], [x - w * 0.45 + ang, y + len]]);
  let fill = '#b5602b', outline = '#1b1410', details = [];
  if (kind === 'horse' || kind === 'horse2') {
    fill = kind === 'horse' ? '#c98a3a' : '#9c4a22';
    E(240, 150, 120, 48); P([[318, 118], [350, 172], [418, 100], [392, 58]]); E(432, 84, 54, 21, 0.75); E(400, 66, 22, 18, 0);
    leg(165, 175, 85, 16, -6); leg(195, 180, 80, 13, 6); leg(300, 175, 85, 15, 4); leg(330, 170, 85, 12, 10);
    details = [gg => { gg.lineWidth = 10; gg.beginPath(); gg.moveTo(330, 112); gg.quadraticCurveTo(360, 78, 392, 72); gg.stroke(); },
      gg => { gg.lineWidth = 9; gg.beginPath(); gg.moveTo(122, 135); gg.quadraticCurveTo(95, 160, 100, 215); gg.stroke(); },
      gg => { gg.fillStyle = outline; gg.beginPath(); gg.ellipse(432, 84, 54, 21, 0.75, 0.3, 2.0); gg.fill(); gg.lineWidth = 7; gg.beginPath(); gg.moveTo(398, 50); gg.lineTo(392, 32); gg.stroke(); },
      gg => { gg.fillStyle = outline; [[165, 255], [200, 255], [305, 255], [342, 250]].forEach(([x, y]) => { gg.fillRect(x - 10, y - 18, 20, 14); }); }];
  } else if (kind === 'aurochs') {
    fill = 'rgba(160,70,35,.35)';
    E(230, 155, 140, 52); E(325, 128, 72, 58); E(425, 140, 34, 26, 0.3);
    leg(130, 180, 80, 20, -4); leg(165, 190, 72, 17, 8); leg(320, 170, 88, 20, 2); leg(355, 165, 85, 16, 10);
    details = [gg => { gg.lineWidth = 9; gg.beginPath(); gg.moveTo(420, 118); gg.bezierCurveTo(400, 70, 430, 50, 460, 64); gg.moveTo(436, 116); gg.bezierCurveTo(440, 80, 470, 70, 490, 86); gg.stroke(); },
      gg => { gg.lineWidth = 7; gg.beginPath(); gg.moveTo(92, 140); gg.quadraticCurveTo(70, 180, 80, 230); gg.stroke(); },
      gg => { gg.fillStyle = outline; gg.beginPath(); gg.ellipse(325, 112, 68, 34, 0, Math.PI, 0); gg.fill(); }];
  } else if (kind === 'deer') {
    fill = '#a8481f';
    E(230, 165, 105, 40); P([[305, 150], [325, 180], [395, 110], [378, 92]]); E(395, 98, 34, 15, 0.3);
    leg(160, 185, 90, 9, -8); leg(185, 190, 85, 8, 6); leg(285, 185, 92, 9, 4); leg(305, 180, 90, 8, 12);
    details = [gg => { gg.lineWidth = 6; gg.beginPath();
      const ant = (sx, sy, dir) => { gg.moveTo(sx, sy); gg.quadraticCurveTo(sx - 30 * dir, sy - 60, sx - 10 * dir, sy - 120); for (let k = 0; k < 4; k++) { const ty = sy - 30 - k * 24; gg.moveTo(sx - 18 * dir + k * 2, ty); gg.lineTo(sx + 14 * dir + k * 4, ty - 26); } };
      ant(385, 88, 1); ant(398, 86, -0.6); gg.stroke(); }];
  } else if (kind === 'bison') {
    fill = '#8f3417';
    E(220, 165, 120, 55); E(300, 135, 85, 75); E(375, 185, 38, 30, 0.4);
    leg(130, 190, 70, 20, -4); leg(165, 200, 62, 17, 8); leg(295, 195, 70, 22, 2); leg(330, 195, 66, 18, 10);
    details = [gg => { gg.lineWidth = 8; gg.beginPath(); gg.moveTo(380, 160); gg.quadraticCurveTo(400, 130, 392, 118); gg.moveTo(395, 172); gg.quadraticCurveTo(420, 150, 418, 132); gg.stroke(); },
      gg => { gg.fillStyle = outline; gg.beginPath(); gg.ellipse(300, 115, 82, 50, 0, Math.PI * 1.05, Math.PI * 1.95); gg.fill(); gg.beginPath(); gg.ellipse(368, 214, 18, 26, 0.2, 0, 7); gg.fill(); },
      gg => { gg.lineWidth = 7; gg.beginPath(); gg.moveTo(102, 150); gg.quadraticCurveTo(90, 175, 96, 205); gg.stroke(); }];
  }
  if (kind === 'signs') {
    g.fillStyle = '#9a2e14';
    for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(70 + i * 26, 70 + Math.sin(i) * 8, 9, 0, 7); g.fill(); }
    g.fillStyle = '#1b1410';
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(90 + i * 30, 250, 8, 0, 7); g.fill(); }
    g.strokeStyle = '#1b1410'; g.lineWidth = 7;
    g.strokeRect(300, 90, 150, 110);
    for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(300 + k * 37.5, 90); g.lineTo(300 + k * 37.5, 200); g.stroke(); }
    g.beginPath(); g.moveTo(300, 145); g.lineTo(450, 145); g.stroke();
    g.strokeStyle = '#c98a3a'; g.lineWidth = 9; g.beginPath(); g.moveTo(80, 140); g.lineTo(250, 130); g.moveTo(90, 175); g.lineTo(240, 185); g.stroke();
  } else {
    // Umriss (schwarz, etwas dicker)
    g.fillStyle = outline; g.strokeStyle = outline; g.lineWidth = 16; g.lineJoin = 'round';
    shapes.forEach(s => { s(g); g.fill(); g.stroke(); });
    // Füllung
    g.fillStyle = '#d8b48a'; shapes.forEach(s => { s(g); g.fill(); });
    g.fillStyle = fill; shapes.forEach(s => { s(g); g.fill(); });
    g.strokeStyle = outline; g.fillStyle = outline; g.lineCap = 'round';
    details.forEach(d => d(g));
  }
  // Verwitterung
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 700; i++) { g.globalAlpha = r() * 0.35; g.beginPath(); g.arc(r() * W, r() * H, 1 + r() * 4, 0, 7); g.fill(); }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  return c;
}

// ---------- Fundstücke ----------
function drawFind(g, id, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s / 100, s / 100);
  g.lineJoin = 'round'; g.lineCap = 'round';
  if (id === 'faustkeil') {
    g.fillStyle = '#6f6a62'; g.beginPath(); g.moveTo(50, 4); g.bezierCurveTo(72, 26, 80, 52, 74, 74); g.bezierCurveTo(68, 92, 32, 92, 26, 74); g.bezierCurveTo(20, 52, 28, 26, 50, 4); g.fill();
    g.strokeStyle = '#3b3833'; g.lineWidth = 3; [[50, 12, 40, 44], [50, 12, 62, 44], [40, 44, 32, 72], [62, 44, 68, 72], [40, 44, 62, 44], [32, 72, 50, 86], [68, 72, 50, 86]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
  } else if (id === 'nadel') {
    g.strokeStyle = '#e8dcc0'; g.lineWidth = 8; g.beginPath(); g.moveTo(12, 86); g.lineTo(88, 14); g.stroke();
    g.strokeStyle = '#a89878'; g.lineWidth = 2; g.beginPath(); g.moveTo(12, 86); g.lineTo(88, 14); g.stroke();
    g.fillStyle = '#5a4a36'; g.beginPath(); g.ellipse(80, 22, 4, 2, -0.8, 0, 7); g.fill();
  } else if (id === 'scherbe') {
    g.fillStyle = '#9c5a32'; g.beginPath(); g.moveTo(10, 30); g.lineTo(60, 12); g.lineTo(90, 40); g.lineTo(76, 86); g.lineTo(24, 80); g.closePath(); g.fill();
    g.strokeStyle = '#3c2214'; g.lineWidth = 4;
    for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(18, 40 + k * 12); g.bezierCurveTo(40, 28 + k * 12, 60, 54 + k * 12, 84, 44 + k * 12); g.stroke(); }
  } else if (id === 'muenze') {
    g.fillStyle = '#b08d3c'; g.beginPath(); g.arc(50, 50, 38, 0, 7); g.fill();
    g.strokeStyle = '#6d5520'; g.lineWidth = 4; g.beginPath(); g.arc(50, 50, 31, 0, 7); g.stroke();
    g.beginPath(); g.arc(50, 46, 12, 0, 7); g.moveTo(40, 64); g.quadraticCurveTo(50, 70, 60, 64); g.stroke();
  } else if (id === 'kronkorken') {
    g.fillStyle = '#c33a2e'; g.beginPath();
    for (let k = 0; k < 21; k++) { const a = k / 21 * Math.PI * 2; const rr = k % 2 ? 34 : 40; g.lineTo(50 + Math.cos(a) * rr, 50 + Math.sin(a) * rr); }
    g.closePath(); g.fill(); g.fillStyle = '#e9e1d0'; g.beginPath(); g.arc(50, 50, 22, 0, 7); g.fill();
  } else if (id === 'kohle') {
    g.fillStyle = '#1d1a18'; g.beginPath(); g.moveTo(14, 60); g.lineTo(40, 30); g.lineTo(80, 36); g.lineTo(88, 66); g.lineTo(50, 82); g.closePath(); g.fill();
    g.fillStyle = '#3a3532'; g.beginPath(); g.moveTo(40, 30); g.lineTo(60, 50); g.lineTo(80, 36); g.fill();
  } else if (id === 'ocker') {
    g.fillStyle = '#b5482a'; g.beginPath(); g.ellipse(34, 64, 26, 18, 0, 0, 7); g.fill();
    g.fillStyle = '#d9a33a'; g.beginPath(); g.ellipse(66, 56, 24, 17, 0, 0, 7); g.fill();
  } else if (id === 'lampe') {
    g.fillStyle = '#9a8a72'; g.beginPath(); g.ellipse(50, 66, 36, 16, 0, 0, 7); g.fill();
    g.fillStyle = '#5a4630'; g.beginPath(); g.ellipse(50, 60, 26, 8, 0, 0, 7); g.fill();
    g.fillStyle = '#ffb347'; g.beginPath(); g.moveTo(50, 20); g.quadraticCurveTo(66, 44, 50, 58); g.quadraticCurveTo(34, 44, 50, 20); g.fill();
    g.fillStyle = '#fff2b0'; g.beginPath(); g.ellipse(50, 48, 5, 9, 0, 0, 7); g.fill();
  } else if (id === 'knochen') {
    g.strokeStyle = '#e8dcc0'; g.lineWidth = 14; g.beginPath(); g.moveTo(20, 76); g.lineTo(80, 24); g.stroke();
    g.fillStyle = '#e8dcc0'; [[16, 72], [24, 82], [76, 18], [86, 28]].forEach(([a, b]) => { g.beginPath(); g.arc(a, b, 9, 0, 7); g.fill(); });
    g.fillStyle = '#5a4a36'; g.beginPath(); g.arc(80, 24, 4, 0, 7); g.fill();
  } else if (id === 'geruest') {
    g.strokeStyle = '#8a5a2e'; g.lineWidth = 8;
    [[20, 92, 30, 10], [80, 92, 70, 10], [24, 60, 76, 60], [28, 30, 72, 30]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); });
  } else if (id === 'feuerstein') {
    g.fillStyle = '#4c5a66'; g.beginPath(); g.moveTo(50, 6); g.lineTo(66, 60); g.lineTo(50, 94); g.lineTo(36, 60); g.closePath(); g.fill();
    g.strokeStyle = '#b8c6d0'; g.lineWidth = 2; g.beginPath(); g.moveTo(50, 10); g.lineTo(50, 90); g.stroke();
  }
  g.restore();
}
const findURLCache = {};
function findURL(id) {
  if (findURLCache[id]) return findURLCache[id];
  const c = makeCanvas(96, 96), g = c.getContext('2d'); drawFind(g, id, 4, 4, 88);
  return (findURLCache[id] = c.toDataURL());
}

// ---------- 24-Stunden-Zifferblatt fürs Zeitrad (ohne Lösung) ----------
function clockSVG() {
  let ticks = '';
  for (let i = 0; i < 24; i++) {
    const a = i * 15 * Math.PI / 180, big = i % 6 === 0;
    ticks += `<line x1="${50 + Math.sin(a) * (big ? 36 : 40)}" y1="${50 - Math.cos(a) * (big ? 36 : 40)}" x2="${50 + Math.sin(a) * 45}" y2="${50 - Math.cos(a) * 45}" stroke="#3a2a1a" stroke-width="${big ? 3 : 1.5}"/>`;
  }
  const lab = (t, a) => `<text x="${50 + Math.sin(a * Math.PI / 180) * 27}" y="${53 + -Math.cos(a * Math.PI / 180) * 27}" font-size="8" text-anchor="middle" fill="#3a2a1a" font-family="system-ui">${t}</text>`;
  return `<svg viewBox="0 0 100 100" class="clock" aria-hidden="true"><circle cx="50" cy="50" r="48" fill="#e9dcc2" stroke="#6b5235" stroke-width="3"/>${ticks}${lab('0/24 Uhr', 0)}${lab('6 Uhr', 90)}${lab('12 Uhr', 180)}${lab('18 Uhr', 270)}<circle cx="50" cy="50" r="3" fill="#3a2a1a"/></svg>`;
}
