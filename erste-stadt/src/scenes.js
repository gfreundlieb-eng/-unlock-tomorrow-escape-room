// =====================================================================
//  SZENEN
// =====================================================================

function caveBase(w, opts) {
  const s = w.scene;
  const rockTex = noiseTexture(opts.rock || '#6d5d4c', opts.rockVar || ['#3a3027', '#8e7b64', '#54473a', '#a08c72'], { seed: opts.seed || 3, repeat: [6, 3], count: 1400, max: 10 });
  const shell = caveShell(opts.ax + 0.8, opts.ay, opts.az + 0.8, std('#ffffff', { map: rockTex, flatShading: true }), opts.amp || 0.12, opts.seed || 1);
  s.add(shell); walkable(w, shell);
  const floorTex = noiseTexture(opts.floor || '#5b4c3d', ['#3b3128', '#7a6752', '#4b3f33'], { seed: 11, repeat: [8, 8], count: 1500, max: 8 });
  const floor = mesh(new THREE.CircleGeometry(1, 64), lam('#ffffff', { map: floorTex }), 0, 0, 0, s);
  floor.scale.set(opts.ax + 1.2, opts.az + 1.2, 1); floor.rotation.x = -Math.PI / 2;
  walkable(w, floor);
  w.bounds = { type: 'ellipse', ax: opts.ax, az: opts.az };
  s.fog = new THREE.FogExp2(opts.fog || '#120d09', opts.fogD || 0.045);
  s.background = new THREE.Color(opts.fog || '#120d09');
  return { shell, floor };
}

function addTorches(w, list, lights = 2) {
  list.forEach(([x, y, z], i) => { const t = torch(x, y, z, w.scene, i < lights); w.updaters.push(tt => t.userData.update(tt)); });
}

function portalArch(w, x, z, yaw, color, label, scale = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; g.scale.setScalar(scale);
  const stone = std('#7b6a57', { flatShading: true });
  box(0.6, 3.2, 0.8, stone, -1.3, 1.6, 0, g); box(0.6, 3.2, 0.8, stone, 1.3, 1.6, 0, g); box(3.2, 0.6, 0.9, stone, 0, 3.3, 0, g);
  const hole = box(2.0, 3.0, 0.1, new THREE.MeshBasicMaterial({ color: '#050302' }), 0, 1.5, -0.3, g);
  const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  const glow = box(2.0, 3.0, 0.02, glowMat, 0, 1.5, -0.2, g);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.7), new THREE.MeshBasicMaterial({ map: labelTexture(label, { size: 48, w: 640 }), transparent: true }));
  sign.position.set(0, 4.1, 0.2); g.add(sign);
  w.scene.add(g);
  return { g, glow, glowMat, hole };
}

// ---------------------------------------------------------------- HUB
function buildHub(ctx) {
  const w = newWorld('hub');
  caveBase(w, { ax: 8.5, ay: 9, az: 12, seed: 2, fogD: 0.035 });
  const s = w.scene;
  s.add(new THREE.HemisphereLight('#c9a27a', '#2b1d12', 0.55));
  addTorches(w, [[-6.8, 2.2, -8], [6.8, 2.2, -8], [-7.5, 2.2, 1], [7.5, 2.2, 1], [0, 2.4, 10.4]], 3);

  // Lagerfeuer
  const fire = new THREE.Group(); fire.position.set(0, 0, 3); s.add(fire);
  for (let i = 0; i < 8; i++) rock(0.22, std('#5a4d40', { flatShading: true }), Math.cos(i / 8 * 6.28) * 0.6, 0.1, Math.sin(i / 8 * 6.28) * 0.6, fire, i);
  const fl = mesh(new THREE.ConeGeometry(0.35, 0.9, 8), new THREE.MeshBasicMaterial({ color: '#ff8c3a' }), 0, 0.45, 0, fire);
  const fl2 = mesh(new THREE.ConeGeometry(0.2, 0.6, 8), new THREE.MeshBasicMaterial({ color: '#ffe08a' }), 0, 0.35, 0, fire);
  const fireLight = new THREE.PointLight('#ff8a3a', 14, 16, 1.5); fireLight.position.set(0, 1, 0); fire.add(fireLight);
  w.updaters.push(t => { const f = 0.85 + 0.15 * Math.sin(t * 11) * Math.sin(t * 5.7); fl.scale.set(1, f, 1); fl2.scale.set(1, 1.2 - f * 0.3, 1); fireLight.intensity = 14 * f; });
  w.colliders.push({ x: 0, z: 3, r: 0.9 });

  // Stalagmiten & Felsen
  const st = std('#7a6853', { flatShading: true });
  [[-5, -2], [5.5, -3], [-4.5, 7], [4.8, 7.5], [-2.5, -6], [3, -6.5]].forEach(([x, z], i) => {
    mesh(new THREE.ConeGeometry(0.35 + (i % 3) * 0.12, 1.4 + (i % 2), 7), st, x, 0.7 + (i % 2) * 0.5, z, s);
    w.colliders.push({ x, z, r: 0.45 });
  });
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; rock(0.4 + (i % 3) * 0.25, st, Math.cos(a) * 7.6, 0.2, Math.sin(a) * 11, s, i); }

  // Tor
  const gate = new THREE.Group(); gate.position.set(0, 0, -9.4); gate.scale.setScalar(0.85); s.add(gate);
  const gs = std('#8a7962', { flatShading: true });
  box(1.4, 6, 1.6, gs, -3.4, 3, 0, gate); box(1.4, 6, 1.6, gs, 3.4, 3, 0, gate); box(8.4, 1.2, 1.8, gs, 0, 6.4, 0, gate);
  const doorMat = std('#6f604e', { map: noiseTexture('#6f604e', ['#4a3f33', '#8c7a63'], { seed: 21, count: 600 }) });
  const doorL = new THREE.Group(); doorL.position.set(-2.7, 0, 0.1); gate.add(doorL); box(2.7, 5.8, 0.5, doorMat, 1.35, 2.9, 0, doorL);
  const doorR = new THREE.Group(); doorR.position.set(2.7, 0, 0.1); gate.add(doorR); box(2.7, 5.8, 0.5, doorMat, -1.35, 2.9, 0, doorR);
  const light = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 5.8), new THREE.MeshBasicMaterial({ color: '#fff1c4' })); light.position.set(0, 2.9, -0.3); gate.add(light);
  // Mulden für Täfelchen
  const slots = [];
  ROOMS.forEach((r, i) => {
    const x = -1.95 + i * 1.3;
    const sl = box(0.9, 1.15, 0.12, std('#2e261e'), x, 3.4, 0.38, gate);
    const tab = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.0), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(tabletCanvas(r, 256, true)), transparent: true }));
    tab.material.map.colorSpace = THREE.SRGBColorSpace;
    tab.position.set(x, 3.4, 0.46); tab.visible = false; gate.add(tab);
    slots.push(tab);
  });
  const inscr = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.7), new THREE.MeshBasicMaterial({ map: labelTexture('Wer die Steinzeit versteht …', { w: 768, size: 50 }), transparent: true }));
  inscr.position.set(0, 1.9, 0.4); gate.add(inscr);
  w.colliders.push({ x: -2, z: -9.4, r: 1.3 }, { x: 0, z: -9.4, r: 1.3 }, { x: 2, z: -9.4, r: 1.3 });
  const gateIt = addInteract(w, gate, { id: 'gate', kind: 'gate', pos: { x: 0, z: -8.2 }, reach: 4.5, markerY: 6.4 });
  const gl = new THREE.PointLight('#ffcf8a', 22, 14, 1.4); gl.position.set(0, 4.5, -5.5); s.add(gl);
  const gl2 = new THREE.PointLight('#ffb070', 10, 8, 1.6); gl2.position.set(0, 2, -7.5); s.add(gl2);
  w.gate = { doorL, doorR, slots, light };

  // Portale
  const pdefs = [
    { id: 'r1', x: -7.4, z: -4.5, yaw: Math.PI / 2 - 0.35 },
    { id: 'r2', x: -7.6, z: 4.5, yaw: Math.PI / 2 + 0.25 },
    { id: 'r3', x: 7.6, z: 4.5, yaw: -Math.PI / 2 - 0.25 },
    { id: 'r4', x: 7.4, z: -4.5, yaw: -Math.PI / 2 + 0.35 }
  ];
  w.portals = {};
  pdefs.forEach((p, i) => {
    const room = ROOMS[i];
    const arch = portalArch(w, p.x, p.z, p.yaw, room.color, `${i + 1} · ${room.name.replace('Die ', '').replace('Das ', '')}`);
    const it = addInteract(w, arch.g, { id: 'portal_' + p.id, kind: 'portal', room: p.id, pos: { x: p.x * 0.88, z: p.z }, reach: 3.2, markerY: 4.6 });
    w.portals[p.id] = arch;
    w.colliders.push({ x: p.x, z: p.z, r: 1.2 });
  });

  // Hilfe-Stein am Eingang
  const helpStone = rock(0.6, std('#8a7a66', { flatShading: true }), 1.8, 0.45, 8.8, s, 4);
  addInteract(w, helpStone, { id: 'hub_help', kind: 'info', reach: 3, markerY: 1.8 });
  w.colliders.push({ x: 1.8, z: 8.8, r: 0.6 });

  w.spawn = { x: 0, z: 9.5, yaw: 0, pitch: 0.05 };
  w.refresh = (st) => {
    ROOMS.forEach((r, i) => {
      const a = w.portals[r.id];
      const open = ctx.roomUnlocked(r.id);
      a.glowMat.opacity = open ? 0.45 : 0.08;
      w.gate.slots[i].visible = !!st.tablets[r.id];
    });
    if (st.gateOpen) { w.gate.doorL.rotation.y = -1.4; w.gate.doorR.rotation.y = 1.4; }
  };
  return w;
}

