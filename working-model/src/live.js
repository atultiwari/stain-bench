// Live code. Inlined after the kit, the world and the model (exports stripped),
// so `iso`, `cylinder`, `solidSvg`, `sectionAt`, `clockAt`, `BATHS`… are in scope.
// Every number written to the page is read from the model here; nothing is typed in.

const svg = document.querySelector(".he-fig svg");
const part = (name) => svg.querySelector(`[data-part="${name}"]`);
const rack = part("rack"), carriage = part("carriage"), rodTop = part("rod-top");
const liveSlide = part("live-slide"), dropper = part("dropper"), words = part("words");
const pickInRack = part("pick-in-rack");
const slots = [...svg.querySelectorAll("[data-slot]")];
const lcd = svg.querySelector("#he-lcd");
const win = document.querySelector(".he-window");
const ui = (sel) => document.querySelector(sel);
const pills = [...document.querySelectorAll(".he-pill")];
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
const CHROME = "#cfd6da", GLASS = "#e6f0ee";

const tonesOf = (base) => `--sb-paper:${base};--sb-top:${mix(base, "#ffffff", 0.34)};--sb-shade-0:${mix(base, "#1f2a44", 0.26)};--sb-shade-1:${mix(base, "#1f2a44", 0.26)};--sb-shade-2:${mix(base, "#1f2a44", 0.14)};--sb-shade-3:${mix(base, "#1f2a44", 0.14)}`;
const paintLive = (paths, base) => `<g style="${tonesOf(base)}">${solidSvg(paths, { tone: "hi", crease: "none" })}</g>`;
const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const lerp = (a, b, p) => a + (b - a) * p;
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const FLOOR = 1.6, RIM = FLOOR + JAR.h;
const MOUNT_INDEX = BATHS.length;

// ---- the timeline: built from the model, one list of segments per step ----
const REST = Object.freeze({ cx: START_X, rz: RACK_REST, picked: 0, bx: 0, bz: 0, phi: 0, drop: 0, dropper: 0, cover: 0, coverQ: 0, coverA: 0, spread: 0 });
const MOUNT_PLAY = { pick: 1.3, carry: 1.2, lay: 1.8, drop: 1.8, cover: 2.6, seal: 0.7 };
const MOUNT_TOTAL = Object.values(MOUNT_PLAY).reduce((a, b) => a + b, 0);

function buildTimeline() {
  const steps = [];
  let pose = REST, at = 0;
  for (const step of STEPS) {
    const segs = [];
    const push = (seg) => {
      const end = seg.apply(seg.start = pose, 1);
      segs.push({ ...seg, end });
      pose = end;
    };
    for (const b of step.baths) {
      if (b === MOUNT_INDEX) {
        let real = 0;
        for (const [kind, dur] of Object.entries(MOUNT_PLAY)) {
          push({ kind, dur, bath: b, real0: real, real1: real + (MOUNT.seconds * dur) / MOUNT_TOTAL, apply: MOUNT_MOVES[kind] });
          real += (MOUNT.seconds * dur) / MOUNT_TOTAL;
        }
        continue;
      }
      const moves = [];
      if (pose.rz < RACK_UP - 0.01) moves.push({ kind: "lift", dur: 0.55 });
      const from = Math.round(pose.cx / PITCH);
      if (from !== b) moves.push({ kind: "travel", dur: 0.35 + 0.14 * Math.abs(b - from), to: jarX(b) });
      moves.push({ kind: "lower", dur: 0.6 });
      const total = moves.reduce((a, m) => a + m.dur, 0);
      let f = 0;
      for (const m of moves) {
        push({ ...m, bath: b, f0: f / total, f1: (f + m.dur) / total, moveSpeed: null, apply: RACK_MOVES[m.kind](m) });
        f += m.dur;
      }
      const sec = BATHS[b].seconds;
      push({ kind: "dwell", dur: playSeconds(sec), bath: b, apply: dwellMove(BATHS[b]) });
    }
    let t = 0;
    for (const s of segs) { s.t0 = t; t += s.dur; }
    steps.push({ segs, dur: t, start: steps.length ? steps[steps.length - 1].end : REST, end: pose });
    at += t;
  }
  return steps;
}

