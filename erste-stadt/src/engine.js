// =====================================================================
//  ENGINE – Renderer, Touch-Steuerung, Bewegung, Interaktion
// =====================================================================

const Engine = (() => {
  let renderer = null, camera = null, canvas = null, world = null;
  let ok = false, lastT = 0, frame = 0;
  const player = { x: 0, z: 0, y: 1.6, yaw: 0, pitch: 0, tx: null, tz: null, onArrive: null, faceYaw: null, stuck: 0 };
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const keys = {};
  const stick = { active: false, id: null, x: 0, y: 0, cx: 0, cy: 0 };
  const look = { ix: 1, iy: 1 }; // 1 = Standard, -1 = umgekehrt
  let down = null;
  let cutscene = null;
  let blocked = () => false; // wird von main gesetzt (Panel offen?)
  let onInteract = () => {};
  let onWalkTap = () => {};

  function init(opts) {
    canvas = document.getElementById('world');
    blocked = opts.blocked; onInteract = opts.onInteract; onWalkTap = opts.onWalkTap || (() => {});
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: (window.devicePixelRatio || 1) < 2, powerPreference: 'high-performance' });
      if (!renderer.getContext()) throw new Error('kein WebGL');
    } catch (e) { console.warn('WebGL nicht verfügbar', e); ok = false; return false; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    camera = new THREE.PerspectiveCamera(70, 1, 0.05, 500);
    camera.rotation.order = 'YXZ';
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 200));
    bindInput();
    ok = true;
    requestAnimationFrame(loop);
    return true;
  }

  function resize() {
    if (!renderer) return;
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.9 ? 82 : 70; // Hochformat: weiterer Blick
    camera.updateProjectionMatrix();
  }

  function setWorld(w, spawn) {
    if (world && world.dispose) world.dispose();
    world = w;
    const s = spawn || w.spawn;
    player.x = s.x; player.z = s.z; player.yaw = s.yaw || 0; player.pitch = s.pitch || 0;
    player.tx = player.tz = null; player.onArrive = null; player.faceYaw = null;
    player.y = w.eyeHeight || 1.6;
    while (camera.children.length) camera.remove(camera.children[0]);
    if (w.camLight) camera.add(w.camLight);
    if (w.camExtra) camera.add(w.camExtra);
    if (!w.scene.children.includes(camera)) w.scene.add(camera);
    updateCamera(0);
  }

  // ---------------- Input ----------------
  function bindInput() {
    canvas.addEventListener('pointerdown', e => {
      if (blocked() || cutscene) return;
      if (down) return; // nur ein Finger
      down = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: false, t: performance.now() };
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    });
    canvas.addEventListener('pointermove', e => {
      if (!down || e.pointerId !== down.id) return;
      const dx = e.clientX - down.lx, dy = e.clientY - down.ly;
      if (!down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) down.moved = true;
      if (down.moved) {
        const k = e.pointerType === 'mouse' ? 0.0045 : 0.0060;
        player.yaw += dx * k * look.ix;
        player.pitch = Math.max(-1.1, Math.min(1.15, player.pitch + dy * k * 0.8 * look.iy));
        player.faceYaw = null;
      }
      down.lx = e.clientX; down.ly = e.clientY;
    });
    const end = e => {
      if (!down || e.pointerId !== down.id) return;
      const wasTap = !down.moved && performance.now() - down.t < 700;
      down = null;
      if (wasTap && !blocked() && !cutscene) tap(e.clientX, e.clientY);
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', () => { down = null; });
    window.addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    bindStick();
  }

  // Virtueller Joystick (unten links) – zweiter Finger kann gleichzeitig umsehen
  function bindStick() {
    const base = document.getElementById('stick');
    if (!base) return;
    const knob = base.querySelector('.knob');
    const R = 46;
    const set = (dx, dy) => {
      const d = Math.hypot(dx, dy) || 1, k = d > R ? R / d : 1;
      stick.x = dx * k / R; stick.y = dy * k / R;
      knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    };
    base.addEventListener('pointerdown', e => {
      if (stick.active || blocked() || cutscene) return;
      stick.active = true; stick.id = e.pointerId;
      try { base.setPointerCapture(e.pointerId); } catch (_) {}
      const r = base.getBoundingClientRect();
      stick.cx = r.left + r.width / 2; stick.cy = r.top + r.height / 2;
      set(e.clientX - stick.cx, e.clientY - stick.cy);
      base.classList.add('on');
      e.preventDefault();
    });
    base.addEventListener('pointermove', e => {
      if (!stick.active || e.pointerId !== stick.id) return;
      set(e.clientX - stick.cx, e.clientY - stick.cy);
    });
    const end = e => {
      if (!stick.active || e.pointerId !== stick.id) return;
      stick.active = false; stick.x = stick.y = 0;
      knob.style.transform = ''; base.classList.remove('on');
    };
    base.addEventListener('pointerup', end);
    base.addEventListener('pointercancel', end);
  }

  function pick(cx, cy) {
    ndc.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(world.pickables, true);
    // Marker-Zeichen werden immer bevorzugt (sie sind auch durch Wände sichtbar)
    for (const h of hits) {
      const o = h.object;
      if (o.isSprite && o.visible && o.userData.interact && (!o.userData.interact.enabled || o.userData.interact.enabled())) return { type: 'interact', it: o.userData.interact, point: h.point };
    }
    for (const h of hits) {
      let o = h.object;
      if (o.userData.ignorePick) continue;
      while (o && !o.userData.interact && !o.userData.walk) o = o.parent;
      if (!o) continue;
      if (o.userData.interact) { const it = o.userData.interact; if (it.enabled && !it.enabled()) continue; return { type: 'interact', it, point: h.point }; }
      if (o.userData.walk) return { type: 'walk', point: h.point };
    }
    return null;
  }

  function tap(cx, cy) {
    if (!world) return;
    const p = pick(cx, cy);
    if (!p) return;
    if (p.type === 'interact') goUse(p.it);
    else if (p.type === 'walk') { walkTo(p.point.x, p.point.z); onWalkTap(); }
  }

  // Interaktion: hinlaufen falls zu weit, dann benutzen
  function goUse(it, force) {
    const dx = it.pos.x - player.x, dz = it.pos.z - player.z;
    const d = Math.hypot(dx, dz);
    const reach = it.reach || 3.2;
    const face = () => { player.faceYaw = Math.atan2(-dx2(), -dz2()); };
    const dx2 = () => it.pos.x - player.x, dz2 = () => it.pos.z - player.z;
    if (d > reach && !it.noWalk) {
      const stop = Math.max(0.6, reach * 0.7);
      const tx = it.pos.x - dx / d * stop, tz = it.pos.z - dz / d * stop;
      walkTo(tx, tz, () => { face(); onInteract(it); });
    } else { face(); onInteract(it); }
  }

  function walkTo(x, z, cb) {
    const c = clampPos(x, z);
    player.tx = c.x; player.tz = c.z; player.onArrive = cb || null; player.stuck = 0;
    player.faceYaw = Math.atan2(-(c.x - player.x), -(c.z - player.z));
    if (Math.hypot(c.x - player.x, c.z - player.z) < 0.15) arrive();
  }
  function arrive() {
    player.tx = player.tz = null;
    const cb = player.onArrive; player.onArrive = null;
    if (cb) cb();
  }

  function clampPos(x, z) {
    const b = world.bounds;
    if (b.type === 'ellipse') {
      const m = 0.85;
      const q = (x / (b.ax * m)) ** 2 + ((z - (b.cz || 0)) / (b.az * m)) ** 2;
      if (q > 1) { const s = 1 / Math.sqrt(q); x *= s; z = (b.cz || 0) + (z - (b.cz || 0)) * s; }
    } else {
      x = Math.max(b.minX, Math.min(b.maxX, x)); z = Math.max(b.minZ, Math.min(b.maxZ, z));
    }
    for (const c of world.colliders) {
      const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz), r = c.r + 0.35;
      if (d < r) { if (d < 1e-4) { x += r; } else { x = c.x + dx / d * r; z = c.z + dz / d * r; } }
    }
    return { x, z };
  }

  // ---------------- Loop ----------------
  function loop(t) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
    frame++;
    if (!world) return;
    if (blocked() && !cutscene && frame % 3) return; // spart Akku bei offenem Panel
    if (cutscene) runCutscene(dt);
    else updatePlayer(dt);
    if (world.update) world.update(dt, t / 1000, player);
    updateCamera(dt);
    renderer.render(world.scene, camera);
  }

  function updatePlayer(dt) {
    const speed = world.speed || 3.4;
    let mx = 0, mz = 0;
    if (!blocked()) {
      const f = (keys['w'] || keys['arrowup'] ? 1 : 0) - (keys['s'] || keys['arrowdown'] ? 1 : 0);
      const s = (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0);
      if (keys['arrowleft']) player.yaw += 2 * dt;
      if (keys['arrowright']) player.yaw -= 2 * dt;
      if (keys['q']) player.yaw += 2 * dt;
      if (keys['e']) player.yaw -= 2 * dt;
      let jf = 0, js = 0;
      if (stick.active) {
        const mag = Math.hypot(stick.x, stick.y);
        if (mag > 0.15) { jf = -stick.y; js = stick.x; } // nach oben = vorwärts
      }
      if (f || s || jf || js) {
        player.tx = null; player.onArrive = null; player.faceYaw = null;
        const F = Math.max(-1, Math.min(1, f + jf)), S = Math.max(-1, Math.min(1, s + js));
        mx = (-Math.sin(player.yaw) * F + Math.cos(player.yaw) * S) * speed * dt;
        mz = (-Math.cos(player.yaw) * F - Math.sin(player.yaw) * S) * speed * dt;
      }
    }
    if (player.tx !== null) {
      const dx = player.tx - player.x, dz = player.tz - player.z, d = Math.hypot(dx, dz);
      if (d < 0.12) arrive();
      else { const st = Math.min(d, speed * dt); mx = dx / d * st; mz = dz / d * st; }
    }
    if (mx || mz) {
      const ox = player.x, oz = player.z;
      const c = clampPos(player.x + mx, player.z + mz);
      player.x = c.x; player.z = c.z;
      if (player.tx !== null) {
        const moved = Math.hypot(player.x - ox, player.z - oz);
        if (moved < speed * dt * 0.2) { player.stuck += dt; if (player.stuck > 0.35) arrive(); } // blockiert: trotzdem auslösen (keine Sackgasse)
        else player.stuck = 0;
      }
    }
    if (player.faceYaw !== null) {
      let d = player.faceYaw - player.yaw;
      while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      player.yaw += d * Math.min(1, dt * 5);
      if (Math.abs(d) < 0.01) player.faceYaw = null;
      if (player.tx === null) player.pitch += (-0.08 - player.pitch) * Math.min(1, dt * 3);
    }
  }

  function updateCamera() {
    if (cutscene) return;
    const bob = player.tx !== null ? Math.sin(performance.now() / 140) * 0.025 : 0;
    camera.position.set(player.x, player.y + bob, player.z);
    camera.rotation.set(player.pitch, player.yaw, 0);
  }

  // ---------------- Zwischensequenzen ----------------
  // fn(t01, camera) – t01 läuft von 0..1 über duration Sekunden
  function playCutscene(fn, duration, done) {
    cutscene = { fn, duration, t: 0, done };
  }
  function runCutscene(dt) {
    cutscene.t += dt;
    const k = Math.min(1, cutscene.t / cutscene.duration);
    cutscene.fn(k, camera);
    if (k >= 1) finishCutscene();
  }
  function finishCutscene() {
    if (!cutscene) return;
    const c = cutscene; cutscene = null;
    try { c.fn(1, camera); } catch (_) {}
    if (c.done) c.done();
  }

  return {
    init, setWorld, goUse, walkTo, playCutscene, finishCutscene, look,
    get ok() { return ok; }, get world() { return world; }, get camera() { return camera; }, player,
    inCutscene: () => !!cutscene,
    resize
  };
})();