// ---------------------------------------------------------------- RAUM 1
function buildRoom1(ctx) {
  const w = newWorld('r1');
  caveBase(w, { ax: 7, ay: 6, az: 10, seed: 5, rock: '#5c5a66', rockVar: ['#2e2d38', '#7d7a8a', '#45434f', '#9a96a6'], fog: '#0b0c14', fogD: 0.04 });
  const s = w.scene;
  s.add(new THREE.HemisphereLight('#9fb6ff', '#1a1520', 0.6));
  addTorches(w, [[-5.6, 2.2, 5], [5.6, 2.2, 5], [2.4, 2.2, -7.4]], 2);
  const blue = new THREE.PointLight('#6fa8ff', 10, 14, 1.5); blue.position.set(0, 3.5, -2); s.add(blue);

  // Kristalle
  const crys = new THREE.MeshBasicMaterial({ color: '#8fc4ff' });
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const c = mesh(new THREE.OctahedronGeometry(0.18 + (i % 3) * 0.08), crys, Math.cos(a) * 6.2, 0.3 + (i % 4) * 0.6, Math.sin(a) * 8.6, s); c.scale.y = 2; }

  // Zeitstrahl-Wand (links)
  const tl = new THREE.Group(); tl.position.set(-5.4, 0, -1); tl.rotation.y = Math.PI / 2; s.add(tl);
  box(9, 2.2, 0.4, std('#77736e', { flatShading: true }), 0, 1.5, -0.2, tl);
  const line = box(8.4, 0.12, 0.1, new THREE.MeshBasicMaterial({ color: '#8fc4ff' }), 0, 1.5, 0.05, tl);
  for (let i = 0; i < 7; i++) box(0.9, 0.9, 0.12, std('#3e3b44'), -3.6 + i * 1.2, 1.5, 0.02, tl);
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.6), new THREE.MeshBasicMaterial({ map: labelTexture('Zeitstrahl'), transparent: true })); lab.position.set(0, 2.9, 0.05); tl.add(lab);
  addInteract(w, tl, { id: 'r1_timeline', kind: 'puzzle', pos: { x: -4.6, z: -1 }, reach: 3.6, markerY: 3.6 });
  w.colliders.push({ x: -5.4, z: -3, r: 1 }, { x: -5.4, z: -1, r: 1 }, { x: -5.4, z: 1, r: 1 });
  w.timelineLine = line;

  // Zeitrad (Norden)
  const wheel = new THREE.Group(); wheel.position.set(0, 0, -6.2); wheel.scale.setScalar(0.8); s.add(wheel);
  box(1.0, 0.8, 1.0, std('#6c6672'), 0, 0.4, 0, wheel);
  const disk = cyl(2.0, 2.0, 0.35, std('#8e8a96', { flatShading: true }), 0, 2.8, 0, wheel, 32); disk.rotation.x = Math.PI / 2;
  const face = new THREE.Mesh(new THREE.CircleGeometry(1.75, 48), new THREE.MeshBasicMaterial({ map: (() => { const c = makeCanvas(256, 256), g = c.getContext('2d'); g.fillStyle = '#d9cdb4'; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill(); g.strokeStyle = '#3a2a1a'; for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; g.lineWidth = i % 6 ? 3 : 7; g.beginPath(); g.moveTo(128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100); g.lineTo(128 + Math.sin(a) * 120, 128 - Math.cos(a) * 120); g.stroke(); } g.font = 'bold 26px system-ui'; g.fillStyle = '#3a2a1a'; g.textAlign = 'center'; g.fillText('24', 128, 60); g.fillText('12', 128, 214); g.fillText('6', 200, 137); g.fillText('18', 58, 137); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })() }));
  face.position.set(0, 2.8, 0.19); wheel.add(face);
  const hand = box(0.08, 1.4, 0.04, new THREE.MeshBasicMaterial({ color: '#3a2a1a' }), 0, 0, 0.22, null); const handPivot = new THREE.Group(); handPivot.position.set(0, 2.8, 0); hand.position.set(0, 0.6, 0.22); handPivot.add(hand); wheel.add(handPivot);
  w.updaters.push(t => { handPivot.rotation.z = -t * 0.6; disk.rotation.y = t * 0.05; });
  addInteract(w, wheel, { id: 'r1_clock', kind: 'puzzle', pos: { x: 0, z: -5.6 }, reach: 3.8, markerY: 4.5 });
  w.colliders.push({ x: 0, z: -6.2, r: 1.1 });

  // Zwei Körbe (rechts)
  const baskets = new THREE.Group(); baskets.position.set(4.6, 0, -1.5); s.add(baskets);
  const wick = lam('#a07a45', { map: noiseTexture('#a07a45', ['#6e5028', '#c9a066'], { seed: 9, streak: true, count: 500 }) });
  cyl(0.65, 0.5, 0.8, wick, 0, 0.4, -0.9, baskets, 14); cyl(0.65, 0.5, 0.8, wick, 0, 0.4, 0.9, baskets, 14);
  const l1 = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.4), new THREE.MeshBasicMaterial({ map: labelTexture('Altsteinzeit', { size: 50 }), transparent: true, side: THREE.DoubleSide })); l1.position.set(-0.3, 1.2, -0.9); l1.rotation.y = -Math.PI / 2; baskets.add(l1);
  const l2 = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.4), new THREE.MeshBasicMaterial({ map: labelTexture('Jungsteinzeit', { size: 50 }), transparent: true, side: THREE.DoubleSide })); l2.position.set(-0.3, 1.2, 0.9); l2.rotation.y = -Math.PI / 2; baskets.add(l2);
  // Gegenstände daneben
  const flint = mesh(new THREE.TetrahedronGeometry(0.2), std('#666'), -0.8, 0.12, -0.2, baskets);
  const pot = cyl(0.18, 0.12, 0.35, lam('#9c5a32'), -0.8, 0.17, 0.4, baskets, 10);
  addInteract(w, baskets, { id: 'r1_sort', kind: 'puzzle', pos: { x: 4.3, z: -1.5 }, reach: 3.2, markerY: 2.2 });
  w.colliders.push({ x: 4.6, z: -2.4, r: 0.7 }, { x: 4.6, z: -0.6, r: 0.7 });

  // Infostein
  const info = box(1.0, 1.4, 0.3, std('#77736e', { flatShading: true }), 2.2, 0.7, 5.5, s); info.rotation.y = -0.4;
  addInteract(w, info, { id: 'r1_info', kind: 'info', reach: 3, markerY: 2 });
  w.colliders.push({ x: 2.2, z: 5.5, r: 0.6 });

  exitTunnel(w, 0, 9.4, Math.PI, 0.8);
  w.spawn = { x: 0, z: 6.8, yaw: 0 };
  w.refresh = st => { line.material.color.set(st.solved.r1_timeline ? '#ffd36b' : '#8fc4ff'); };
  return w;
}

