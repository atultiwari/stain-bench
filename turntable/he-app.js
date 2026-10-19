/* ============================================================
   H&E staining, 3D: the app. Loads Three.js (pinned, from jsDelivr, through the import map),
   builds the bench, runs the protocol forward-only and drives the panel under the figure.
   A classic script using dynamic import(), so the page also works when opened straight from disk.
   ============================================================ */
const HE_URL = new URLSearchParams(location.search);
const HE_SPEED = Math.min(20, Math.max(.1, +HE_URL.get('speed') || 1));      // ?speed=4 for quick checks

/* ---------- state (bench coordinates, as in the 2D figure) ---------- */
const heFresh = () => ({ step: 0, from: 'wax', to: 'wax', blend: 1, at: 0, now: 0, rx: HE_ROWS.front.x, ry: HE_STATIONS[0].y,
  rz: HE_BH + 3, busy: false, lab: 0, el: 0, dwelling: false, ms: null });   // lab: seconds of bath time done; el: seconds into the current bath
const st = { playing: false, paused: false, loop: false, token: 0, ...heFresh() };

/* ---------- a tiny animation runner: each move eases values over time ---------- */
const heAnims = new Set();
function heRun(moves, done) {
  const token = st.token;
  let i = -1, mv = null, t = 0;
  const next = () => { if (++i >= moves.length) return false; mv = moves[i](); t = 0; return true; };
  next();
  heAnims.add(dt => {
    if (token !== st.token) return false;          // stopped
    if (st.paused) return true;
    t += dt; const u = Math.min(1, t / mv.dur); mv.step(u);
    if (u < 1) return true;
    if (next()) return true;
    done(); return false;
  });
}
const heTween = (key, to, dur) => () => { const a = st[key]; return { dur, step: u => { st[key] = a + (to - a) * ease(u); } }; };

function heMovesTo(key, hold, blendHere, quick) {
  const i = HE_IDX[key], s0 = HE_STATIONS[i], row = HE_ROWS[s0.row], list = [];
  list.push(() => {                                 // lift clear of every jar (and the faucets) first
    const safe = (heRowOfX(st.rx) === 'back' || s0.row === 'back') ? HE_SAFE.back : HE_SAFE.front, a = st.rz;
    return { dur: a >= safe - .1 ? .01 : .5, step: u => { st.rz = a + (safe - a) * ease(u); } };
  });
  list.push(() => {
    const ax = st.rx, ay = st.ry, d = Math.hypot(row.x - ax, s0.y - ay); st.at = i; st.now = i; st.el = 0;
    return { dur: .25 + d / 600, step: u => { st.rx = ax + (row.x - ax) * ease(u); st.ry = ay + (s0.y - ay) * ease(u); } };
  });
  list.push(heTween('rz', row.base + 4, .55));
  // the bath: the card's clock runs through the station's lab time while the rack sits (or dips) here
  const bath = (u) => { st.dwelling = u < 1; st.el = u * s0.secs; if (u >= 1) st.lab += s0.secs; if (blendHere) st.blend = u; };
  if (quick) list.push(() => ({ dur: 1.2, step: u => { st.rz = row.base + 4 + Math.abs(Math.sin(u * Math.PI * 3)) * 16; bath(u); } }));
  else list.push(() => ({ dur: hold, step: bath }));
  return list;
}

function heMountMoves() {
  const pad = HE_STATIONS[HE_IDX.mount], target = [HE_ROWS.back.x, pad.y - 35, HE_RISER.h + 2.2];
  const lerp3 = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
  return [
    () => { st.ms = { O: [st.rx + 10, st.ry, st.rz + 4], rot: 0, drop: 0, dpx: 0, cs: 0, onTile: false }; st.now = HE_IDX.mount;
            const a = st.ms.O.slice(), b = [a[0], a[1], HE_SAFE.back + 6];
            return { dur: .8, step: u => { st.ms.O = lerp3(a, b, ease(u)); } }; },
    () => { const a = st.ms.O.slice(), b = [target[0], target[1], target[2] + 40];
            return { dur: 1.2, step: u => { st.ms.O = lerp3(a, b, ease(u)); st.ms.rot = ease(u); } }; },
    () => { const a = st.ms.O.slice(); return { dur: .5, step: u => { st.ms.O = lerp3(a, target, ease(u)); if (u >= 1) st.ms.onTile = true; } }; },
    () => ({ dur: 1.4, step: u => { st.ms.drop = u; st.ms.dpx = u >= 1 ? .15 : 0; } }),
    () => ({ dur: 2.6, step: u => { st.ms.cs = u; st.ms.dpx = .15 + .85 * Math.max(0, (u - .3) / .7); st.blend = u; } }),
    () => ({ dur: 1.2, step: () => {} }),                     // a moment to see the finished mount
  ];
}