// =====================================================================
//  Bausteine für Szenen
// =====================================================================
const MAT = {};
function lam(color, opts = {}) { return new THREE.MeshLambertMaterial(Object.assign({ color }, opts)); }
function std(color, opts = {}) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.95, metalness: 0 }, opts)); }

function mesh(geo, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (parent) parent.add(m); return m;
}
function box(w, h, d, mat, x, y, z, parent) { return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent); }
function cyl(rt, rb, h, mat, x, y, z, parent, seg = 12) { return mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, parent); }
function sph(r, mat, x, y, z, parent, seg = 12) { return mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg / 2)), mat, x, y, z, parent); }

// Felsenhöhle: verformte Kugel, innen sichtbar
function caveShell(ax, ay, az, mat, amp = 0.12, seed = 1) {
  const g = new THREE.SphereGeometry(1, 64, 32);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = fbm3(x * 2.6 + seed, y * 2.6, z * 2.6 + seed * 3);
    const s = 1 + amp * n;
    if (y < 0) y = y * 0.06 - 0.02;
    p.setXYZ(i, x * ax * s, y * ay * (y > 0 ? s : 1), z * az * s);
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.material.side = THREE.BackSide;
  return m;
}

function rock(r, mat, x, y, z, parent, seed = 1) {
  const g = new THREE.DodecahedronGeometry(r, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x0 = p.getX(i), y0 = p.getY(i), z0 = p.getZ(i);
    const s = 1 + 0.25 * noise3(x0 * 2 + seed, y0 * 2, z0 * 2);
    p.setXYZ(i, x0 * s, y0 * s * 0.8, z0 * s);
  }
  g.computeVertexNormals();
  return mesh(g, mat, x, y, z, parent);
}