function exitTunnel(w, x, z, yaw, scale = 1) {
  const a = portalArch(w, x, z, yaw, '#ffd36b', 'Zurück zur Höhle', scale);
  addInteract(w, a.g, { id: 'exit', kind: 'exit', pos: { x: x * 0.9, z: z - 1.2 * Math.sign(z) }, reach: 3, markerY: 4.6, marker: false });
  w.colliders.push({ x, z, r: 1.1 });
}

// ---------------------------------------------------------------- RAUM 2
function outdoorBase(w, opts) {
  const s = w.scene;
  s.background = gradientTexture(opts.sky || [[0, '#5d86b8'], [0.55, '#c9dbe8'], [1, '#e9e2cf']]);
  s.fog = new THREE.Fog(opts.fogColor || '#d8d6c8', opts.fogNear || 25, opts.fogFar || 80);
  const gtex = noiseTexture(opts.ground || '#6f8a3e', opts.groundVar || ['#5a7533', '#8aa152', '#7b6a3e'], { seed: 13, repeat: [opts.size / 4, opts.size / 4], count: 1600, max: 9 });
  const ground = mesh(new THREE.PlaneGeometry(opts.size * 3, opts.size * 3), lam('#ffffff', { map: gtex }), 0, 0, 0, s);
  gtex.repeat.set(opts.size * 0.75, opts.size * 0.75);
  ground.rotation.x = -Math.PI / 2; walkable(w, ground);
  const sun = new THREE.DirectionalLight(opts.sunColor || '#fff2d8', opts.sun || 2.4); sun.position.set(20, 30, 10); s.add(sun);
  s.add(new THREE.HemisphereLight(opts.skyLight || '#cfe3ff', opts.groundLight || '#6b5a3a', opts.hemi || 1.1));
  const half = opts.size / 2;
  w.bounds = { type: 'rect', minX: -half, maxX: half, minZ: -half, maxZ: half };
  return ground;
}