/* ---------- steps, taps and the player ---------- */
function heGo(n, after) {
  if (st.busy) return heFlash('The rack is still moving');
  if (n < st.step) return heFlash(`${HE_STEPS[n].label} is already done`);
  if (n > st.step) return heFlash(heWhyNot(n));
  const S1 = HE_STEPS[n];
  st.busy = true; st.from = st.to; st.to = S1.to; st.blend = 0;
  heFollow.paused = false;                         // a new step: the phone camera follows the rack again
  heNote(`Step ${n + 1} of ${HE_STEPS.length}: ${S1.label}`, S1.doing);
  let moves = [];
  if (S1.mount) moves = heMountMoves();
  else S1.path.forEach((key, j) => { moves = moves.concat(heMovesTo(key, j === 0 ? 1.5 : .6, j === 0, S1.quick && j === 0)); });
  heRun(moves, () => {
    st.blend = 1; st.busy = false; st.step++;
    heNote(`Step ${n + 1} of ${HE_STEPS.length}: ${S1.label}, done`, S1.done);
    heSyncPanel();
    if (after) after();
    else if (st.playing) heWait(1.2, hePlayNext);          // Play was pressed during a manual step
  });
  heSyncPanel();
}
function heWhyNot(n) {
  const key = HE_STEPS[n].to;
  if (st.step === 0) return 'Wax keeps water-based stains out: dewax first';
  if (key === 'eosin' && st.step <= 1) return 'Haematoxylin comes first: nuclei, then eosin for the rest';
  if (key === 'mounted') return 'Water under a coverslip turns it cloudy: dehydrate and clear first';
  if (key === 'clear' && st.step < 4) return 'Not stained yet: dehydrating now would leave it colourless';
  return `Next step: ${HE_STEPS[st.step].label}`;
}
// tapping a jar runs the step that starts there; tapping the rack runs the next step
function heTapStation(i) {
  if (st.playing) return heFlash('Autoplay is running: pause or stop it first');
  if (st.step >= HE_STEPS.length) return heFlash('All done: press Stop to start over');
  const key = HE_STATIONS[i].key, n = HE_STEPS.findIndex(S1 => S1.path[0] === key);
  if (n >= st.step) return heGo(n);                // runs it, or explains why not yet
  const s1 = HE_STATIONS[HE_IDX[HE_STEPS[st.step].path[0]]];
  heFlash(n >= 0 ? `${HE_STEPS[n].label} is already done. Next: tap ${s1.num} ${s1.label}`
                 : `${HE_STATIONS[i].label} comes inside a step. Next: tap ${s1.num} ${s1.label}`);
}
function heTapRack() {
  if (st.playing) return heFlash('Autoplay is running: pause or stop it first');
  if (st.step >= HE_STEPS.length) return heFlash('All done: press Stop to start over');
  heGo(st.step);
}
function heWait(sec, then) { heRun([() => ({ dur: sec, step: () => {} })], then); }
function hePlayNext() {
  if (!st.playing) return;
  if (st.step < HE_STEPS.length) return heGo(st.step, () => heWait(1.2, hePlayNext));
  if (st.loop) return heWait(3, () => { heResetState(); st.playing = true; heSyncPlayer(); heWait(1, hePlayNext); });
  st.playing = false; heSyncPlayer();
}
function hePlay() {
  if (st.playing && st.paused) { st.paused = false; return heSyncPlayer(); }
  if (st.playing) return;
  if (st.step >= HE_STEPS.length) heResetState();
  st.playing = true; st.paused = false; heSyncPlayer();
  if (!st.busy) hePlayNext();
  else heFlash('Autoplay picks up after this step');
}
function hePause() { if (!st.playing || st.paused) return; st.paused = true; heSyncPlayer(); }
function heStop() { st.playing = false; st.paused = false; heResetState(); heSyncPlayer(); }
function heResetState() {
  st.token++;
  Object.assign(st, heFresh());
  heNote('Ready', HE_READY);
  heSyncPanel();
}