// Marker-Sprite über einem Objekt
function makeMarker(kind, label) {
  const mat = new THREE.SpriteMaterial({ map: markerTexture(kind, label), depthTest: false, transparent: true });
  const s = new THREE.Sprite(mat); s.scale.set(0.55, 0.55, 0.55); s.renderOrder = 10;
  return s;
}
function setMarker(sprite, kind, label) { if (!sprite) return; sprite.material.map = markerTexture(kind, label); sprite.material.needsUpdate = true; }

// Prisma-Dach (Satteldach)
function gableRoof(len, width, height, mat) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0); shape.lineTo(width / 2, 0); shape.lineTo(0, height); shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false });
  g.translate(0, 0, -len / 2);
  return new THREE.Mesh(g, mat);
}

// einfache Figur (Mensch)
function figure(colorBody, colorSkin = '#c58c63', opts = {}) {
  const g = new THREE.Group();
  const body = cyl(0.18, 0.28, 1.0, lam(colorBody), 0, 0.75, 0, g, 10);
  sph(0.16, lam(colorSkin), 0, 1.42, 0, g, 12);
  if (opts.hair) sph(0.165, lam(opts.hair), 0, 1.47, 0.02, g, 10).scale.set(1, 0.7, 1);
  cyl(0.05, 0.05, 0.55, lam(colorSkin), 0.24, 0.95, 0, g, 6).rotation.z = 0.25;
  cyl(0.05, 0.05, 0.55, lam(colorSkin), -0.24, 0.95, 0, g, 6).rotation.z = -0.25;
  if (opts.spear) { const sp = cyl(0.025, 0.025, 2.2, lam('#7a5530'), 0.36, 1.1, 0, g, 5); const tip = mesh(new THREE.ConeGeometry(0.05, 0.18, 5), lam('#555'), 0, 1.15, 0, sp); }
  return g;
}