function buildRoom2(ctx) {
  const w = newWorld('r2');
  outdoorBase(w, { size: 24, sky: [[0, '#3c4f7a'], [0.5, '#e7a96b'], [1, '#f2d7a8']], fogColor: '#e6c49a', fogNear: 18, fogFar: 60, sun: 2.0, sunColor: '#ffd2a0', hemi: 0.9 });
  const s = w.scene;
  // Hügel & Bäume
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const h = sph(8, lam('#6a7a3c'), Math.cos(a) * 30, -4, Math.sin(a) * 30, s, 16); h.scale.y = 0.6; }
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2 + 0.2; tree(Math.cos(a) * (15 + (i % 4)), Math.sin(a) * (15 + (i % 3)), s, 0.9 + (i % 3) * 0.2, i % 2 ? 'nadel' : 'laub'); }

  // Zelt
  const tent = new THREE.Group(); tent.position.set(-6, 0, -4); s.add(tent);
  const tm = mesh(new THREE.ConeGeometry(2.4, 3.0, 4), lam('#c9b48a', { flatShading: true }), 0, 1.5, 0, tent); tm.rotation.y = Math.PI / 4;
  box(0.9, 1.5, 0.05, lam('#3a2c1e'), 0, 0.75, 1.72, tent);
  w.colliders.push({ x: -6, z: -4, r: 2.2 });

  // Grabungsschnitt
  const dig = new THREE.Group(); dig.position.set(0, 0, -5); s.add(dig);
  const soil = noiseTexture('#7a5a3a', ['#5a3f28', '#9a7650', '#4a3424'], { seed: 31, count: 900 });
  box(5, 0.08, 4, lam('#ffffff', { map: soil }), 0, 0.02, 0, dig);
  box(5, 1.6, 0.1, lam('#ffffff', { map: soil }), 0, -0.6, -2, dig);
  const peg = lam('#d8c7a0'), str = new THREE.MeshBasicMaterial({ color: '#f4f0e4' });
  for (const [x, z] of [[-2.5, -2], [2.5, -2], [-2.5, 2], [2.5, 2]]) cyl(0.04, 0.04, 0.6, peg, x, 0.3, z, dig, 5);
  for (let i = 0; i <= 5; i++) box(0.015, 0.015, 4, str, -2.5 + i, 0.35, 0, dig);
  for (let i = 0; i <= 4; i++) box(5, 0.015, 0.015, str, 0, 0.35, -2 + i, dig);
  // Profilwand (aufgestellt)
  const prof = new THREE.Group(); prof.position.set(0, 0, -7.4); s.add(prof);
  const pc = makeCanvas(256, 256), pg = pc.getContext('2d');
  ['#9a7650', '#7d5a38', '#6a4a2e', '#5a3d26', '#47301f'].forEach((c, i) => { pg.fillStyle = c; pg.fillRect(0, i * 51.2, 256, 52); });
  const ptex = new THREE.CanvasTexture(pc); ptex.colorSpace = THREE.SRGBColorSpace;
  box(5, 2.6, 0.3, lam('#ffffff', { map: ptex }), 0, 1.3, 0, prof);
  addInteract(w, dig, { id: 'r2_dig', kind: 'puzzle', pos: { x: -1.2, z: -4.2 }, reach: 3.6, markerY: 2.2 });
  // Profiltafel
  const board = new THREE.Group(); board.position.set(3.8, 0, -6.5); board.rotation.y = -0.5; s.add(board);
  cyl(0.05, 0.05, 1.8, lam('#7a5530'), -0.7, 0.9, 0, board, 5); cyl(0.05, 0.05, 1.8, lam('#7a5530'), 0.7, 0.9, 0, board, 5);
  const bt = makeCanvas(256, 200), bg = bt.getContext('2d'); bg.fillStyle = '#efe6d2'; bg.fillRect(0, 0, 256, 200);
  ['#9a7650', '#7d5a38', '#6a4a2e', '#5a3d26', '#47301f'].forEach((c, i) => { bg.fillStyle = c; bg.fillRect(20, 40 + i * 30, 216, 28); });
  bg.fillStyle = '#2d2216'; bg.font = 'bold 26px system-ui'; bg.textAlign = 'center'; bg.fillText('Profiltafel', 128, 30);
  const btex = new THREE.CanvasTexture(bt); btex.colorSpace = THREE.SRGBColorSpace;
  box(1.7, 1.3, 0.06, lam('#ffffff', { map: btex }), 0, 1.4, 0, board);
  addInteract(w, board, { id: 'r2_layers', kind: 'puzzle', reach: 3.2, markerY: 2.6 });
  w.colliders.push({ x: 0, z: -5, r: 2.2 }, { x: -1.6, z: -5, r: 1.6 }, { x: 1.6, z: -5, r: 1.6 }, { x: 0, z: -7.4, r: 1.5 }, { x: 3.8, z: -6.5, r: 0.7 });

  // Fundtisch
  const table = new THREE.Group(); table.position.set(5, 0, -1); table.rotation.y = -0.3; s.add(table);
  const wood = lam('#8a6038', { map: noiseTexture('#8a6038', ['#6a4428', '#a77a4c'], { seed: 41, streak: true, planks: '#5a3a20' }) });
  box(2.6, 0.08, 1.2, wood, 0, 0.95, 0, table);
  for (const [x, z] of [[-1.2, -0.5], [1.2, -0.5], [-1.2, 0.5], [1.2, 0.5]]) box(0.08, 0.95, 0.08, wood, x, 0.47, z, table);
  mesh(new THREE.TetrahedronGeometry(0.15), std('#666'), -0.8, 1.08, 0, table);
  cyl(0.06, 0.06, 0.03, lam('#c99a3a'), -0.3, 1.0, 0.2, table, 6);
  box(0.4, 0.3, 0.3, lam('#c9b48a'), 0.3, 1.14, -0.2, table);
  const house = new THREE.Group(); house.position.set(0.9, 1.0, 0.1); table.add(house); box(0.4, 0.15, 0.2, lam('#b08a5a'), 0, 0.08, 0, house); const hr = gableRoof(0.4, 0.26, 0.14, lam('#c9a85a')); hr.rotation.y = Math.PI / 2; hr.position.y = 0.15; house.add(hr);
  const lamp = new THREE.PointLight('#ffcf8a', 6, 8, 1.6); lamp.position.set(0, 1.8, 0); table.add(lamp);
  addInteract(w, table, { id: 'r2_sources', kind: 'puzzle', reach: 3.2, markerY: 2.2 });
  w.colliders.push({ x: 5, z: -1, r: 1.4 });

  // Kiste
  const crate = new THREE.Group(); crate.position.set(3.2, 0, 3.4); crate.rotation.y = 0.4; s.add(crate);
  box(1.3, 0.8, 0.9, wood, 0, 0.4, 0, crate);
  box(0.25, 0.3, 0.06, std('#555', { metalness: 0.5, roughness: 0.4 }), 0, 0.55, 0.48, crate);
  box(0.6, 0.02, 0.4, lam('#f2ead8'), 0.1, 0.81, 0, crate);
  addInteract(w, crate, { id: 'r2_crate', kind: 'puzzle', reach: 3, markerY: 1.8 });
  w.colliders.push({ x: 3.2, z: 3.4, r: 0.9 });

  // Notizbuch auf Baumstumpf
  const stump = cyl(0.4, 0.45, 0.6, wood, -3.2, 0.3, 2.4, s, 10);
  box(0.4, 0.06, 0.3, lam('#6a2a20'), -3.2, 0.63, 2.4, s);
  addInteract(w, stump, { id: 'r2_info', kind: 'info', reach: 3, markerY: 1.6 });
  w.colliders.push({ x: -3.2, z: 2.4, r: 0.5 });

  // Rückweg: Höhleneingang
  const cave = new THREE.Group(); cave.position.set(0, 0, 10.5); s.add(cave);
  const dome = sph(3.2, std('#6d5d4c', { flatShading: true }), 0, 0, 0.8, cave, 10); dome.scale.set(1.3, 1, 0.8);
  const holeM = new THREE.Mesh(new THREE.CircleGeometry(1.3, 16, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#050302' })); holeM.position.set(0, 0.01, -1.7); holeM.scale.y = 1.8; cave.add(holeM);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.5), new THREE.MeshBasicMaterial({ map: labelTexture('Zurück zur Höhle'), transparent: true })); sign.position.set(0, 3.0, -1.9); sign.rotation.y = Math.PI; sign.rotation.y = 0; cave.add(sign);
  addInteract(w, cave, { id: 'exit', kind: 'exit', pos: { x: 0, z: 8.6 }, reach: 2.6, marker: false });
  w.colliders.push({ x: 0, z: 11, r: 3 });
  w.spawn = { x: 0, z: 7, yaw: 0 };
  w.bounds = { type: 'rect', minX: -11, maxX: 11, minZ: -10, maxZ: 8.5 };
  return w;
}

// ---------------------------------------------------------------- RAUM 3 (Lascaux)
function buildRoom3(ctx) {
  const w = newWorld('r3');
  caveBase(w, { ax: 4.6, ay: 4.4, az: 14, seed: 9, amp: 0.07, rock: '#b49a78', rockVar: ['#8a7356', '#d2bc98', '#9e8566', '#c7ad86'], fog: '#050302', fogD: 0.055 });
  const s = w.scene;
  s.add(new THREE.AmbientLight('#4a3a2a', 0.35));
  // Fackel in der Hand (folgt der Kamera)
  const hand = new THREE.PointLight('#ffb070', 16, 11, 1.4); hand.position.set(0.3, 0.1, -0.4);
  w.camLight = hand;
  w.updaters.push(t => { hand.intensity = 16 * (0.9 + 0.1 * Math.sin(t * 12) * Math.sin(t * 7.1)); });
  // Fackel-Mesh unten rechts im Bild
  const tg = new THREE.Group(); tg.position.set(0.42, -0.42, -0.75); tg.rotation.z = -0.25;
  cyl(0.014, 0.018, 0.34, lam('#5a3c22'), 0, -0.08, 0, tg, 6);
  const fl = mesh(new THREE.ConeGeometry(0.035, 0.12, 8), new THREE.MeshBasicMaterial({ color: '#ffb347', fog: false }), 0, 0.14, 0, tg);
  mesh(new THREE.ConeGeometry(0.018, 0.07, 8), new THREE.MeshBasicMaterial({ color: '#fff2b0', fog: false }), 0, 0.12, 0, tg);
  w.camExtra = tg;
  w.updaters.push(t => { fl.scale.y = 0.85 + 0.2 * Math.sin(t * 15); });

  // Höhlenbilder
  const spots = [
    { id: 'p1', side: -1, z: 9, y: 1.7 }, { id: 'p2', side: 1, z: 6.5, y: 2.0 },
    { id: 'p3', side: -1, z: 3, y: 2.2 }, { id: 'p4', side: 1, z: 0.5, y: 1.6 },
    { id: 'p5', side: -1, z: -3.5, y: 1.4 }, { id: 'p6', side: 1, z: -6, y: 2.0 },
    { id: 'p7', ceil: true, z: -1.5 }, { id: 'p8', ceil: true, z: -9.5 }
  ];
  w.paintings = {};
  spots.forEach((sp, i) => {
    const def = PAINTINGS[sp.id];
    const tex = new THREE.CanvasTexture(drawPainting(def.kind, i + 1)); tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), mat);
    const A = 5.4, B = 4.4, C = 14.8;
    let P;
    if (sp.ceil) P = new THREE.Vector3(0, B * Math.sqrt(1 - (sp.z / C) ** 2), sp.z);
    else P = new THREE.Vector3(sp.side * A * Math.sqrt(Math.max(0.05, 1 - (sp.y / B) ** 2 - (sp.z / C) ** 2)), sp.y, sp.z);
    const n = new THREE.Vector3(-P.x / (A * A), -P.y / (B * B), -P.z / (C * C)).normalize();
    pl.position.copy(P).addScaledVector(n, sp.ceil ? 0.6 : 0.5);
    if (sp.ceil) { pl.up.set(0, 0, -1); }
    pl.lookAt(pl.position.clone().add(n));
    if (sp.ceil) pl.scale.set(1.2, 1.2, 1);
    s.add(pl);
    const pos = sp.ceil ? { x: 0, z: sp.z } : { x: pl.position.x * 0.45, z: sp.z };
    addInteract(w, pl, { id: sp.id, kind: 'painting', pos, reach: 3.4, markerY: sp.ceil ? pl.position.y - 0.9 : sp.y + 1.1, searchOf: 'r3_search' });
    w.paintings[sp.id] = pl;
  });

  // Eingang: Forscher-Notizen (r3_search Start + r3_count)
  const stoneA = rock(0.7, std('#9e8566', { flatShading: true }), -1.8, 0.4, 11.2, s, 3);
  addInteract(w, stoneA, { id: 'r3_search', kind: 'puzzle', reach: 3, markerY: 1.8 });
  const stoneB = rock(0.7, std('#9e8566', { flatShading: true }), 1.9, 0.4, 11.0, s, 5);
  addInteract(w, stoneB, { id: 'r3_count', kind: 'puzzle', reach: 3, markerY: 1.8 });
  w.colliders.push({ x: -1.8, z: 11.2, r: 0.7 }, { x: 1.9, z: 11, r: 0.7 });
  // Steinplatte mit Notizen (r3_obs)
  const slab = box(1.6, 0.25, 1.0, std('#8a7356', { flatShading: true }), 1.4, 0.5, -3.5, s);
  box(0.5, 0.02, 0.35, lam('#efe6d2'), 1.2, 0.64, -3.5, s);
  addInteract(w, slab, { id: 'r3_obs', kind: 'puzzle', reach: 3, markerY: 1.6 });
  w.colliders.push({ x: 1.4, z: -3.5, r: 0.9 });
  // Farbwerkstatt (r3_paint)
  const ws = new THREE.Group(); ws.position.set(-1.2, 0, -11); s.add(ws);
  box(1.8, 0.3, 1.0, std('#8a7356', { flatShading: true }), 0, 0.3, 0, ws);
  sph(0.18, lam('#b5482a'), -0.5, 0.5, 0, ws, 8).scale.y = 0.5; sph(0.18, lam('#d9a33a'), 0, 0.5, 0, ws, 8).scale.y = 0.5; sph(0.18, lam('#1d1a18'), 0.5, 0.5, 0, ws, 8).scale.y = 0.5;
  const sl = cyl(0.16, 0.12, 0.08, lam('#9a8a72'), 0.2, 0.5, 0.35, ws, 10);
  const lampFl = mesh(new THREE.ConeGeometry(0.04, 0.12, 6), new THREE.MeshBasicMaterial({ color: '#ffb347' }), 0.2, 0.6, 0.35, ws);
  const wl = new THREE.PointLight('#ffa050', 4, 5, 1.6); wl.position.set(0.2, 0.9, 0.35); ws.add(wl);
  addInteract(w, ws, { id: 'r3_paint', kind: 'puzzle', reach: 3, markerY: 1.6 });
  w.colliders.push({ x: -1.2, z: -11, r: 1.0 });
  // Infotafel
  const plaque = box(0.9, 1.2, 0.2, std('#a08c72'), 3.2, 0.6, 9.5, s); plaque.rotation.y = -1.2;
  addInteract(w, plaque, { id: 'r3_info', kind: 'info', reach: 3, markerY: 1.8 });
  w.colliders.push({ x: 3.2, z: 9.5, r: 0.5 });

  exitTunnel(w, 0, 12.9, Math.PI, 0.6);
  w.spawn = { x: 0, z: 10.5, yaw: 0 };
  w.eyeHeight = 1.55;
  return w;
}