/* ---------- the panel: buttons, stats, active jar, notes, microscope ---------- */
let heToastT = 0;
function heFlash(text) {
  const t = document.getElementById('toast');
  t.textContent = text; t.classList.add('on');
  clearTimeout(heToastT); heToastT = setTimeout(() => t.classList.remove('on'), 2600);
}
function heNote(title, text) {
  document.getElementById('heNoteTitle').textContent = title;
  document.getElementById('heNoteText').textContent = text;
}
function heSyncPlayer() {
  const pb = document.getElementById('hePlay'), ps = document.getElementById('hePause');
  // Play is the only way to start or resume; Pause and Stop only work while a run is going
  const run = st.playing && !st.paused;
  pb.textContent = run ? '▶ Playing' : st.paused ? '▶ Resume' : '▶ Play';
  pb.disabled = run;
  pb.setAttribute('aria-pressed', String(run));
  ps.textContent = '❚❚ Pause';
  ps.disabled = !run;
  document.getElementById('heStop').disabled = !st.playing;
  document.getElementById('heLoop').checked = st.loop;
}
function heSyncPanel() {
  const sNow = HE_STATIONS[st.ms ? HE_IDX.mount : st.now];
  document.getElementById('heNow').textContent = sNow.name;
  document.getElementById('heNowNum').textContent = sNow.num;
  document.getElementById('heNowSwatch').style.background = HE_LIQ[sNow.liq] ? HE_LIQ[sNow.liq][0] : '#d9d4c6';
  const clock = HE_PHONE.matches ? heClockShort : heClock;
  document.getElementById('heNowTime').textContent = sNow.secs ? `${clock(st.el)} of ${clock(sNow.secs)}` : 'no bath time';
  document.getElementById('nowChip').classList.toggle('busy', st.busy);
  document.getElementById('statStep').textContent = `${st.step} / ${HE_STEPS.length}`;
  document.getElementById('statTime').textContent = heLabTime(st.lab + (st.dwelling ? st.el : 0));
  document.querySelectorAll('#btns .act').forEach((b, i) => {
    b.classList.toggle('done', i < st.step);
    b.classList.toggle('next', i === st.step && !st.busy);
  });
  heDrawScope(st);
  hePhoneSync();
}
function heBuildButtons() {
  const nav = document.getElementById('btns');
  HE_STEPS.forEach((S1, n) => {
    const b = document.createElement('button');
    b.className = 'act'; b.textContent = `${n + 1}. ${S1.label}`;
    b.onclick = () => st.playing ? heFlash('Autoplay is running: pause or stop it first') : heGo(n);
    nav.appendChild(b);
  });
  document.getElementById('hePlay').onclick = hePlay;
  document.getElementById('hePause').onclick = hePause;
  document.getElementById('heStop').onclick = heStop;
  document.getElementById('heLoop').onchange = e => { st.loop = e.target.checked; };
  hePhoneBuild();
}
// ?state=eosin starts just after that step (handy for screenshots and teaching)
function heApplyParams() {
  const k = HE_STEPS.findIndex(S1 => S1.to === HE_URL.get('state'));
  if (k < 0) return;
  const S1 = HE_STEPS[Math.min(k, 5)], last = HE_IDX[S1.path[S1.path.length - 1]], s0 = HE_STATIONS[last];
  Object.assign(st, { step: k + 1, from: HE_STEPS[k].to, to: HE_STEPS[k].to, blend: 1, at: last, now: last,
    rx: HE_ROWS[s0.row].x, ry: s0.y, rz: HE_ROWS[s0.row].base + 4, lab: heLabAfter(k + 1), el: s0.secs });
  if (HE_STEPS[k].mount) { const pad = HE_STATIONS[HE_IDX.mount]; st.ms = { O: [HE_ROWS.back.x, pad.y - 35, HE_RISER.h + 2.2], rot: 1, drop: 1, dpx: 1, cs: 1, onTile: true }; }
}