// Acid alcohol: quick dips, the rack lifts clear of the liquid `dips` times in 3 real seconds.
// Running water: a slow sway from the current. Everything else sits still.
const dwellMove = (bath) => (s, p) => {
  if (bath.dips) return { ...s, rz: RACK_DOWN + 9 * (1 - Math.cos(2 * Math.PI * bath.dips * p)) };
  if (bath.running) return { ...s, rz: RACK_DOWN + 0.8 * (1 - Math.cos(Math.PI * 6 * p)) * (p < 1 ? 1 : 0) };
  return { ...s, rz: RACK_DOWN };
};
const RACK_MOVES = {
  lift: () => (s, p) => ({ ...s, rz: lerp(s.rz, RACK_UP, ease(p)) }),
  travel: (m) => (s, p) => ({ ...s, cx: lerp(s.cx, m.to, ease(p)) }),
  lower: () => (s, p) => ({ ...s, rz: lerp(RACK_UP, RACK_DOWN, ease(p)) }),
};
const pickX = (s) => s.cx + slideX(SLIDES - 1) + SLIDE.t / 2;
const MOUNT_MOVES = {
  pick: (s, p) => ({ ...s, picked: 1, bx: pickX(s), bz: lerp(s.rz + FLOOR, 66, ease(p)), phi: 0, focus: ease(p) }),
  carry: (s, p) => ({ ...s, bx: lerp(pickX(s), SLIDE_FLAT.x, ease(p)), bz: 66 }),
  lay: (s, p) => {
    const q = ease(p);
    return { ...s, bx: SLIDE_FLAT.x, bz: lerp(66, TILE_H + 0.6, q), phi: Math.min(1, Math.max(0, (q - 0.25) / 0.75)) * 90 };
  },
  drop: (s, p) => ({ ...s, dropper: p, drop: Math.min(1, Math.max(0, (p - 0.42) / 0.16)) }),
  cover: (s, p) => {
    const q = ease(Math.min(1, p / 0.4));
    const down = ease(Math.max(0, (p - 0.4) / 0.6));
    return { ...s, dropper: 0, cover: 1, coverQ: q, coverA: lerp(0, 38, q) * (1 - down), spread: down };
  },
  seal: (s) => ({ ...s, coverA: 0, spread: 1 }),
};

const TIMELINE = buildTimeline();

// ---- where are we: step index, time inside it --------------------------------
let done = 0; // steps finished
let playing = -1; // step playing, or -1
let clock = 0; // seconds into the playing step
let mode = "manual";
try { mode = localStorage.getItem("stainbench-wm-mode") === "auto" ? "auto" : "manual"; } catch { /* storage blocked: default */ }
let autoWait = 0;
let frozen = false; // a still for the critic pass: time stops, the moment stays
let paused = false; // the player's Pause: time stops until Play

function segAt(stepIndex, t) {
  const segs = TIMELINE[stepIndex].segs;
  for (const s of segs) if (t < s.t0 + s.dur) return { seg: s, p: Math.max(0, (t - s.t0) / s.dur) };
  return { seg: segs[segs.length - 1], p: 1 };
}

// Everything on screen, from one moment: the pose, the section and the numbers.
function momentOf() {
  if (playing < 0) {
    const last = done ? TIMELINE[done - 1].segs.at(-1) : null;
    if (!last) return { pose: REST, section: START, clock: 0, bath: null, inBath: 0, speed: null, seg: null };
    return describe(last, 1);
  }
  const { seg, p } = segAt(playing, clock);
  return describe(seg, p);
}

function describe(seg, p) {
  const pose = seg.apply(seg.start, p);
  if (seg.bath === MOUNT_INDEX) {
    const real = lerp(seg.real0, seg.real1, p);
    return { pose, section: sectionAt(MOUNT_INDEX, real), clock: clockAt(MOUNT_INDEX, real), bath: MOUNT, inBath: real, total: null, speed: null, seg, p };
  }
  const bath = BATHS[seg.bath];
  if (seg.kind === "dwell") {
    const real = p * bath.seconds;
    return { pose, section: sectionAt(seg.bath, real), clock: clockAt(seg.bath, real), bath, inBath: real, total: bath.seconds, speed: speedOf(bath.seconds), seg, p };
  }
  const f = lerp(seg.f0, seg.f1, p);
  return { pose, section: sectionAt(seg.bath, 0), clock: clockAt(seg.bath, 0) - DRAIN_SECONDS * (1 - f), bath, inBath: 0, total: bath.seconds, speed: seg.moveSpeed, seg, p, moving: true };
}