// vierbeiniges Tier
function quadruped(color, opts = {}) {
  const g = new THREE.Group(); const m = lam(color);
  const L = opts.len || 1.2, H = opts.h || 0.7;
  const body = sph(0.5, m, 0, H, 0, g, 12); body.scale.set(L * 0.5 / 0.5, 0.42 * (opts.thick || 1) / 0.5 * 0.5 * 2, 0.36 / 0.5 * 0.5 * 2 * (opts.thick || 1));
  body.scale.set(L, 0.8 * (opts.thick || 1) * H, 0.7 * (opts.thick || 1) * H);
  const head = sph(0.2, lam(opts.headColor || color), L * 0.55, H + 0.18, 0, g, 10); head.scale.set(1.4, 1, 0.9);
  for (const [lx, lz] of [[0.32, 0.15], [0.32, -0.15], [-0.32, 0.15], [-0.32, -0.15]]) cyl(0.05, 0.04, H, m, lx * L, H / 2, lz, g, 6);
  if (opts.horns) { const hm = lam('#e8dcc0'); const h1 = cyl(0.02, 0.04, 0.3, hm, L * 0.6, H + 0.4, 0.1, g, 5); h1.rotation.x = 0.5; const h2 = cyl(0.02, 0.04, 0.3, hm, L * 0.6, H + 0.4, -0.1, g, 5); h2.rotation.x = -0.5; }
  if (opts.wool) { const w = sph(0.5, lam('#efe8da'), 0, H + 0.05, 0, g, 10); w.scale.set(L * 1.05, H * 0.9, H * 0.85); }
  return g;
}