// ---------------------------------------------------------------- RAUM 4 (Dorf)
function longhouse(parent, x, z, rot, len = 12) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; parent.add(g);
  const clay = lam('#ffffff', { map: noiseTexture('#a5814f', ['#8a6a3c', '#c19a62', '#7a5a34'], { seed: 51, count: 700 }) });
  box(len, 2.2, 5, clay, 0, 1.1, 0, g);
  const roofMat = lam('#ffffff', { map: noiseTexture('#b8994a', ['#8f7334', '#d1b462', '#a0823c'], { seed: 52, streak: true, count: 1200 }) });
  const roof = gableRoof(len + 0.8, 6.2, 3.0, roofMat); roof.rotation.y = Math.PI / 2; roof.position.y = 2.2; g.add(roof);
  box(1.0, 1.7, 0.05, lam('#3a2c1e'), len / 2 - 0.02 + 0.03, 0.85, 0, g).rotation.y = Math.PI / 2;
  return g;
}
function fence(parent, x0, z0, w, d) {
  const m = lam('#7a5530');
  const post = (x, z) => cyl(0.05, 0.06, 1.1, m, x, 0.55, z, parent, 5);
  for (let i = 0; i <= w; i++) { post(x0 + i, z0); post(x0 + i, z0 + d); }
  for (let i = 0; i <= d; i++) { post(x0, z0 + i); post(x0 + w, z0 + i); }
  [0.45, 0.9].forEach(y => { box(w, 0.05, 0.05, m, x0 + w / 2, y, z0, parent); box(w, 0.05, 0.05, m, x0 + w / 2, y, z0 + d, parent); box(0.05, 0.05, d, m, x0, y, z0 + d / 2, parent); box(0.05, 0.05, d, m, x0 + w, y, z0 + d / 2, parent); });
}