/* ============================================================
   3D: renderer, camera, picking and the per-frame sync from state to scene
   ============================================================ */
const HE_VIEWS = {                                  // azimuth (0 = front, + = from the right), polar from straight up, both in degrees
  iso: [-38, 60], front: [0, 70], back: [180, 64], left: [-80, 62], right: [80, 62], top: [0, 1],
};

async function heBoot() {
  heBuildButtons();
  heApplyParams();
  heNote(st.step ? `After step ${st.step}` : 'Ready', st.step ? HE_STEPS[st.step - 1].done : HE_READY);
  heSyncPlayer(); heSyncPanel();
  let T, L;
  try {
    T = await import('three');
    const [oc, ls2, lsg, lm] = await Promise.all(['controls/OrbitControls.js', 'lines/LineSegments2.js', 'lines/LineSegmentsGeometry.js', 'lines/LineMaterial.js']
      .map(p => import('three/addons/' + p)));
    L = { OrbitControls: oc.OrbitControls, LineSegments2: ls2.LineSegments2, LineSegmentsGeometry: lsg.LineSegmentsGeometry, LineMaterial: lm.LineMaterial };
  } catch (err) {
    document.getElementById('msg').textContent = 'Could not load the 3D library (Three.js needs an internet connection the first time).';
    throw err;
  }
  const canvas = document.getElementById('gl');
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, antialias: true }); }
  catch (err) { document.getElementById('msg').textContent = 'This browser cannot show 3D (WebGL is off or unavailable).'; throw err; }
  document.getElementById('msg').remove();
  heStart(T, L, renderer, canvas);
}

function heStart(T, L, renderer, canvas) {
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const world = heBuild(T, L);
  const camera = new T.PerspectiveCamera(30, 1, 5, 8000);
  const controls = new L.OrbitControls(camera, canvas);
  Object.assign(controls, { enableDamping: true, dampingFactor: .09, enablePan: false, minDistance: 220, maxDistance: 2600,
    maxPolarAngle: Math.PI * .47, rotateSpeed: .8, zoomSpeed: .9 });
  controls.target.set(0, 82, 0);
  const cam = heCameraRig(T, camera, controls);
  const stage = document.getElementById('stage');
  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    world.lineMats.forEach(m => m.resolution.set(w, h));
    cam.refit();
  };
  new ResizeObserver(resize).observe(stage);
  resize();
  cam.go(HE_URL.get('view') in HE_VIEWS ? HE_URL.get('view') : 'iso', 0);
  hePicking(T, canvas, camera, world, cam);
  document.querySelectorAll('[data-view]').forEach(b => { b.onclick = () => { heFollow.paused = HE_PHONE.matches; cam.go(b.dataset.view); }; });
  heCameraButtons(cam);
  heBenchView = () => cam.go('iso');
  // a real drag, pinch or wheel (not a tap) pauses the phone's follow cam until the next step starts
  let dragFrom = null;
  canvas.addEventListener('pointerdown', e => { dragFrom = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointermove', e => {
    if (dragFrom && e.buttons && HE_PHONE.matches && Math.hypot(e.clientX - dragFrom[0], e.clientY - dragFrom[1]) > 7) heFollow.paused = true;
  });
  canvas.addEventListener('pointerup', () => { dragFrom = null; });
  canvas.addEventListener('wheel', () => { if (HE_PHONE.matches) heFollow.paused = true; }, { passive: true });
  let last = performance.now();
  renderer.setAnimationLoop(now => {
    const dt = Math.min(.05, (now - last) / 1000) * HE_SPEED; last = now;
    [...heAnims].forEach(fn => { if (!fn(dt)) heAnims.delete(fn); });
    cam.tick(dt / HE_SPEED);
    heFollowTick(T, camera, controls, cam, dt / HE_SPEED);
    controls.update();
    heSyncScene(T, world, now / 1000);
    if (st.busy) heSyncPanel();
    renderer.render(world.scene, camera);
  });
  window.HE3D = { st, follow: heFollow, bench: heSetBench, view: cam.go, go: heGo, play: hePlay, stop: heStop, tapStation: heTapStation, tapRack: heTapRack, camera, controls };
  if (HE_URL.get('autoplay') === '1') { st.loop = true; heSyncPlayer(); hePlay(); }
}

