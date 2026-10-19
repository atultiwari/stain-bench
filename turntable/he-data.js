/* ============================================================
   H&E staining, 3D: protocol data shared with the 2D figure (../he-staining.html).
   Bench coordinates are the 2D figure's: x = depth (toward the viewer), y = width
   (toward viewer-left), z = up; 1 unit = 1 mm. The 3D page maps them to world space.
   ============================================================ */
const INK = '#231e16';
const ACCENT = '#76a0e2';                                            // the 2D figure's cobalt palette, light tone
const METAL = { l: '#eef0f0', m: '#c6ccce', d: '#8f989b' };
const CLEAR = { l: '#e4f2f4', m: '#c4dfe4', d: '#97b9c0' };
const CERAMIC = { l: '#fbfaf3', m: '#e3e0d2', d: '#bdb8a6' };
const DARK = { l: '#55504a', m: '#3d3935', d: '#272421' };
const HE_GLASS = { l: '#eef6f7', m: '#d3e5e8', d: '#a9c3c8' };

const f = v => v.toFixed(1);
const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) * (1 - t) + parseInt(b.substr(i, 2), 16) * t).toString(16).padStart(2, '0')).join('');
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const HE_P = 66, HE_FRONT_N = 9, HE_BY = HE_FRONT_N * HE_P + 16, HE_BH = 3;   // station pitch, bench length, board thickness
const HE_DEPTH = 152;                                                // bench depth
const HE_RISER = { x0: 4, x1: 72, h: 112 };                          // the raised back shelf
const HE_ROWS = { front: { x: 114, base: HE_BH }, back: { x: 38, base: HE_RISER.h } };
const HE_JAR = { dx: 22, dy: 28, h: 92, level: 72 };                 // half depth, half width, height, liquid depth
const HE_SAFE = { front: HE_BH + HE_JAR.h + 12, back: HE_RISER.h + HE_JAR.h + 12 };
const HE_LIQ = {
  // clear solvents get a faint but recognisable tint (straw xylene, pale alcohol, blue water) so a full jar never looks empty
  xyl: ['#ead27e', .5], alc: ['#bfe0ea', .55], water: ['#93c8ee', .6], haem: ['#3d2160', .82],
  wash: ['#82bde9', .6], acid: ['#efb2c4', .6], blue: ['#76a3e4', .65], eosin: ['#e0336c', .72],
};

// 17 stations, each visited once, in order: the rack only ever moves forward along the U (../he-protocol.md, after Bancroft).
// [key, words on the jar's tape, liquid, full name, lab time in seconds]
const HE_STATIONS = [
  ...[['start', ['START'], 'tray', 'Start tray: paraffin sections', 0],
      ['xyl1', ['XYLENE'], 'xyl', 'Xylene', 300], ['alc99a', ['ALC', '99%'], 'alc', '99% (absolute) alcohol', 120],
      ['alc70', ['ALC', '70%'], 'alc', '70% alcohol', 120], ['dw', ['WATER'], 'water', 'Water', 60],
      ['haem', ['HAEM'], 'haem', 'Harris haematoxylin', 300], ['w1', ['TAP', 'WATER'], 'wash', 'Running tap water', 300],
      ['acid', ['ACID', 'ALC'], 'acid', '1% acid alcohol (1% HCl in 70% alcohol)', 10], ['w2', ['TAP', 'WATER'], 'wash', 'Running tap water', 60]]
    .map(([key, lines, liq, name, secs], j) => ({ key, lines, liq, name, secs, row: 'front', y: HE_BY - 8 - (j + .5) * HE_P })),
  ...[['scott', ["SCOTT'S"], 'blue', "Scott's tap water substitute (bluing)", 60], ['w3', ['TAP', 'WATER'], 'wash', 'Running tap water', 300],
      ['eosin', ['EOSIN'], 'eosin', '1% eosin Y', 600], ['w4', ['TAP', 'WATER'], 'wash', 'Running tap water', 120],
      ['alc95', ['ALC', '95%'], 'alc', '95% alcohol', 60], ['alc99b', ['ALC', '99%'], 'alc', '99% (absolute) alcohol', 120],
      ['xyl2', ['XYLENE'], 'xyl', 'Xylene (clearing)', 300], ['mount', ['MOUNT'], 'pad', 'Mounting: DPX and coverslip', 0]]
    .map(([key, lines, liq, name, secs], k) => ({ key, lines, liq, name, secs, row: 'back', y: 8 + (k + .5) * HE_P })),
].map((s0, i) => ({ ...s0, num: i + 1, label: s0.lines.join(' ') }));
const HE_IDX = Object.fromEntries(HE_STATIONS.map((s0, i) => [s0.key, i]));
const heKind = s0 => s0.liq === 'tray' ? 'tray' : s0.liq === 'pad' ? 'pad' : 'jar';
const heRowOfX = x => x < HE_RISER.x1 + 4 ? 'back' : 'front';

