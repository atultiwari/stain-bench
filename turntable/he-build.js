/* ============================================================
   H&E staining, 3D: builds the bench, jars, labels, faucets, rack and loose slide.
   heBuild(T, L) takes THREE and the fat-line addons and returns the objects the app animates.
   World space: X = along the bench (left to right seen from the front), Y = up, Z = toward the viewer.
   heW() maps the 2D figure's bench coordinates (x depth, y width toward the left, z up) into it.
   ============================================================ */
const heW = (T, x, y, z) => new T.Vector3(HE_BY / 2 - y, z, x - HE_DEPTH / 2);
const heWv = (T, x, y, z) => new T.Vector3(-y, z, x);

function heBuild(T, L) {
  const kit = heKit(T, L);
  const scene = new T.Scene();
  scene.background = new T.Color('#f2efe7');
  heLights(T, scene);
  scene.add(heBench(T, kit));
  const stations = HE_STATIONS.map((s0, i) => {
    const kind = heKind(s0), st = kind === 'jar' ? heJar(T, kit, s0) : kind === 'tray' ? heTray(T, kit, s0) : hePad(T, kit, s0);
    st.root.traverse(o => { o.userData.station = i; });
    scene.add(st.root);
    return st;
  });
  const tissueMat = new T.MeshBasicMaterial({ color: heTissue(HE_LOOK.wax) });
  const rack = heRack(T, kit, tissueMat);
  rack.root.traverse(o => { o.userData.rack = true; });
  scene.add(rack.root);
  const loose = heLooseSlide(T, kit, tissueMat);
  scene.add(loose.root);
  const ripples = stations.flatMap(s => s.ripples || []);
  return { scene, stations, rack, loose, tissueMat, ripples, lineMats: kit.lineMats };
}

/* ---------- materials, outlines and shape helpers ---------- */
function heKit(T, L) {
  const grad = new T.DataTexture(new Uint8Array([120, 190, 255]), 3, 1, T.RedFormat);
  grad.minFilter = grad.magFilter = T.NearestFilter; grad.needsUpdate = true;
  const toonCache = new Map(), lineMats = [];
  const toon = (color, extra = {}) => {
    const key = color + JSON.stringify(extra);
    if (!toonCache.has(key)) toonCache.set(key, new T.MeshToonMaterial({ color, gradientMap: grad, ...extra }));
    return toonCache.get(key);
  };
  const lineMat = (color, width, opacity = 1) => {
    const m = new L.LineMaterial({ color, linewidth: width, transparent: opacity < 1, opacity });
    lineMats.push(m); return m;
  };
  const INK_LINE = lineMat(INK, 1.8), INK_THIN = lineMat(INK, 1.1);
  const hullMat = new T.MeshBasicMaterial({ color: INK, side: T.BackSide });
  const noPick = o => { o.raycast = () => {}; return o; };
  // ink on every hard edge (fat lines, so the outline stays a couple of pixels wide on any screen)
  const edges = (mesh, mat = INK_LINE, angle = 30) => {
    const g = new L.LineSegmentsGeometry().fromEdgesGeometry(new T.EdgesGeometry(mesh.geometry, angle));
    mesh.add(noPick(new L.LineSegments2(g, mat)));
    return mesh;
  };
  // inverted hull: a slightly larger back-face copy in ink, for round parts whose silhouette edges are not geometry edges
  const hull = (mesh, t = .8) => {
    const g = mesh.geometry; g.computeBoundingBox();
    const s = new T.Vector3(); g.boundingBox.getSize(s);
    const h = noPick(new T.Mesh(g, hullMat));
    h.scale.set((s.x + 2 * t) / s.x, (s.y + 2 * t) / s.y, (s.z + 2 * t) / s.z);
    mesh.add(h); return mesh;
  };
  // a box between two corners in bench coordinates
  const boxAt = (x0, y0, z0, x1, y1, z1, mat) => {
    const m = new T.Mesh(new T.BoxGeometry(Math.abs(y1 - y0), Math.abs(z1 - z0), Math.abs(x1 - x0)), mat);
    m.position.copy(heW(T, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2));
    return m;
  };
  // a round rod between two points (world vectors)
  const rodW = (a, b, r, mat) => {
    const d = new T.Vector3().subVectors(b, a), m = new T.Mesh(new T.CylinderGeometry(r, r, d.length(), 14), mat);
    m.position.copy(a).addScaledVector(d, .5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
    m.castShadow = true;
    return hull(m, Math.min(.7, r * .55));
  };
  const rod = (a, b, r, mat) => rodW(heW(T, ...a), heW(T, ...b), r, mat);
  return { toon, lineMat, INK_LINE, INK_THIN, edges, hull, boxAt, rod, rodW, lineMats };
}

function heLights(T, scene) {
  scene.add(new T.HemisphereLight('#ffffff', '#cfc6b4', 1.9));
  const sun = new T.DirectionalLight('#ffffff', 1.6);
  sun.position.set(-180, 700, 300);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -420, right: 420, top: 420, bottom: -420, near: 100, far: 1600 });
  sun.shadow.bias = -.0008;
  scene.add(sun);
}