// ---- drawing ------------------------------------------------------------------
const quad = (B, dir, u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => iso([B[0] + dir[0] * v, B[1] + u, B[2] + dir[2] * v], P));
const poly = (pts, cls, style = "") => `<path class="${cls}" ${style} d="${pathOf(pts, true)}"/>`;

function slideMarkup(pose, colours) {
  const r = (pose.phi * Math.PI) / 180;
  const dir = [Math.sin(r), 0, Math.cos(r)];
  const B = [pose.bx, 0, pose.bz];
  const out = [
    poly(quad(B, dir, -15, 15, 0, SLIDE.tall), "he-live-glass"),
    poly(quad(B, dir, -15, -9, 0, SLIDE.tall), "he-frost"),
    poly(quad(B, dir, -6, 9, 2.4, 9.4), "he-patch"),
  ];
  if (pose.drop > 0 || pose.spread > 0) {
    const cx = SLIDE_FLAT.x + 6, top = TILE_H + 1.4;
    const ry = 2.6 * pose.drop + 7.4 * pose.spread, rx = 2.2 * pose.drop + 2.6 * pose.spread;
    const ring = [];
    for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; ring.push([cx + Math.cos(a) * rx, 1.5 + Math.sin(a) * ry]); }
    out.push(`<path class="he-dpx" d="${onTop(ring, top, P, true)}"/>`);
  }
  if (pose.cover) {
    const hinge = [lerp(COVERBOX.x + 5, SLIDE_FLAT.x + 0.8, pose.coverQ), lerp(COVERBOX.y + 7, 1.5, pose.coverQ), lerp(TILE_H + 5.2, TILE_H + 1.6, pose.coverQ)];
    const a = (pose.coverA * Math.PI) / 180;
    out.push(poly(quad(hinge, [Math.cos(a), 0, Math.sin(a)], -10.5, 10.5, 0, 10.5), "he-coverslip"));
  }
  return out.join("");
}

function moveTo(node, parent, before = null) {
  if (node.parentNode !== parent || (before && node.nextSibling !== before)) parent.insertBefore(node, before);
}