// camera presets: a short eased swing between views; the distance fits the bench to the canvas
function heCameraRig(T, camera, controls) {
  let tween = null, fitDist = 900, current = 'iso';
  const sph = new T.Spherical();
  const place = (az, pol, r) => {
    sph.set(r, pol, az);
    camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(sph));
    camera.lookAt(controls.target);
  };
  const fit = () => {
    const tanV = Math.tan(T.MathUtils.degToRad(camera.fov / 2)), tanH = tanV * camera.aspect;
    return camera.aspect < 1.2 ? Math.max(320 / tanH, 200 / tanV) + 30 : Math.max(430 / tanH, 210 / tanV) + 60;   // portrait: the corner view never shows the full bench length side-on
  };
  return {
    refit() { fitDist = fit(); controls.maxDistance = fitDist * 2.2; },
    go(name, dur = .9) {
      current = name;
      const [az, pol] = HE_VIEWS[name].map(T.MathUtils.degToRad);
      const r = fitDist * ({ top: 1.05, left: 1.35, right: 1.35 }[name] || 1);
      const from = new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      if (!dur) return place(az, pol, r);
      let dAz = az - from.theta; dAz = Math.atan2(Math.sin(dAz), Math.cos(dAz));     // the short way round
      tween = { t: 0, dur, a: [from.theta, from.phi, from.radius], d: [dAz, pol - from.phi, r - from.radius] };
    },
    reset() {
      if (HE_PHONE.matches) { heSetBench(false); heFollow.paused = false; return; }   // phones: back to following the rack
      this.go('iso');
    },
    // the round buttons: turn, tilt and zoom by a step from wherever the camera is now
    nudge(dAz, dPol, kR) {
      const from = new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      const pol = T.MathUtils.clamp(from.phi + dPol, .02, controls.maxPolarAngle);
      const r = T.MathUtils.clamp(from.radius * kR, controls.minDistance, controls.maxDistance);
      tween = { t: 0, dur: .45, a: [from.theta, from.phi, from.radius], d: [dAz, pol - from.phi, r - from.radius] };
    },
    tick(dt) {
      if (!tween) return;
      tween.t = Math.min(1, tween.t + dt / tween.dur);
      const u = ease(tween.t), [a, p, r] = tween.a.map((v, i) => v + tween.d[i] * u);
      place(a, p, r);
      if (tween.t >= 1) tween = null;
    },
    get current() { return current; },
    get busy() { return !!tween; },
  };
}

const HE_STEP_AZ = Math.PI / 6, HE_STEP_TILT = Math.PI / 15, HE_STEP_ZOOM = .8;
function heCameraButtons(cam) {
  const acts = {
    'rot-l': () => cam.nudge(-HE_STEP_AZ, 0, 1), 'rot-r': () => cam.nudge(HE_STEP_AZ, 0, 1),
    'tilt-u': () => cam.nudge(0, -HE_STEP_TILT, 1), 'tilt-d': () => cam.nudge(0, HE_STEP_TILT, 1),
    'zoom-in': () => cam.nudge(0, 0, HE_STEP_ZOOM), 'zoom-out': () => cam.nudge(0, 0, 1 / HE_STEP_ZOOM),
    reset: () => cam.reset(), full: heToggleFullscreen,
  };
  document.querySelectorAll('[data-cam]').forEach(b => {
    b.onclick = () => { if (HE_PHONE.matches && b.dataset.cam !== 'reset') heFollow.paused = true; acts[b.dataset.cam](); };
  });
}