/* ---------- the protocol (regressive H&E, Harris haematoxylin) ---------- */
const HE_STEPS = [
  { label: 'Dewax', path: ['xyl1', 'alc99a', 'alc70', 'dw'], to: 'dewaxed',
    doing: 'Xylene removes the paraffin wax; 99% then 70% alcohol, then water, bring the section down to water.',
    done: 'Dewaxed and in water: ready for water-based stains.' },
  { label: 'Haematoxylin', path: ['haem', 'w1'], to: 'haem',
    doing: 'Harris haematoxylin (5 min, used regressively) overstains the nuclei and everything else. Running tap water washes off the excess and starts to blue it.',
    done: 'Everything is purple: overstained on purpose.' },
  { label: 'Differentiate', path: ['acid', 'w2'], to: 'diff', quick: true,
    doing: 'A few quick dips (about 10 s) in 1% acid alcohol pull the excess dye out; the nuclei keep it but turn red in the acid. Running tap water stops the acid.',
    done: 'Nuclei keep the dye (red-purple for now); the cytoplasm is clearing.' },
  { label: 'Blue', path: ['scott', 'w3'], to: 'blued',
    doing: "Scott's tap water substitute is a weak alkali: 1 min turns the nuclei from red to blue-black. Then a 5 minute running tap-water wash.",
    done: 'Crisp blue-black nuclei.' },
  { label: 'Eosin', path: ['eosin', 'w4'], to: 'eosin',
    doing: '1% eosin Y (10 min) stains cytoplasm pink and red cells orange-red. The running tap-water wash after it differentiates the eosin.',
    done: 'Pink cytoplasm, orange-red red cells, blue nuclei: the H&E look.' },
  { label: 'Dehydrate and clear', path: ['alc95', 'alc99b', 'xyl2'], to: 'clear',
    doing: '95% then 99% alcohol take the water out (a little more eosin comes out); xylene clears the section until it is glass-clear.',
    done: 'Cleared. The slides wait in xylene so the sections never dry.' },
  { label: 'Coverslip', path: ['mount'], to: 'mounted', mount: true,
    doing: 'One slide at a time comes out of the xylene, still wet, and lies flat. A drop of DPX goes on, then the coverslip is lowered from one edge so no air is trapped.',
    done: 'Mounted: an H&E slide, ready for the microscope. The others wait in xylene for their turn.' },
];
const heClock = secs => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;
const heLabTime = secs => { const m = Math.floor(secs / 60), s = Math.floor(secs % 60); return s ? `${m} min ${s} s` : `${m} min`; };
// lab time after the first n steps
const heLabAfter = n => HE_STEPS.slice(0, n).flatMap(S1 => S1.path).reduce((a, key) => a + HE_STATIONS[HE_IDX[key]].secs, 0);
const HE_READY = 'Paraffin sections on glass slides wait in the start tray. Press Play, a step, or tap the XYLENE jar. Drag to turn the bench.';