// The dropper's path: up out of the bottle, across, down to just above the slide, hold, and back.
const DX = SLIDE_FLAT.x + 6 - DPX[0], DY = 1.5 - DPX[1];
const DROPPER_KEYS = [[0, [0, 0, 0]], [0.16, [0, 0, 10]], [0.32, [DX, DY, 10]], [0.42, [DX, DY, -6]], [0.6, [DX, DY, -6]], [0.7, [DX, DY, 10]], [0.86, [0, 0, 10]], [1, [0, 0, 0]]];
function dropperAt(p) {
  for (let i = 1; i < DROPPER_KEYS.length; i++) {
    const [t1, b] = DROPPER_KEYS[i], [t0, a] = DROPPER_KEYS[i - 1];
    if (p <= t1) { const q = ease((p - t0) / (t1 - t0)); return a.map((v, j) => lerp(v, b[j], q)); }
  }
  return [0, 0, 0];
}
// Phones: the whole bench is too small to read, so a camera follows the rack (or the
// picked slide) at about 2.4×. It eases with real time and snaps for stills.
// Desktop gets the same camera a little wider; "Whole bench" shows the full line.
const narrow = matchMedia("(max-width: 560px)"); // phones in portrait (he-mobile-spec.md)
// Default: the whole bench on laptops; on phones the bench is too small to read, so follow the rack.
let overview = !narrow.matches;
try { const v = localStorage.getItem("stainbench-wm-view"); if (v) overview = v === "whole"; } catch { /* storage blocked */ }
let cam = null;
function follow(pose, dt) {
  // Phones: frame the jar under the rack plus one neighbour each side (3 pitches + margin),
  // in the box's own aspect so nothing is letterboxed. Laptops: the wider follow view.
  const box = svg.getBoundingClientRect();
  const aspect = box.width > 0 && box.height > 0 ? box.height / box.width : 0.5;
  const CROP = narrow.matches ? { w: 150, h: 150 * aspect } : { w: 500, h: 290 };
  if (overview) { svg.setAttribute("viewBox", `0 0 ${WIDTH} ${HEIGHT}`); cam = null; return; }
  const f = pose.focus || 0; // 0 = follow the rack, 1 = follow the picked slide; eased in the pick move
  const focus = [lerp(pose.cx, pose.picked ? pose.bx : pose.cx, f), 0, narrow.matches ? lerp(34, 26, f) : lerp(52, 30, f)];
  const [fx, fy] = iso(focus, P);
  const want = [Math.max(0, Math.min(WIDTH - CROP.w, fx - CROP.w * (narrow.matches ? 0.5 : 0.45))), Math.max(0, Math.min(HEIGHT - CROP.h, fy - CROP.h * 0.5))];
  if (!cam || dt == null) cam = want;
  else { const k = 1 - Math.exp(-dt / 0.35); cam = [lerp(cam[0], want[0], k), lerp(cam[1], want[1], k)]; }
  svg.setAttribute("viewBox", `${cam[0].toFixed(1)} ${cam[1].toFixed(1)} ${CROP.w} ${CROP.h}`);
}
let lastSlot = -1;
function drawPose(pose, colours) {
  const jar = Math.max(0, Math.min(JARS, Math.round(pose.cx / PITCH) + 1)); // slot 0 is the start tray
  if (jar !== lastSlot) { slots[jar].appendChild(rack); lastSlot = jar; }
  rack.setAttribute("transform", translateAlong(P, [pose.cx, 0, pose.rz]));
  carriage.setAttribute("transform", translateAlong(P, [pose.cx, 0, 0]));
  const z0 = ARM_Z + ARM_H + 3, z1 = pose.rz + RACK.hook + ROD;
  rodTop.innerHTML = z1 > z0 + 0.2 ? paintLive(cylinder(pose.cx, 0, 1.5, z0, z1 - z0, P, 16), CHROME) : "";
  pickInRack.style.display = pose.picked ? "none" : "";
  if (pose.picked) {
    if (pose.bz < RIM && pose.phi === 0) moveTo(liveSlide, slots[JARS]);
    else moveTo(liveSlide, dropper.parentNode, dropper);
    liveSlide.innerHTML = slideMarkup(pose, colours);
  } else liveSlide.innerHTML = "";
  dropper.setAttribute("transform", translateAlong(P, dropperAt(pose.dropper)));
}

function paintSection(section) {
  const c = coloursOf(section);
  const style = win.style;
  style.setProperty("--nuc", c.nuc); style.setProperty("--cyto", c.cyto); style.setProperty("--rbc", c.rbc);
  style.setProperty("--fibre", c.fibre); style.setProperty("--haze", c.haze.toFixed(3));
  style.setProperty("--stain", section.haemN.toFixed(3)); style.setProperty("--mounted", section.mounted.toFixed(3));
  svg.style.setProperty("--slide-col", mix(c.cyto, c.nuc, 0.4));
  return c;
}