function heBench(T, k) {
  const g = new T.Group();
  const board = k.edges(k.boxAt(0, 0, 0, HE_DEPTH, HE_BY, HE_BH, k.toon('#d6cfbf')));
  const { x0, x1, h } = HE_RISER;
  const riser = k.edges(k.boxAt(x0, 0, HE_BH, x1, HE_BY, h, k.toon('#e3dccb')));
  [board, riser].forEach(m => { m.receiveShadow = true; m.castShadow = true; m.raycast = () => {}; g.add(m); });
  // panel seams on the riser's front face
  for (let y = 40; y < HE_BY; y += 120) {
    const seam = k.boxAt(x1, y - .3, HE_BH + 10, x1 + .4, y + .3, h - 10, k.toon('#b3aa98'));
    seam.raycast = () => {}; g.add(seam);
  }
  return g;
}

/* ---------- a glass jar with tinted liquid, tape labels and (for tap water) a running faucet ---------- */
function heJar(T, k, s0) {
  const { dx, dy, h, level } = HE_JAR, row = HE_ROWS[s0.row], c = row.x, b = row.base, yc = s0.y;
  const root = new T.Group(), [col, a] = HE_LIQ[s0.liq];
  const glass = k.boxAt(c - dx, yc - dy, b, c + dx, yc + dy, b + h,
    new T.MeshToonMaterial({ color: '#d7edf2', transparent: true, opacity: .2, depthWrite: false, side: T.DoubleSide }));
  glass.renderOrder = 2;
  k.edges(glass);
  const side = new T.MeshToonMaterial({ color: col, transparent: true, opacity: a, depthWrite: false });
  const top = new T.MeshToonMaterial({ color: mix(col, '#ffffff', .3), transparent: true, opacity: Math.min(1, a + .1), depthWrite: false });
  const liquid = k.boxAt(c - dx + 1.2, yc - dy + 1.2, b + 1.2, c + dx - 1.2, yc + dy - 1.2, b + level, [side, side, top, side, side, side]);
  liquid.renderOrder = 1;
  k.edges(liquid, k.lineMat(mix(col, '#000000', .35), 1.2));
  root.add(liquid, glass);
  const tape = heTape(T, s0);
  root.add(tape.front, tape.back);
  tape.front.position.copy(heW(T, c + dx + .35, yc, b + 7 + tape.h / 2));
  tape.back.position.copy(heW(T, c - dx - .35, yc, b + 7 + tape.h / 2));
  tape.back.rotation.y = Math.PI;
  const out = { root, setLit: tape.setLit };
  if (s0.liq === 'wash') Object.assign(out, heFaucet(T, k, root, c, yc, b, s0.row));
  return out;
}

// the tape: a canvas texture with the jar's words and its station number in a black badge
function heTapeCanvas(s0, lit) {
  const two = s0.lines.length > 1, th = two ? 36 : 21, H = th + 22, Wd = 52, px = 9;
  const cv = document.createElement('canvas'); cv.width = Wd * px; cv.height = H * px;
  const g = cv.getContext('2d'); g.scale(px, px);
  const y0 = H - th - .6;
  g.beginPath(); g.roundRect(.6, y0, Wd - 1.2, th, 3);
  g.fillStyle = lit ? ACCENT : '#fbf7ea'; g.fill(); g.lineWidth = 1.1; g.strokeStyle = INK; g.stroke();
  g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle';
  s0.lines.forEach((t, i) => {               // long words (SCOTT'S) shrink to fit the tape
    g.font = '800 13px ui-monospace, Menlo, monospace';
    const fs = Math.min(13, 13 * (Wd - 7) / g.measureText(t).width);
    g.font = `800 ${fs.toFixed(2)}px ui-monospace, Menlo, monospace`;
    g.fillText(t, Wd / 2, two ? y0 + 10 + i * 15 : y0 + th / 2 + .5);
  });
  const bx = 10, by = y0 - 11;
  g.beginPath(); g.arc(bx, by, 7.5, 0, 2 * Math.PI); g.fillStyle = INK; g.fill();
  g.fillStyle = '#fbf7ea'; g.font = '800 9.5px ui-monospace, Menlo, monospace'; g.fillText(String(s0.num), bx, by + .5);
  return { cv, H, Wd };
}
function heTape(T, s0) {
  const tex = lit => { const { cv } = heTapeCanvas(s0, lit), t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; };
  const first = heTapeCanvas(s0, false), texs = { false: tex(false) };
  const mat = new T.MeshBasicMaterial({ map: texs.false, alphaTest: .5 });
  const geo = new T.PlaneGeometry(first.Wd, first.H);
  const front = new T.Mesh(geo, mat), back = new T.Mesh(geo, mat);
  let cur = false;
  const setLit = lit => {
    if (lit === cur) return;
    cur = lit;
    if (!texs[lit]) texs[lit] = tex(lit);
    mat.map = texs[lit]; mat.needsUpdate = true;
  };
  return { front, back, h: first.H, setLit };
}