function grainField(parent, x, z, w, d, n, color = '#d8b84a') {
  const geo = new THREE.BoxGeometry(0.05, 0.9, 0.05); geo.translate(0, 0.45, 0);
  const im = new THREE.InstancedMesh(geo, lam(color), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const r = rng(Math.floor(x * 7 + z * 13 + 99));
  for (let i = 0; i < n; i++) {
    e.set((r() - 0.5) * 0.3, 0, (r() - 0.5) * 0.3); q.setFromEuler(e);
    m.compose(new THREE.Vector3(x + (r() - 0.5) * w, 0, z + (r() - 0.5) * d), q, new THREE.Vector3(1, 0.7 + r() * 0.5, 1));
    im.setMatrixAt(i, m);
  }
  parent.add(im); return im;
}

function buildRoom4(ctx) {
  const w = newWorld('r4');
  outdoorBase(w, { size: 36, sun: 2.6 });
  const s = w.scene;
  for (let i = 0; i < 46; i++) { const a = i / 46 * Math.PI * 2; tree(Math.cos(a) * (21 + (i % 5)), Math.sin(a) * (21 + (i % 4)), s, 1 + (i % 3) * 0.25, 'laub'); }

  const h1 = longhouse(s, -6, -6, 0.15, 13);
  const h2 = longhouse(s, 7, -9, -0.1, 11);
  w.colliders.push({ x: -10.5, z: -5.2, r: 2.6 }, { x: -6, z: -6, r: 2.8 }, { x: -1.5, z: -6.8, r: 2.6 }, { x: 3.5, z: -8.6, r: 2.6 }, { x: 7, z: -9, r: 2.8 }, { x: 10.5, z: -9.4, r: 2.6 });
  const xHaus = new THREE.Object3D(); xHaus.position.set(-6, 0, -3.2); s.add(xHaus);
  addInteract(w, h1, { id: 'x_haus', kind: 'explore', pos: { x: -6, z: -2.6 }, reach: 3.6, markerY: 6.0 });

  // Feld
  const fieldGround = box(10, 0.04, 7, lam('#6a4e2e'), 8, 0.02, 6, s);
  grainField(s, 8, 6, 9.5, 6.5, 900);
  addInteract(w, fieldGround, { id: 'x_feld', kind: 'explore', pos: { x: 8, z: 2.2 }, reach: 3.4, markerY: 2.4 });
  w.colliders.push({ x: 5, z: 6, r: 2.6 }, { x: 8, z: 6, r: 2.6 }, { x: 11, z: 6, r: 2.6 });

  // Tierpferch
  const pen = new THREE.Group(); s.add(pen);
  fence(pen, -12, 4, 6, 5);
  const animals = [quadruped('#7a5a3a', { len: 1.6, h: 0.9, horns: true }), quadruped('#e8e0d0', { len: 1.0, h: 0.55, wool: true }), quadruped('#8a7a62', { len: 0.9, h: 0.55, horns: true }), quadruped('#c99a8a', { len: 1.0, h: 0.5, headColor: '#d4a898' })];
  animals.forEach((a, i) => { a.position.set(-10.5 + (i % 2) * 2.6, 0, 5.4 + Math.floor(i / 2) * 2.2); a.rotation.y = i * 1.3; pen.add(a); });
  w.updaters.push(t => animals.forEach((a, i) => { a.rotation.y = i * 1.3 + Math.sin(t * 0.3 + i) * 0.6; }));
  addInteract(w, pen, { id: 'x_tiere', kind: 'explore', pos: { x: -9, z: 3.2 }, reach: 3.2, markerY: 2.4 });
  w.colliders.push({ x: -9, z: 6.5, r: 3.2 });

  // Vorratsgefäße
  const store = new THREE.Group(); store.position.set(-1.2, 0, -2.6); s.add(store);
  const potM = lam('#9c5a32');
  [[0, 0], [0.7, 0.3], [-0.6, 0.4], [0.2, 0.9]].forEach(([x, z], i) => { const p = sph(0.4 + i * 0.05, potM, x, 0.35, z, store, 12); p.scale.y = 1.2; });
  addInteract(w, store, { id: 'x_speicher', kind: 'explore', reach: 3, markerY: 1.9 });
  w.colliders.push({ x: -1, z: -2.2, r: 1.0 });

  // Brunnen
  const well = new THREE.Group(); well.position.set(1.5, 0, 3.5); s.add(well);
  const wm = lam('#7a5530');
  for (let i = 0; i < 4; i++) { const b = box(1.6, 0.6, 0.15, wm, 0, 0.3, 0, well); b.rotation.y = i * Math.PI / 2; b.translateZ(0.72); }
  mesh(new THREE.CircleGeometry(0.65, 12), new THREE.MeshBasicMaterial({ color: '#203040' }), 0, 0.2, 0, well).rotation.x = -Math.PI / 2;
  cyl(0.05, 0.05, 2, wm, -0.9, 1, 0, well, 5); cyl(0.05, 0.05, 2, wm, 0.9, 1, 0, well, 5); box(1.9, 0.08, 0.08, wm, 0, 2, 0, well);
  addInteract(w, well, { id: 'x_brunnen', kind: 'explore', reach: 3, markerY: 2.8 });
  w.colliders.push({ x: 1.5, z: 3.5, r: 1.1 });

  // Webstuhl + Töpferplatz
  const wsg = new THREE.Group(); wsg.position.set(10.5, 0, -4.5); s.add(wsg);
  cyl(0.05, 0.05, 2, wm, -0.7, 1, 0, wsg, 5); cyl(0.05, 0.05, 2, wm, 0.7, 1, 0, wsg, 5); box(1.6, 0.06, 0.06, wm, 0, 1.95, 0, wsg);
  for (let i = 0; i < 12; i++) box(0.01, 1.6, 0.01, new THREE.MeshBasicMaterial({ color: '#e9dfc8' }), -0.6 + i * 0.11, 1.15, 0, wsg);
  box(1.2, 0.5, 0.03, lam('#d8ccb0'), 0, 1.5, 0.01, wsg);
  [[1.6, 0.6], [2.1, 0.1]].forEach(([x, z]) => { const p = sph(0.28, potM, x, 0.25, z, wsg, 10); p.scale.y = 1.1; });
  addInteract(w, wsg, { id: 'x_werkstatt', kind: 'explore', reach: 3, markerY: 2.8 });
  w.colliders.push({ x: 10.5, z: -4.5, r: 0.9 }, { x: 12.3, z: -4.2, r: 0.6 });

  // Jäger und Bäuerin (r4_compare)
  const meet = new THREE.Group(); meet.position.set(-3, 0, 9); s.add(meet);
  const jaeger = figure('#7a5a3a', '#c58c63', { spear: true, hair: '#3a2a1a' }); jaeger.position.set(-0.6, 0, 0); jaeger.rotation.y = 1.2; meet.add(jaeger);
  const baeuerin = figure('#c8b088', '#d4a07a', { hair: '#5a3a1a' }); baeuerin.position.set(0.6, 0, 0); baeuerin.rotation.y = -1.2; meet.add(baeuerin);
  addInteract(w, meet, { id: 'r4_compare', kind: 'puzzle', reach: 3.2, markerY: 2.4 });
  w.colliders.push({ x: -3, z: 9, r: 1.0 });

  // Mahlstein + Backofen (r4_bread)
  const bake = new THREE.Group(); bake.position.set(2.5, 0, -2.5); s.add(bake);
  const oven = sph(0.9, lam('#9a7a52', { flatShading: true }), 0, 0, 0, bake, 10); oven.scale.y = 1.1;
  mesh(new THREE.CircleGeometry(0.35, 10), new THREE.MeshBasicMaterial({ color: '#120a05' }), 0, 0.35, 0.86, bake);
  box(1.0, 0.25, 0.55, std('#8d8478', { flatShading: true }), 1.5, 0.13, 0.6, bake);
  sph(0.18, std('#8d8478'), 1.5, 0.35, 0.6, bake, 8).scale.set(1.4, 0.6, 1);
  addInteract(w, bake, { id: 'r4_bread', kind: 'puzzle', reach: 3.2, markerY: 2.2 });
  w.colliders.push({ x: 2.5, z: -2.5, r: 1.0 }, { x: 4, z: -1.9, r: 0.6 });

  // Steintafel am Dorfplatz (r4_cloze)
  const stele = box(1.0, 2.0, 0.3, std('#8d8478', { flatShading: true }), -3.5, 1.0, 1.0, s); stele.rotation.y = 0.5;
  addInteract(w, stele, { id: 'r4_cloze', kind: 'puzzle', reach: 3, markerY: 2.7 });
  w.colliders.push({ x: -3.5, z: 1, r: 0.6 });

  // Dorfeingang (r4_explore + info)
  const sign = new THREE.Group(); sign.position.set(2.8, 0, 12.5); s.add(sign);
  cyl(0.07, 0.07, 1.8, wm, 0, 0.9, 0, sign, 5); box(1.4, 0.7, 0.06, lam('#c9a87a'), 0, 1.7, 0, sign);
  addInteract(w, sign, { id: 'r4_explore', kind: 'puzzle', reach: 3, markerY: 2.7 });
  const infoStone = rock(0.5, std('#8d8478', { flatShading: true }), -1.8, 0.3, 13, s, 6);
  addInteract(w, infoStone, { id: 'r4_info', kind: 'info', reach: 3, markerY: 1.6 });
  w.colliders.push({ x: 2.8, z: 12.5, r: 0.4 }, { x: -1.8, z: 13, r: 0.5 });

  // Rückweg
  const cave = new THREE.Group(); cave.position.set(0, 0, 17.5); s.add(cave);
  const dome = sph(3.2, std('#6d5d4c', { flatShading: true }), 0, 0, 0.8, cave, 10); dome.scale.set(1.3, 1, 0.8);
  const hm = new THREE.Mesh(new THREE.CircleGeometry(1.3, 16, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#050302' })); hm.position.set(0, 0.01, -1.7); hm.scale.y = 1.8; cave.add(hm);
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.5), new THREE.MeshBasicMaterial({ map: labelTexture('Zurück zur Höhle'), transparent: true })); sg.position.set(0, 3.0, -1.9); cave.add(sg);
  addInteract(w, cave, { id: 'exit', kind: 'exit', pos: { x: 0, z: 15.6 }, reach: 2.6, marker: false });
  w.colliders.push({ x: 0, z: 18, r: 3 });

  w.bounds = { type: 'rect', minX: -16, maxX: 16, minZ: -15, maxZ: 15.5 };
  w.spawn = { x: 0, z: 14, yaw: 0 };
  w.speed = 4.2;
  return w;
}

// ---------------------------------------------------------------- URUK
function mudHouse(parent, x, z, w, d, h, rot, mat) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; parent.add(g);
  box(w, h, d, mat, 0, h / 2, 0, g);
  box(w + 0.2, 0.15, d + 0.2, lam('#a68a62'), 0, h + 0.07, 0, g);
  box(0.8, 1.6, 0.05, lam('#3a2a1a'), 0, 0.8, d / 2 + 0.01, g);
  return g;
}