// ---- sound words: hand-written, short-lived, placed on the action -----------
const live = [];
function say(text, world, now) {
  const [x, y] = iso(world, P);
  live.push({ text, x, y, born: now });
}
let lastSegKey = "";
function soundsFor(m, now) {
  if (!m.seg) return;
  const key = `${playing}:${m.seg.t0}`;
  const pose = m.pose;
  if (key !== lastSegKey) {
    lastSegKey = key;
    const k = m.seg.kind, bath = BATHS[m.seg.bath];
    if (k === "lower") setTimeout(() => say("plop!", [pose.cx + 6, 22, RIM + 12], performance.now()), 420);
    if (k === "lift") say("drip", [pose.cx + 18, 16, RIM + 22], now);
    if (k === "dwell" && bath.running) say("swish", [pose.cx - 22, -12, RIM + 16], now);
    if (k === "dwell" && bath.kind === "haem") say("soak…", [pose.cx + 18, 18, RIM + 18], now);
    if (k === "dwell" && bath.kind === "eosin") say("soak…", [pose.cx + 18, 18, RIM + 18], now);
    if (k === "dwell" && bath.kind === "blue") say("swirl", [pose.cx + 18, 18, RIM + 18], now);
    if (k === "pick") say("clink", [pose.cx + 16, 12, RIM + 26], now);
    if (k === "drop") setTimeout(() => say("drip", [SLIDE_FLAT.x + 4, 14, 26], performance.now()), m.seg.dur * 450);
    if (k === "seal") say("tap!", [SLIDE_FLAT.x + 10, 14, 22], now);
    if (k === "dwell" && bath.kind === "acid") [0, 1, 2].forEach((n) => setTimeout(() => say("dip!", [pose.cx + 18, 16, RIM + 14 + n * 6], performance.now()), n * 1000 + 150));
  }
}
function drawWords(now) {
  for (let i = live.length - 1; i >= 0; i--) if (now - live[i].born > 1300) live.splice(i, 1);
  words.innerHTML = live.map((w) => {
    const a = (now - w.born) / 1300;
    const o = a < 0.15 ? a / 0.15 : 1 - Math.max(0, (a - 0.6) / 0.4);
    return `<text class="he-word" x="${w.x.toFixed(1)}" y="${(w.y - a * 8).toFixed(1)}" opacity="${o.toFixed(2)}">${w.text}</text>`;
  }).join("");
}

// ---- the panel: hint, badge, chips, active station, pills -----------------------
const set = (sel, text) => { const el = ui(sel); if (el && el.textContent !== text) el.textContent = text; };
const jarsEls = [...svg.querySelectorAll("[data-jar]")];
const startEl = svg.querySelector("[data-start]");
const cells = [...document.querySelectorAll(".he-cell")];
// ---- phone layout (he-mobile-spec.md): step strip, station rail, compact row --------
const stepsBox = ui(".he-steps"), mapBox = ui(".he-map");
const smooth = () => (reduce.matches ? "auto" : "smooth");
let centredStep = -1, centredStation = -1;
function centreIn(box, el) {
  // Horizontal only: scrollIntoView would also scroll the page when the rail is off-screen.
  const left = el.offsetLeft - box.offsetLeft - (box.clientWidth - el.offsetWidth) / 2;
  box.scrollTo({ left: Math.max(0, left), behavior: smooth() });
}
function drawPhone(m, here, badgeText) {
  const stepNo = playing >= 0 ? playing + 1 : Math.min(done + 1, STEPS.length);
  set(".he-mrow-step", done === STEPS.length && playing < 0 ? "All 7 steps done" : `Step ${stepNo} of ${STEPS.length}`);
  set(".he-mrow-clock", `Lab ${mmss(m.clock)} / ${mmss(TOTAL_SECONDS)}`);
  set(".he-mrow-badge", badgeText);
  if (!narrow.matches) { centredStep = centredStation = -1; return; }
  const activePill = Math.min(stepNo - 1, STEPS.length - 1);
  if (activePill !== centredStep) { centredStep = activePill; centreIn(stepsBox, pills[activePill]); }
  if (here !== centredStation) { centredStation = here; centreIn(mapBox, cells[here]); }
}
const mss = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