// running tap water: a chrome faucet (from the shelf face in front, from a standpipe at the back), a stream and ripples.
// It sits just below the height the rack is carried at, so the rack passes over it.
function heFaucet(T, k, root, c, yc, b, row) {
  const y = yc + 21, zt = b + HE_JAR.h + 6, xs = c - 14, lz = b + HE_JAR.level, metal = k.toon(METAL.m);
  if (row === 'front') root.add(k.rod([HE_RISER.x1, y, zt], [xs, y, zt], 2.2, metal));
  else root.add(k.rod([2, y, HE_RISER.h], [2, y, zt], 2.2, metal), k.rod([2, y, zt], [xs, y, zt], 2.2, metal));
  root.add(k.rod([xs, y, zt + .5], [xs, y, zt - 6], 2.2, metal));
  const stream = new T.Mesh(new T.CylinderGeometry(1.2, 1.2, zt - 6 - lz, 10), new T.MeshBasicMaterial({ color: '#9fd0ef', transparent: true, opacity: .85, depthWrite: false }));
  stream.position.copy(heW(T, xs, y, (zt - 6 + lz) / 2)); stream.renderOrder = 3;
  root.add(stream);
  const ripples = [0, .5].map(phase => {
    const m = new T.Mesh(new T.RingGeometry(.86, 1, 28), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false, side: T.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.copy(heW(T, xs, y, lz + .3)); m.renderOrder = 3; m.userData.phase = phase;
    root.add(m); return m;
  });
  return { ripples };
}

/* ---------- the start tray and the mounting tile carry a floating name tag that always faces the camera ---------- */
function heTag(T, text) {
  const draw = lit => {
    const fs = 30, cv = document.createElement('canvas'), g = cv.getContext('2d');
    g.font = `800 ${fs}px ui-monospace, Menlo, monospace`;
    const w = Math.ceil(g.measureText(text).width + fs * 1.4), h = Math.ceil(fs * 1.8);
    cv.width = w + 8; cv.height = h + 8;
    g.font = `800 ${fs}px ui-monospace, Menlo, monospace`;
    g.beginPath(); g.roundRect(4, 4, w, h, h / 2); g.fillStyle = lit ? ACCENT : '#fff8e4'; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, cv.width / 2, cv.height / 2 + 1);
    const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace;
    return { t, aspect: cv.width / cv.height };
  };
  const texs = { false: draw(false) }, mat = new T.SpriteMaterial({ map: texs.false.t });
  const sprite = new T.Sprite(mat); sprite.renderOrder = 10;
  sprite.scale.set(22 * texs.false.aspect, 22, 1);
  let cur = false;
  const setLit = lit => { if (lit === cur) return; cur = lit; if (!texs[lit]) texs[lit] = draw(lit); mat.map = texs[lit].t; mat.needsUpdate = true; };
  return { sprite, setLit };
}

function heTray(T, k, s0) {
  const row = HE_ROWS[s0.row], c = row.x, b = row.base, yc = s0.y, root = new T.Group();
  const tray = k.edges(k.boxAt(c - 18, yc - 20, b, c + 18, yc + 20, b + 3, k.toon(METAL.m)));
  tray.castShadow = tray.receiveShadow = true;
  const tag = heTag(T, `${s0.num} ${s0.label}`);
  tag.sprite.position.copy(heW(T, c + 26, yc, b + 14));
  root.add(tray, tag.sprite);
  return { root, setLit: tag.setLit };
}