function buildUruk(ctx) {
  const w = newWorld('uruk');
  outdoorBase(w, { size: 60, ground: '#c9a874', groundVar: ['#b8955e', '#d9bb88', '#a88a5a'], sky: [[0, '#4f86c9'], [0.6, '#bcd6ea'], [1, '#efe2c4']], fogColor: '#e7d8b8', fogNear: 35, fogFar: 120, sun: 3.0, sunColor: '#fff0d0', hemi: 1.0 });
  const s = w.scene;
  const brick = lam('#ffffff', { map: noiseTexture('#b99668', ['#a08058', '#cfae80', '#8f7250'], { seed: 61, count: 500, bricks: 'rgba(90,70,45,.45)', repeat: [2, 1] }) });

  // Euphrat & Kanäle
  const water = new THREE.MeshLambertMaterial({ color: '#3f7fa8', emissive: '#0d2a40' });
  box(10, 0.05, 140, water, -36, 0.02, 0, s);
  [-14, -2, 10].forEach(z => box(22, 0.06, 1.4, water, -20, 0.03, z, s));
  const wtex = water; w.updaters.push(t => { wtex.emissive.setHSL(0.56, 0.6, 0.1 + 0.03 * Math.sin(t)); });
  // Felder
  [[-22, -8], [-22, 4], [-22, 16], [-14, -8], [-14, 4], [-14, 16]].forEach(([x, z], i) => {
    box(7, 0.04, 9, lam(i % 2 ? '#7a8a3a' : '#9a9a48'), x, 0.02, z, s);
    grainField(s, x, z, 6.5, 8.5, 350, i % 2 ? '#c8b050' : '#a8a848');
  });
  for (let i = 0; i < 22; i++) palm(-30 + (i % 2) * 2.5, -30 + i * 3, s, 0.9 + (i % 3) * 0.15);
  for (let i = 0; i < 6; i++) palm(-9, -18 + i * 7, s, 1);
  addInteract(w, s.children[s.children.length - 1], { id: 'u_landwirtschaft', kind: 'explore', pos: { x: -14, z: 1.5 }, reach: 4, markerY: 3.2 });
  const canalMark = new THREE.Object3D(); canalMark.position.set(-20, 0, -2); s.add(canalMark);
  addInteract(w, canalMark, { id: 'u_bewaesserung', kind: 'explore', pos: { x: -9, z: -2 }, reach: 4, markerY: 2.6 });
  w.colliders.push({ x: -9, z: -2, r: 0.5 });

  // Tempelterrasse mit Weißem Tempel
  const temple = new THREE.Group(); temple.position.set(2, 0, -26); s.add(temple);
  box(22, 4, 18, brick, 0, 2, 0, temple); box(16, 3, 13, brick, 0, 5.5, 0, temple);
  const white = lam('#f2eee4');
  box(11, 4, 6, white, 0, 9, 0, temple);
  for (let i = 0; i < 9; i++) box(0.5, 4, 0.4, white, -5 + i * 1.25, 9, 3.15, temple);
  box(4, 0.4, 14, brick, 0, 3.4, 13, temple).rotation.x = 0.42;
  addInteract(w, temple, { id: 'u_bauwerke', kind: 'explore', pos: { x: 2, z: -14.5 }, reach: 5, markerY: 3.4 });
  w.colliders.push({ x: -7, z: -26, r: 6 }, { x: 2, z: -26, r: 7 }, { x: 11, z: -26, r: 6 }, { x: 2, z: -18.5, r: 2.2 });

  // Häuser
  const houses = [[12, -10, 5, 4, 3], [18, -12, 4, 5, 3.5], [14, 6, 4, 4, 3], [20, 2, 5, 4, 3], [16, 14, 6, 4, 3.2], [22, 12, 4, 4, 2.8], [-4, 16, 5, 4, 3], [4, 18, 4, 5, 3], [10, 20, 5, 4, 3.4], [-12, -18, 4, 4, 3], [22, -4, 4, 6, 3], [-4, -14, 5, 4, 3.5]];
  houses.forEach(([x, z, ww, dd, h], i) => { mudHouse(s, x, z, ww, dd, h, (i % 3 - 1) * 0.1, brick); w.colliders.push({ x, z, r: Math.max(ww, dd) * 0.55 }); });

  // Werkstatt (Töpfer)
  const shop = new THREE.Group(); shop.position.set(-4, 0, 4); s.add(shop);
  [[-1.5, -1], [1.5, -1], [-1.5, 1], [1.5, 1]].forEach(([x, z]) => cyl(0.08, 0.08, 2.4, lam('#7a5530'), x, 1.2, z, shop, 5));
  box(3.6, 0.1, 2.6, lam('#c9b48a'), 0, 2.45, 0, shop);
  const wheel = cyl(0.4, 0.4, 0.08, lam('#7a5530'), 0, 0.6, 0, shop, 16); cyl(0.05, 0.05, 0.6, lam('#5a3c22'), 0, 0.3, 0, shop, 5);
  const clay = cyl(0.12, 0.16, 0.25, lam('#a8683e'), 0, 0.77, 0, shop, 10);
  w.updaters.push(t => { wheel.rotation.y = t * 4; clay.rotation.y = t * 4; });
  const potter = figure('#d8ccb0', '#b07850', { hair: '#2a1a10' }); potter.position.set(0, 0, 0.8); potter.rotation.y = Math.PI; potter.scale.setScalar(0.9); shop.add(potter);
  for (let i = 0; i < 8; i++) { const b = cyl(0.18, 0.1, 0.15, lam('#b07a4a'), -1.2 + (i % 4) * 0.3, 0.08 + Math.floor(i / 4) * 0.16, -0.7, shop, 10); }
  addInteract(w, shop, { id: 'u_arbeitsteilung', kind: 'explore', reach: 3.6, markerY: 3.4 });
  w.colliders.push({ x: -4, z: 4, r: 2 });

  // Markt
  const market = new THREE.Group(); market.position.set(8, 0, -1); s.add(market);
  const cloth = ['#b0442a', '#2a6ab0', '#d8a83a', '#3a8a5a'];
  [[-2.5, 0], [0, -1.5], [2.5, 0], [0, 2]].forEach(([x, z], i) => {
    box(1.8, 0.8, 1.0, lam('#8a6038'), x, 0.4, z, market);
    box(2.2, 0.06, 1.6, lam(cloth[i]), x, 2.1, z, market);
    [[-0.9, -0.5], [0.9, -0.5], [-0.9, 0.5], [0.9, 0.5]].forEach(([a, b]) => cyl(0.04, 0.04, 2.1, lam('#7a5530'), x + a, 1.05, z + b, market, 4));
    const goods = i === 1 ? '#2a4ab0' : i === 2 ? '#c89a3a' : i === 0 ? '#7a5a3a' : '#8aa04a';
    for (let k = 0; k < 4; k++) sph(0.15, lam(goods), x - 0.6 + k * 0.4, 0.9, z, market, 8);
  });
  const trader = figure('#2a6ab0', '#b07850', { hair: '#1a1008' }); trader.position.set(0, 0, 0.3); market.add(trader);
  addInteract(w, market, { id: 'u_handel', kind: 'explore', reach: 4, markerY: 3.2 });
  w.colliders.push({ x: 5.5, z: -1, r: 1.2 }, { x: 8, z: -2.5, r: 1.2 }, { x: 10.5, z: -1, r: 1.2 }, { x: 8, z: 1, r: 1.2 });

  // Speicher / Verwaltung
  const store = mudHouse(s, -8, -8, 6, 4, 3.5, 0, brick);
  for (let i = 0; i < 5; i++) { const sack = sph(0.35, lam('#d8c7a0'), -10 + i * 0.8, 0.35, -5.4, s, 8); sack.scale.y = 1.2; }
  const official = figure('#efe8da', '#b07850', { hair: '#1a1008' }); official.position.set(-6.5, 0, -5.2); s.add(official);
  addInteract(w, store, { id: 'u_verwaltung', kind: 'explore', pos: { x: -8, z: -5.2 }, reach: 3.6, markerY: 4.6 });
  w.colliders.push({ x: -8, z: -8, r: 3.3 }, { x: -8, z: -5.4, r: 1.4 });

  // Schreiber
  const scribe = new THREE.Group(); scribe.position.set(3, 0, -10); s.add(scribe);
  box(1.4, 0.7, 0.8, lam('#8a6038'), 0, 0.35, 0, scribe);
  for (let i = 0; i < 4; i++) box(0.22, 0.04, 0.3, lam('#c9a478'), -0.45 + i * 0.3, 0.73, 0, scribe);
  const sf = figure('#efe8da', '#b07850', { hair: '#1a1008' }); sf.position.set(0, 0, 0.9); sf.rotation.y = Math.PI; scribe.add(sf);
  addInteract(w, scribe, { id: 'u_schrift', kind: 'explore', reach: 3.4, markerY: 2.4 });
  w.colliders.push({ x: 3, z: -10, r: 1 });

  // Stele: Die große Frage
  const stele = new THREE.Group(); stele.position.set(2, 0, 6); s.add(stele);
  box(1.2, 3.2, 0.5, std('#3b3530', { flatShading: true }), 0, 1.6, 0, stele);
  box(2.4, 0.4, 2.4, brick, 0, 0.2, 0, stele);
  addInteract(w, stele, { id: 'u_final', kind: 'puzzle', reach: 3.4, markerY: 4 });
  w.colliders.push({ x: 2, z: 6, r: 1.2 });
  // Begrüßung
  const intro = box(0.8, 1.3, 0.25, std('#a08c72', { flatShading: true }), -2.6, 0.65, 20.5, s); intro.rotation.y = 0.5;
  addInteract(w, intro, { id: 'uruk_intro', kind: 'info', reach: 3, markerY: 2.0 });
  const ex = box(0.8, 1.3, 0.25, std('#a08c72', { flatShading: true }), 2.6, 0.65, 20.5, s); ex.rotation.y = -0.5;
  addInteract(w, ex, { id: 'u_explore', kind: 'puzzle', reach: 3, markerY: 2.0 });
  w.colliders.push({ x: -2.6, z: 20.5, r: 0.5 }, { x: 2.6, z: 20.5, r: 0.5 });

  // Menschen, die umhergehen
  const walkers = [];
  for (let i = 0; i < 8; i++) {
    const f = figure(['#efe8da', '#c8b088', '#b0442a', '#2a6ab0'][i % 4], '#b07850', { hair: '#1a1008' });
    s.add(f); walkers.push({ f, ax: -6 + i * 2.4, az: 10 + (i % 3) * 3, r: 2 + (i % 3), sp: 0.15 + (i % 4) * 0.05, ph: i });
  }
  w.updaters.push(t => walkers.forEach(o => { const a = t * o.sp + o.ph; o.f.position.set(o.ax + Math.cos(a) * o.r, 0, o.az + Math.sin(a) * o.r * 0.6); o.f.rotation.y = -a; }));

  w.bounds = { type: 'rect', minX: -30, maxX: 26, minZ: -16, maxZ: 25 };
  w.spawn = { x: 0, z: 24, yaw: 0, pitch: 0.12 };
  w.speed = 5.5;
  return w;
}

const BUILDERS = { hub: buildHub, r1: buildRoom1, r2: buildRoom2, r3: buildRoom3, r4: buildRoom4, uruk: buildUruk };