/* ---------- fullscreen on the bench's wrapper (Esc exits; the button swaps icon and label) ---------- */
const heFsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
function heToggleFullscreen() {
  const wrap = document.getElementById('figwrap');
  const req = wrap.requestFullscreen || wrap.webkitRequestFullscreen, exit = document.exitFullscreen || document.webkitExitFullscreen;
  try {
    const p = heFsEl() ? exit.call(document) : req.call(wrap);
    if (p && p.catch) p.catch(() => heFlash('Full screen is not available here'));
  } catch { heFlash('Full screen is not available here'); }
}
function heSyncFullscreen() {
  const on = !!heFsEl(), b = document.querySelector('[data-cam=full]');
  b.innerHTML = HE_ICONS[on ? 'exit' : 'full'];
  b.title = on ? 'Exit full screen (Esc)' : 'Full screen';
  b.setAttribute('aria-label', b.title);
  b.setAttribute('aria-pressed', String(on));
}
const HE_ICONS = {
  full: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 7.5V3h4.5M12.5 3H17v4.5M17 12.5V17h-4.5M7.5 17H3v-4.5"/></svg>',
  exit: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 3v4.5H3M12.5 3v4.5H17M17 12.5h-4.5V17M3 12.5h4.5V17"/></svg>',
};
document.addEventListener('fullscreenchange', heSyncFullscreen);
document.addEventListener('webkitfullscreenchange', heSyncFullscreen);
if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) document.documentElement.classList.add('no-fs');

// a tap (not a drag) on a jar or the rack runs a step; a double tap on empty space resets the view
function hePicking(T, canvas, camera, world, cam) {
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  const targets = [...world.stations.map(s => s.root), world.rack.root];
  let down = null, lastEmpty = 0;
  const hit = e => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(targets, true).find(o => o.object.visible);
    return h ? h.object.userData : null;
  };
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7 || performance.now() - down.t > 600) { down = null; return; }
    down = null;
    const u = hit(e);
    if (u && u.rack) return heTapRack();
    if (u && u.station !== undefined) return heTapStation(u.station);
    const now = performance.now();
    if (now - lastEmpty < 380) { cam.reset(); lastEmpty = 0; } else lastEmpty = now;
  });
  canvas.addEventListener('pointermove', e => {
    if (e.buttons || e.pointerType !== 'mouse') return;
    const u = hit(e);
    canvas.style.cursor = u && (u.rack || u.station !== undefined) ? 'pointer' : '';
  });
}

// copy the state into the scene every frame: rack position, tissue colour, lit tapes, the loose slide, ripples
function heSyncScene(T, world, time) {
  const { rack, loose, stations } = world;
  rack.root.position.copy(heW(T, st.rx, st.ry, st.rz));
  world.tissueMat.color.set(heTissue(heLookOf(st.from, st.to, st.blend)));
  rack.slides[4].visible = !st.ms;
  stations.forEach((s, i) => s.setLit(heKind(HE_STATIONS[i]) === 'pad' ? !!st.ms : st.at === i && !st.ms));
  loose.root.visible = !!st.ms;
  if (st.ms) hePlaceLoose(T, loose, st.ms);
  world.ripples.forEach(m => {
    const ph = (time / .6 + m.userData.phase) % 1, r = 3 + ph * 6;
    m.scale.set(r, r, 1); m.material.opacity = Math.max(0, .9 - r / 10);
  });
}

// the loose slide's frame turns from standing (in the rack) to flat, tissue up (on the tile)
function hePlaceLoose(T, loose, m) {
  const { A, N } = heFrame(m.rot), a = heWv(T, ...A), n = heWv(T, ...N), u = new T.Vector3().crossVectors(a, n);
  loose.root.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(u, a, n));
  loose.root.position.copy(heW(T, ...m.O));
  loose.dropper.visible = m.drop > 0 && m.drop < 1;
  loose.drop.position.z = 1 + 34 - 34 * ease(m.drop);
  loose.dpx.visible = m.dpx > 0;
  loose.dpx.scale.set(3 + 7 * m.dpx, 22 * m.dpx, 1);
  loose.pivot.visible = m.cs > 0;
  const lift = Math.max(0, 1 - m.cs / .3) * 24, ang = (m.cs < .3 ? 1 : 1 - ease((m.cs - .3) / .7)) * 35 * Math.PI / 180;
  loose.pivot.position.z = 1.2 + lift;
  loose.pivot.rotation.x = ang;
}

heBoot();