function tree(x, z, parent, s = 1, kind = 'laub') {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  cyl(0.12 * s, 0.18 * s, 1.6 * s, lam('#6b4a2b'), 0, 0.8 * s, 0, g, 6);
  if (kind === 'nadel') { mesh(new THREE.ConeGeometry(1.0 * s, 2.6 * s, 7), lam('#2f5a32'), 0, 2.6 * s, 0, g); mesh(new THREE.ConeGeometry(0.75 * s, 1.8 * s, 7), lam('#386b3a'), 0, 3.5 * s, 0, g); }
  else { const c = mesh(new THREE.IcosahedronGeometry(1.2 * s, 0), lam('#3f7a3a', { flatShading: true }), 0, 2.4 * s, 0, g); c.scale.y = 0.9; }
  parent.add(g); return g;
}

function palm(x, z, parent, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const t = cyl(0.12 * s, 0.2 * s, 4.5 * s, lam('#8a6a42'), 0, 2.25 * s, 0, g, 6); t.rotation.z = 0.06;
  const lm = lam('#4f8a3a', { side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.6 * s, 2.4 * s), lm);
    leaf.position.set(0, 4.5 * s, 0); leaf.rotation.order = 'YXZ'; leaf.rotation.y = i / 7 * Math.PI * 2; leaf.rotation.x = -1.0;
    leaf.translateY(1.0 * s); g.add(leaf);
  }
  parent.add(g); return g;
}

// Flackernde Fackel (Mesh + optional Licht)
function torch(x, y, z, parent, withLight = true) {
  const g = new THREE.Group(); g.position.set(x, y, z);
  cyl(0.04, 0.05, 0.6, lam('#5a3c22'), 0, -0.3, 0, g, 6);
  const flame = mesh(new THREE.ConeGeometry(0.11, 0.35, 8), new THREE.MeshBasicMaterial({ color: '#ffb347' }), 0, 0.12, 0, g);
  const inner = mesh(new THREE.ConeGeometry(0.06, 0.2, 8), new THREE.MeshBasicMaterial({ color: '#fff2b0' }), 0, 0.08, 0, g);
  let light = null;
  if (withLight) { light = new THREE.PointLight('#ff9a4a', 9, 14, 1.6); light.position.set(0, 0.3, 0); g.add(light); }
  parent.add(g);
  const seed = Math.random() * 10;
  g.userData.update = t => {
    const f = 0.85 + 0.15 * Math.sin(t * 13 + seed) * Math.sin(t * 7.3 + seed * 2);
    flame.scale.set(1, f * 1.1, 1); inner.scale.set(1, f, 1);
    if (light) light.intensity = 9 * f;
  };
  return g;
}

// Interaktionspunkt registrieren
function addInteract(world, obj, it) {
  it.obj = obj;
  if (!it.pos) { const p = new THREE.Vector3(); obj.getWorldPosition(p); it.pos = { x: p.x, z: p.z }; }
  obj.userData.interact = it;
  world.pickables.push(obj);
  world.interacts[it.id] = it;
  if (it.marker !== false) {
    const mk = makeMarker('todo');
    mk.position.set(it.pos.x, it.markerY || 2.2, it.pos.z);
    mk.userData.interact = it;
    world.scene.add(mk); world.pickables.push(mk);
    it.sprite = mk;
  }
  return it;
}

function newWorld(name) {
  const scene = new THREE.Scene();
  return { name, scene, pickables: [], interacts: {}, colliders: [], updaters: [], bounds: { type: 'rect', minX: -10, maxX: 10, minZ: -10, maxZ: 10 }, spawn: { x: 0, z: 0, yaw: 0 },
    update(dt, t, pl) {
      for (const u of this.updaters) u(t, dt, pl);
      for (const id in this.interacts) {
        const it = this.interacts[id], sp = it.sprite;
        if (!sp || !sp.visible) continue;
        sp.position.y = (it.markerY || 2.2) + Math.sin(t * 2 + it.pos.x) * 0.08;
        const d = Math.hypot(sp.position.x - pl.x, sp.position.z - pl.z);
        const base = Math.min(1.5, Math.max(0.42, 0.22 + d * 0.055)) * (sp.userData.small ? 0.6 : 1);
        sp.scale.set(base, base, base);
      }
    }
  };
}
function walkable(world, m) { m.userData.walk = true; world.pickables.push(m); return m; }