/* what the section looks like under the microscope after each step */
const HE_LOOK = {
  wax:     { bg: '#efe9dc', cyto: '#e9e2d2', nuc: '#dbd2c1', rbc: '#e4dccb', fib: '#e8e1d2', haze: .5 },
  dewaxed: { bg: '#f8f6f1', cyto: '#ece9e2', nuc: '#d9d4ca', rbc: '#e6e1d8', fib: '#ebe8e1', haze: .08 },
  haem:    { bg: '#cbbde0', cyto: '#a690c8', nuc: '#381f62', rbc: '#b29ed0', fib: '#b5a4d2', haze: 0 },
  diff:    { bg: '#f7f0f4', cyto: '#e5d9e7', nuc: '#6c285c', rbc: '#ece3eb', fib: '#ebe2ec', haze: 0 },
  blued:   { bg: '#f7f7fb', cyto: '#e7e9f2', nuc: '#2a3a8c', rbc: '#ececf2', fib: '#ececf3', haze: 0 },
  eosin:   { bg: '#fbedf2', cyto: '#ed8db0', nuc: '#383b8d', rbc: '#e2553c', fib: '#f3a3bf', haze: .12 },
  clear:   { bg: '#fdf1f5', cyto: '#ee8db0', nuc: '#33388c', rbc: '#e2553c', fib: '#f4a3bf', haze: 0 },
  mounted: { bg: '#fdf1f5', cyto: '#ee8db0', nuc: '#33388c', rbc: '#e2553c', fib: '#f4a3bf', haze: 0 },
};
const heLookOf = (from, to, t) => {
  const a = HE_LOOK[from], b = HE_LOOK[to];
  return Object.fromEntries(Object.keys(a).map(k => [k, k === 'haze' ? a[k] + (b[k] - a[k]) * t : mix(a[k], b[k], t)]));
};
const heTissue = lk => lk.haze > .3 ? '#f3eee3' : mix(lk.nuc, lk.cyto, .62);

/* the field under the microscope: cells, red cells and collagen, from a fixed seed */
const HE_FIELD = (() => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const cells = [], rbcs = [], fibres = [];
  for (let gx = -1; gx <= 1.01; gx += .42) for (let gy = -1; gy <= 1.01; gy += .42) {
    const cx = gx + (rnd() - .5) * .16, cy = gy + (rnd() - .5) * .16;
    if (Math.hypot(cx, cy) > 1.05) continue;
    if (rnd() < .16) { for (let k = 0; k < 3; k++) rbcs.push([cx + (rnd() - .5) * .2, cy + (rnd() - .5) * .2]); continue; }
    const r = .15 + rnd() * .05, pts = [];
    for (let k = 0; k < 8; k++) { const a = k / 8 * 2 * Math.PI, rr = r * (.82 + rnd() * .3); pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
    cells.push({ pts, nx: cx + (rnd() - .5) * .05, ny: cy + (rnd() - .5) * .05, rx: .055 + rnd() * .025, ry: .045 + rnd() * .02, rot: rnd() * 180 });
  }
  for (let k = 0; k < 4; k++) { const y = -.8 + k * .5 + rnd() * .1; fibres.push([[-1.1, y], [-.4, y + .12], [.3, y - .1], [1.1, y + .08]]); }
  rbcs.push([-.56, .66], [-.47, .73], [-.6, .76]);          // a small group of red cells in a capillary, low left
  return { cells, rbcs, fibres };
})();

/* the slide's axes, from standing in the rack (t = 0) to lying flat, tissue up (t = 1), in bench coordinates */
const heNorm = v => { const l = Math.hypot(...v); return v.map(c => c / l); };
const heDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
function heFrame(t) {
  const A = heNorm([0, t, 1 - t]), n0 = [1 - t, 0, t], d = heDot(n0, A), N = heNorm(n0.map((v, i) => v - d * A[i]));
  return { A, N };
}