function drawPanel(m) {
  const bath = m.bath;
  const activeJar = m.bath && m.bath.seconds && m.bath !== MOUNT ? m.bath.no - 2 : -1;
  startEl.classList.toggle("is-active", !m.bath);
  jarsEls.forEach((el, i) => el.classList.toggle("is-active", i === activeJar));
  const here = (bath ? bath.no : START_TRAY.no) - 1;
  cells.forEach((el, i) => { el.classList.toggle("is-here", i === here); el.classList.toggle("is-past", i < here); });
  const c = wordsOf(m.section);
  lcd.textContent = mmss(m.clock);
  set("[data-readout]", `LAB CLOCK ${mmss(m.clock)} / ${mmss(TOTAL_SECONDS)}`);
  const no = bath ? bath.no : 1;
  set(".he-active-no", String(no));
  set(".he-active-name", bath ? bath.name : START_TRAY.name);
  set(".he-active-sub", !bath ? "rack loaded with 9 waxed sections, waiting" : m.moving ? "moving forward to this jar" : playing < 0 && bath === MOUNT && m.section.mounted >= 1 ? "finished: sealed under glass" : playing < 0 ? "waiting here" : bath === MOUNT ? "one slide at a time; not on the lab clock" : `${mss(m.inBath)} of ${mss(m.total)}${bath.running ? " · running water" : ""}`);
  ui(".he-active-swatch").style.background = bath && bath.liquid ? bath.liquid : "#f6f2e9";
  set('[data-chip="bath"]', `${bath ? bath.no : START_TRAY.no} of ${STATIONS}`);
  set('[data-chip="time"]', bath && m.total ? `${mmss(m.inBath)} / ${mmss(m.total)}` : "–");
  set('[data-chip="clock"]', mmss(m.clock));
  set('[data-chip="ph"]', bath && bath.pH != null ? bath.pH.toFixed(1) : bath === MOUNT ? "DPX: no water" : bath ? "no water (solvent)" : "—");
  set('[data-chip="nuc"]', c.nuc);
  set('[data-chip="cyto"]', c.cyto);
  set('[data-chip="rbc"]', c.rbc);
  set('[data-chip="look"]', c.look);
  const sp = m.speed;
  const badgeText = playing < 0 || sp == null ? "" : Math.abs(sp - 1) < 0.05 ? "×1 real time" : sp > 1 ? `×${Math.round(sp)}` : `×1/${Math.round(1 / sp)}`;
  const b = ui(".he-speed");
  set(".he-speed", badgeText);
  b.hidden = !badgeText;
  drawPhone(m, here, badgeText);
  const hintStep = playing >= 0 ? playing : Math.min(done, STEPS.length - 1);
  const hint = done === STEPS.length && playing < 0 ? "All done: blue nuclei, pink cytoplasm, red blood cells, sealed under glass. Press Start over to run it again." : STEPS[hintStep].hint;
  set(".he-hint-text", hint);
  set(".he-hint-no", done === STEPS.length && playing < 0 ? "✓" : String(hintStep + 1));
  pills.forEach((pill, i) => {
    const state = i < done ? "done" : i === playing ? "running" : i === done && playing < 0 ? "next" : "locked";
    if (pill.dataset.state !== state) pill.dataset.state = state;
    pill.disabled = !(state === "next" && mode === "manual");
  });
}

// ---- loop -----------------------------------------------------------------------
let frame = 0, last = 0, visible = true;
function render(now, dt = null) {
  const m = momentOf();
  const colours = paintSection(m.section);
  drawPose(m.pose, colours);
  follow(m.pose, dt);
  soundsFor(m, now);
  drawWords(now);
  drawPanel(m);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
  last = now;
  if (frozen) { frame = 0; return; }
  if (paused) { render(now, dt); frame = 0; return; }
  if (playing >= 0) {
    clock += dt;
    if (clock >= TIMELINE[playing].dur) { done = playing + 1; playing = -1; clock = 0; autoWait = done === STEPS.length ? 2.8 : 0.7; }
  } else if (mode === "auto") {
    autoWait -= dt;
    if (autoWait <= 0) { if (done === STEPS.length) startOver(); else play(done); }
  }
  render(now, dt);
  const busy = playing >= 0 || mode === "auto" || live.length;
  frame = visible && busy ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };

function play(i) {
  if (i !== done || playing >= 0) return;
  if (reduce.matches) { done = i + 1; render(performance.now()); return; }
  playing = i; clock = 0; lastSegKey = ""; run();
}
function startOver() {
  frozen = false; paused = false; done = 0; playing = -1; clock = 0; live.length = 0; lastSegKey = ""; autoWait = 0.8; lastSlot = -1;
  render(performance.now()); run();
}
function setMode(next) {
  mode = next;
  if (mode === "manual") paused = false;
  try { localStorage.setItem("stainbench-wm-mode", mode); } catch { /* storage blocked: keep in memory */ }
  document.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
  autoWait = 0.5;
  render(performance.now()); run();
}