function hePad(T, k, s0) {
  const c = HE_ROWS.back.x, b = HE_ROWS.back.base, yc = s0.y, root = new T.Group();
  const tile = k.edges(k.boxAt(c - 20, yc - 36, b, c + 20, yc + 40, b + 2, k.toon(CERAMIC.l)));
  tile.receiveShadow = true;
  const bottle = k.hull(new T.Mesh(new T.CylinderGeometry(4.5, 4.5, 18, 20), k.toon('#7a4726')), .7);
  bottle.position.copy(heW(T, 62, yc + 30, b + 9)); bottle.castShadow = true;
  const cap = k.hull(new T.Mesh(new T.CylinderGeometry(2.2, 2.2, 5, 14), k.toon(DARK.m)), .5);
  cap.position.copy(heW(T, 62, yc + 30, b + 20.5));
  const tag = heTag(T, `${s0.num} ${s0.label}`);
  tag.sprite.position.copy(heW(T, c, yc + 2, b + 40));
  root.add(tile, bottle, cap, tag.sprite);
  return { root, setLit: tag.setLit };
}

/* ---------- slides and the rack ---------- */
// one slide in its own frame: x = across (25 mm), y = along (75 mm, frosted label at the top), z = through (1 mm; tissue on +z)
function heSlide(T, k, tissueMat) {
  const g = new T.Group();
  const glass = k.edges(new T.Mesh(new T.BoxGeometry(25, 75, 1), k.toon(HE_GLASS.l)), k.INK_THIN);
  glass.position.set(0, 37.5, .5); glass.castShadow = true;
  const frost = new T.Mesh(new T.PlaneGeometry(23.4, 16), new T.MeshBasicMaterial({ color: '#fbfaf5' }));
  frost.position.set(0, 66, 1.05);
  const tissue = new T.Mesh(new T.CircleGeometry(1, 28), tissueMat);
  tissue.scale.set(8.5, 10.5, 1); tissue.position.set(0, 20, 1.08);
  g.add(glass, frost, tissue);
  return g;
}

function heRack(T, k, tissueMat) {
  const root = new T.Group(), metal = k.toon(METAL.m), v = (x, y, z) => heWv(T, x, y, z);
  const base = k.edges(new T.Mesh(new T.BoxGeometry(32, 3, 28), metal));
  base.position.copy(v(0, 0, 1.5)); base.castShadow = true;
  root.add(base);
  for (const x of [-13, 13]) for (const y of [-16, 16]) root.add(k.rodW(v(x, y, 3), v(x, y, 44), .9, metal));
  root.add(k.rodW(v(0, -16, 44), v(0, -16, 92), 1, metal), k.rodW(v(0, 16, 44), v(0, 16, 92), 1, metal), k.rodW(v(0, -16, 92), v(0, 16, 92), 1.4, metal));
  const slides = [-10, -5, 0, 5, 10].map(dx => { const s = heSlide(T, k, tissueMat); s.position.copy(v(dx, 0, 4)); root.add(s); return s; });
  // the slide shown under the microscope wears a ring in the accent colour
  const ring = new T.Mesh(new T.RingGeometry(13.2, 15, 36), new T.MeshBasicMaterial({ color: ACCENT, side: T.DoubleSide }));
  ring.position.set(0, 20, 1.2);
  slides[4].add(ring);
  return { root, slides, ring };
}

// the slide that leaves the rack to be mounted, with the DPX drop, the dropper and the coverslip
function heLooseSlide(T, k, tissueMat) {
  const root = new T.Group(); root.visible = false;
  root.add(heSlide(T, k, tissueMat));
  const dpx = new T.Mesh(new T.CircleGeometry(1, 28), new T.MeshBasicMaterial({ color: '#e2b766', transparent: true, opacity: .45, depthWrite: false }));
  dpx.position.set(0, 28, 1.12); dpx.visible = false;
  const dropper = new T.Group();
  const tube = k.hull(new T.Mesh(new T.CylinderGeometry(1.3, 1.3, 24, 12), k.toon(CLEAR.l)), .5);
  tube.rotation.x = Math.PI / 2; tube.position.set(0, 20, 51);
  const bulb = k.hull(new T.Mesh(new T.SphereGeometry(3.6, 16, 12), k.toon(DARK.m)), .5);
  bulb.position.set(0, 20, 66);
  const drop = new T.Mesh(new T.SphereGeometry(2.2, 14, 10), k.toon('#e2b766'));
  drop.position.set(0, 20, 35);
  dropper.add(tube, bulb, drop); dropper.visible = false;
  const pivot = new T.Group(); pivot.position.set(0, 3, 1.2);
  const cover = k.edges(new T.Mesh(new T.BoxGeometry(22, 50, .4),
    new T.MeshToonMaterial({ color: '#ffffff', transparent: true, opacity: .45, depthWrite: false })), k.INK_THIN);
  cover.position.set(0, 25, .2); cover.renderOrder = 4;
  pivot.add(cover); pivot.visible = false;
  root.add(dpx, dropper, pivot);
  return { root, dpx, dropper, drop, pivot };
}