pills.forEach((pill, i) => pill.addEventListener("click", () => play(i)));
document.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
const viewBtn = ui(".he-view");
const syncView = () => { viewBtn.textContent = overview ? "Follow the rack" : "Whole bench"; viewBtn.setAttribute("aria-pressed", String(overview)); };
viewBtn.addEventListener("click", () => {
  overview = !overview;
  try { localStorage.setItem("stainbench-wm-view", overview ? "whole" : "follow"); } catch { /* storage blocked */ }
  syncView(); render(performance.now());
});
syncView();

const playerBtn = (name) => ui(`[data-player="${name}"]`);
const syncPlayer = () => {
  playerBtn("play").dataset.on = String(mode === "auto" && !paused);
  playerBtn("pause").dataset.on = String(paused);
  playerBtn("bench").setAttribute("aria-pressed", String(overview));
  playerBtn("bench").dataset.on = String(overview);
};
playerBtn("play").addEventListener("click", () => { paused = false; if (mode !== "auto") setMode("auto"); else { last = 0; run(); } syncPlayer(); });
playerBtn("pause").addEventListener("click", () => { paused = true; syncPlayer(); });
playerBtn("stop").addEventListener("click", () => { paused = false; setMode("manual"); startOver(); syncPlayer(); });
playerBtn("bench").addEventListener("click", () => viewBtn.click());
viewBtn.addEventListener("click", syncPlayer);

// The ×400 window: a 56 px inset inside the bench box on phones (tap to enlarge), the side column elsewhere.
const side = ui(".he-side"), figBox = ui(".he-fig");
const placeWindow = () => {
  if (narrow.matches && win.parentNode !== figBox) figBox.appendChild(win);
  if (!narrow.matches && win.parentNode !== side) { side.insertBefore(win, side.firstChild); win.classList.remove("is-big"); }
};
narrow.addEventListener("change", () => { placeWindow(); centredStep = centredStation = -1; render(performance.now()); });
placeWindow();
win.addEventListener("click", () => { if (narrow.matches) win.classList.toggle("is-big"); });

const moreBtn = ui(".he-more-btn"), stage = ui(".he-stage");
moreBtn.addEventListener("click", () => {
  const open = stage.classList.toggle("is-more");
  moreBtn.textContent = open ? "Less" : "More";
  moreBtn.setAttribute("aria-expanded", String(open));
});

// Station rail: tapping a chip acts like tapping that jar: a station of the next step plays that step.
const stepOfStation = (no) => (no === START_TRAY.no ? 0 : no === MOUNT.no ? STEPS.length - 1 : STEPS.findIndex((st) => st.baths.includes(no - 2)));
cells.forEach((cell, i) => cell.addEventListener("click", () => {
  const k = stepOfStation(i + 1);
  if (k === done && playing < 0) { if (mode === "manual") play(k); return; }
  set(".he-hint-text", k < done ? `Station ${i + 1} is done: the rack only moves forward.` : `Station ${i + 1} comes in step ${k + 1} (${STEPS[k].label}). Next is step ${done + 1}.`);
}));
ui(".he-restart").addEventListener("click", (e) => { e.preventDefault(); startOver(); });
document.addEventListener("keydown", (e) => {
  if ((e.key === " " || e.key === "Enter") && e.target === document.body) { e.preventDefault(); play(done); }
});
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "80px 0px" }).observe(document.querySelector(".he-card"));

// Test hooks for the critic pass: jump to any moment of any step.
window.HE = {
  timeline: TIMELINE,
  still(step, frac) { frozen = true; done = step; playing = step; clock = TIMELINE[step].dur * frac; live.length = 0; lastSegKey = "x"; render(performance.now()); return momentOf(); },
  thaw() { frozen = false; run(); },
  seekStep(step, t) { done = step; playing = step; clock = t; render(performance.now()); },
  state: () => ({ done, playing, clock, mode, paused, overview }),
  loop: () => ({ frame, visible, autoWait, frozen }),
  momentOf,
};
setMode(mode);
syncPlayer();
