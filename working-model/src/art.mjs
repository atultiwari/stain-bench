// Static art of the linear stainer, built once with the isometric engine (engine/).
// Live parts (rack, picked slide, coverslip, dropper, rod top) are left as empty
// groups or built at a rest pose for the page to move.
import * as k from "./kit.mjs";
import * as G from "./lathe.mjs";
import * as W from "./world.mjs";
import { BATHS, START_TRAY, mix } from "./model.mjs";

export const P = k.fitProjection(
  [
    ...k.boxCorners(W.BENCH, -W.BENCH_H - 6, 0),
    [W.POSTS[0], W.POST_Y, W.BEAM_Z + W.BEAM_H],
    [W.POSTS[1], W.POST_Y, W.BEAM_Z + W.BEAM_H],
    [0, 0, W.RACK_UP + W.RACK.hook + W.ROD],
  ],
  W.WIDTH,
  W.HEIGHT,
  { pad: 18, azimuth: W.VIEW_AZIMUTH, elevation: W.VIEW_ELEVATION },
);

const at = (p) => k.iso(p, P);
const L = (d, o) => k.lineSvg(d, o);
const D = (pts, o) => k.dotsSvg(pts, o);

// Three flat tones per colour: top lightest, sides darker (kit buckets 0–3 → two side tones).
export function tones(base) {
  const side = mix(base, "#1f2a44", 0.14);
  const dark = mix(base, "#1f2a44", 0.26);
  const top = mix(base, "#ffffff", 0.34);
  return `--sb-paper:${base};--sb-top:${top};--sb-shade-0:${dark};--sb-shade-1:${dark};--sb-shade-2:${side};--sb-shade-3:${side}`;
}
export const paint = (paths, base, opts = {}) => `<g style="${tones(base)}">${k.solidSvg(paths, { tone: "hi", crease: "mid", ...opts })}</g>`;

// A short, hard-edged warm shadow falling just behind and right of a footprint.
const SHADOW = [7, -9];
export function shadowOf(plan, z = 0, steps = 6) {
  const ring = k.ringOf({ ...plan, x: plan.x + SHADOW[0], y: plan.y + SHADOW[1] }, steps);
  return `<path class="he-shadow" d="${k.onTop(ring, z, P, true)}"/>`;
}
const roundShadow = (cx, cy, r, z = 0) => `<path class="he-shadow" d="${k.onTop(k.circleRing(cx + SHADOW[0] * 0.6, cy + SHADOW[1] * 0.6, r, 28), z, P, true)}"/>`;

export const C = {
  bench: "#a7c9b6",
  chrome: "#cfd6da",
  mustard: "#ebbb4c",
  tomato: "#e0623f",
  brass: "#dcab4a",
  glass: "#e6f0ee",
  tile: "#f6f2e9",
  amber: "#b8692b",
  navy: "#2b3a5c",
  blue: "#6f9bd6",
  hose: "#8fb7d4",
};

function bench() {
  const z0 = -W.BENCH_H;
  const out = [shadowOf(W.BENCH, z0 - 6, 8)];
  const feet = [];
  for (const x of [W.BENCH.x + 22, 300, W.BENCH.x + W.BENCH.w - 22]) for (const y of [W.BENCH.y + 16, W.BENCH.y + W.BENCH.d - 16]) feet.push([x, y]);
  feet.sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P));
  for (const [x, y] of feet) out.push(paint(k.cylinder(x, y, 7, z0 - 6, 6, P, 24), C.navy));
  out.push(paint(k.slabOf(W.BENCH, z0, W.BENCH_H, P, 8, 1.2), C.bench));
  out.push(L(k.planOutline(k.insetPlan(W.BENCH, 5), 0, P), { tone: "mid" }));
  const screws = k.corners(W.BENCH, 11);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "mid" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.7, tone: "hi" }));

  // Front ruler: a major tick and an engraved number at every station.
  const strip = { x: W.START_X - 22, y: 36, w: W.SLIDE_FLAT.x + 30 - (W.START_X - 22), d: 9, r: 1 };
  out.push(paint(k.slabOf(strip, 0, 0.8, P, 3), C.chrome, { crease: "none" }));
  const ticks = k.topTicks(strip.x + 3, strip.x + strip.w - 3, W.PITCH / 6, 6, strip.y + 0.6, 0.8, [1.6, 3.4], P);
  out.push(L(ticks.minor, { tone: "mid" }), L(ticks.major, { tone: "hi" }));
  // Station numbers 1–17: the start tray, the fifteen jars, the mounting tile.
  const stationX = [W.START_X, ...Array.from({ length: W.JARS }, (_, i) => W.jarX(i)), W.SLIDE_FLAT.x + 6];
  stationX.forEach((x, i) => out.push(k.faceTextSvg(k.topMatrix([x, strip.y + 8.2], 0.8, P, "x"), String(i + 1), { size: 3.8, tone: "hi", anchor: "middle" })));
  // Brass name plate on the bench top, front left.
  const plate = { x: W.BOX.x, y: 28, w: 52, d: 14, r: 1.5 };
  out.push(paint(k.slabOf(plate, 0, 0.8, P, 3), C.brass, { crease: "none" }));
  out.push(k.faceTextSvg(k.topMatrix([plate.x + 26, plate.y + 6.4], 0.8, P, "x"), "H&E STAINER", { size: 3.6, tone: "hi", anchor: "middle" }));
  out.push(L(k.lineOnTop([plate.x + 6, plate.y + 10], [plate.x + 46, plate.y + 10], 0.8, P), { tone: "mid", free: true }));
  out.push(D([at([plate.x + 2.5, plate.y + 7, 0.8]), at([plate.x + 49.5, plate.y + 7, 0.8])], { size: 0.6, tone: "hi" }));

  // Stainless drip tray under the jars.
  out.push(paint(k.slabOf(W.TRAY, 0, 1.6, P, 4, 0.5), C.chrome));
  out.push(L(k.planOutline(k.insetPlan(W.TRAY, 3), 1.6, P, 4), { tone: "mid" }));
  return out.join("");
}

function post(x) {
  const out = [roundShadow(x, W.POST_Y, 9)];
  out.push(paint(k.cylinder(x, W.POST_Y, 9, 0, 3, P, 32, 0.5), C.mustard));
  out.push(D(k.circleRing(x, W.POST_Y, 6.6, 6).map(([px, py]) => at([px, py, 3])), { size: 0.6, tone: "hi" }));
  out.push(paint(k.cylinder(x, W.POST_Y, 4.5, 3, W.BEAM_Z - 3, P, 28), C.mustard));
  out.push(L([40, 80].map((z) => k.sideArc(x, W.POST_Y, 4.5, z, P, 16)).join(""), { tone: "mid" }));
  return out.join("");
}

function beam() {
  const out = [paint(k.slabOf(W.BEAM, W.BEAM_Z, W.BEAM_H, P, 3, 0.6), C.mustard)];
  const rail = { x: W.BEAM.x + 6, y: W.POST_Y - 2, w: W.BEAM.w - 12, d: 4, r: 1 };
  out.push(paint(k.slabOf(rail, W.BEAM_Z + W.BEAM_H, 2.4, P, 3), C.chrome));
  out.push(D([rail.x + 3, rail.x + rail.w - 3].map((x) => at([x, W.POST_Y, W.BEAM_Z + W.BEAM_H + 2.4])), { size: 0.6, tone: "hi" }));
  // Station ticks hanging from the top edge of the beam's front face, one per jar.
  const face = W.BEAM.y + W.BEAM.d;
  const ticks = [];
  for (let i = 0; i < W.JARS; i++) ticks.push(k.segment([W.jarX(i), face, W.BEAM_Z + W.BEAM_H], [W.jarX(i), face, W.BEAM_Z + W.BEAM_H - 4], P));
  out.push(L(ticks.join(""), { tone: "hi", free: "end" }));
  return out.join("");
}

function pipework() {
  const out = [];
  const x0 = W.jarX(W.RUNNING[0]) - 30, x1 = W.jarX(W.RUNNING[W.RUNNING.length - 1]) + 16;
  const along = G.frameAlong([x0, W.PIPE_Y, W.PIPE_Z], [1, 0, 0]);
  // Supply standpipe with a lever tap at the left end of the manifold.
  out.push(roundShadow(x0, W.PIPE_Y, 3.2));
  out.push(paint(k.cylinder(x0, W.PIPE_Y, 3.2, 0, 26, P, 20), C.brass));
  out.push(paint(G.disc(0, x1 - x0, W.PIPE_R, along, P), C.brass));
  out.push(paint(G.disc(x1 - x0, x1 - x0 + 2.4, W.PIPE_R + 0.9, along, P), C.brass));
  out.push(paint(k.cylinder(x0, W.PIPE_Y, 4.4, 26, 4, P, 20), C.brass));
  out.push(paint(k.slabOf({ x: x0 - 1.5, y: W.PIPE_Y - 1.5, w: 12, d: 3, r: 1 }, 30, 2.2, P, 2), C.tomato));
  for (const i of W.RUNNING) {
    const x = W.jarX(i);
    out.push(paint(k.cylinder(x - 7, W.PIPE_Y, 2.2, W.PIPE_Z, 6, P, 16), C.brass));
    out.push(paint(k.cylinder(x - 7, W.PIPE_Y, 3.2, W.PIPE_Z + 6, 2.6, P, 18), C.tomato));
    out.push(L(k.knurl(x - 7, W.PIPE_Y, 3.2, W.PIPE_Z + 6, W.PIPE_Z + 8.6, 12, P), { tone: "mid" }));
    const hose = G.frameAlong([x, W.PIPE_Y, W.PIPE_Z], [0, 1, 0]);
    out.push(paint(G.disc(1.6, -W.PIPE_Y - W.JAR.d / 2, 1.6, hose, P), C.hose));
    out.push(paint(G.disc(-1.6, 1.6, W.PIPE_R + 0.9, hose, P), C.brass));
  }
  return out.join("");
}

function controlBox() {
  const b = W.BOX, h = W.BOX_H;
  const out = [shadowOf(b, 0)];
  out.push(paint(k.slabOf(b, 0, h, P, 4, 0.8), C.tomato, { inner: L(k.sideSeam(b, h - 6, P, 4), { tone: "mid" }) }));
  // The display on the front face reads the lab clock from the model.
  const fy = b.y + b.d;
  const screen = [[b.x + 6, fy, h - 10], [b.x + b.w - 6, fy, h - 10], [b.x + b.w - 6, fy, h - 24], [b.x + 6, fy, h - 24]];
  out.push(`<path class="he-lcd" d="${k.pathOf(screen.map(at), true)}"/>`);
  out.push(`<text id="he-lcd" class="he-lcd-text" transform="${k.sideMatrix([b.x + b.w / 2, fy], h - 13, P, "left")}" font-size="9.6" text-anchor="middle">00:00</text>`);
  out.push(k.faceTextSvg(k.sideMatrix([b.x + 6, fy], h - 28, P, "left"), "LAB CLOCK", { size: 3.4, tone: "hi" }));
  const led = at([b.x + b.w - 9, fy, h - 30]);
  out.push(`<circle class="he-led" cx="${led[0].toFixed(1)}" cy="${led[1].toFixed(1)}" r="1.6"/>`);
  // Two knurled knobs on top: start and speed.
  for (const [x, y] of [[b.x + 14, b.y + 16], [b.x + 34, b.y + 16]]) {
    out.push(paint(k.cylinder(x, y, 5, h, 5, P, 28, 0.4), C.navy));
    out.push(L(k.knurl(x, y, 5, h, h + 5, 28, P), { tone: "lo" }));
    out.push(L(k.lineOnTop([x, y], [x, y - 4.5], h + 5, P), { tone: "faint" }));
  }
  out.push(D(k.corners(b, 3).map(([x, y]) => at([x, y, h])), { size: 0.6, tone: "hi" }));
  return out.join("");
}

const jarPlan = (i) => ({ x: W.jarX(i) - W.JAR.w / 2, y: -W.JAR.d / 2, w: W.JAR.w, d: W.JAR.d, r: 2.5 });
const FLOOR = 1.6; // jars stand on the tray

// One glass jar, split around a slot so the rack can sit inside it.
function jarBack(i) {
  const bath = BATHS[i];
  const x = W.jarX(i);
  const plan = jarPlan(i);
  const out = [shadowOf(plan, FLOOR)];
  out.push(`<path class="he-glass-back" d="${k.slabOf(plan, FLOOR, W.JAR.h, P, 4).fill}"/>`);
  out.push(paint(k.slabOf(k.insetPlan(plan, W.JAR.wall), FLOOR + W.JAR.wall, W.JAR.level - W.JAR.wall, P, 4), bath.liquid, { crease: "none", tone: "mid" }));
  if (bath.running) {
    const top = FLOOR + W.JAR.level;
    out.push(L(k.ring(x, -4, 6, top, P, 24) + k.ring(x, -4, 11, top, P, 32), { tone: "mid", className: "he-ripple" }));
    const bubbles = [];
    for (let b = 0; b < 6; b++) bubbles.push(at([x - 10 + b * 4, -14 + (b % 3) * 2, 6 + b * 2.6]));
    out.push(`<g class="he-bubbles">${bubbles.map(([bx, by], n) => `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="1.1" style="animation-delay:${(n * 0.23).toFixed(2)}s"/>`).join("")}</g>`);
  }
  return out.join("");
}

function jarFront(i) {
  const bath = BATHS[i];
  const x = W.jarX(i);
  const plan = jarPlan(i);
  const liquid = k.slabOf(k.insetPlan(plan, W.JAR.wall), FLOOR + W.JAR.wall, W.JAR.level - W.JAR.wall, P, 4);
  const glass = k.slabOf(plan, FLOOR, W.JAR.h, P, 4);
  const out = [];
  out.push(`<g class="he-liquid-front" style="${tones(bath.liquid)}">${liquid.shades.map((d, s) => (d ? `<path class="iso-shade" data-shade="${s}" d="${d}"/>` : "")).join("")}</g>`);
  out.push(`<g class="he-glass-front">${glass.shades.map((d) => (d ? `<path d="${d}"/>` : "")).join("")}</g>`);
  out.push(L(k.planOutline(k.insetPlan(plan, W.JAR.wall), FLOOR + W.JAR.h, P, 4), { tone: "mid" }));
  out.push(L(glass.crease, { tone: "mid" }));
  out.push(L(glass.outline, { tone: "hi", className: "he-glass-edge" }));
  // Tape label on the front face: a big number and the short reagent name.
  const fy = plan.y + plan.d + 0.05;
  const tape = [[x - 15.5, fy, 25], [x + 15.5, fy, 25], [x + 15.5, fy, 4], [x - 15.5, fy, 4]];
  out.push(`<path class="he-tape" d="${k.pathOf(tape.map(at), true)}"/>`);
  out.push(`<text class="he-jar-no" transform="${k.sideMatrix([x, fy], 23.6, P, "left")}" font-size="9.6" text-anchor="middle">${bath.no}</text>`);
  const words = bath.short.split(" ");
  const lines = words.length > 1 ? [[words[0], 14.6], [words.slice(1).join(" "), 8.4]] : [[bath.short, 11]];
  const size = words.length > 1 ? 5.6 : bath.short.length > 5 ? 5.4 : 6.4;
  for (const [text, z] of lines) out.push(`<text class="he-jar-name" transform="${k.sideMatrix([x, fy], z, P, "left")}" font-size="${size}" text-anchor="middle">${text}</text>`);
  return out.join("");
}

// Station 1: a shallow enamel tray where the loaded rack waits, with a tape label on the bench.
function startTray() {
  const t = W.TRAY_START;
  const back = [shadowOf(t, 0), paint(k.slabOf(t, 0, W.TRAY_START_H, P, 4, 0.5), C.tile), L(k.planOutline(k.insetPlan(t, 2.5), W.TRAY_START_H, P, 4), { tone: "mid" })].join("");
  const tape = { x: t.x + 2, y: 26, w: t.w - 4, d: 9, r: 0.6 };
  const front = [
    paint(k.slabOf(tape, 0, 0.4, P, 2), "#fffaf0", { crease: "none" }),
    k.faceTextSvg(k.topMatrix([W.START_X, tape.y + 7], 0.4, P, "x"), `${START_TRAY.no} ${START_TRAY.short}`, { size: 5, tone: "hi", anchor: "middle" }),
  ].join("");
  return `<g data-start>${back}<g data-slot="start"></g>${front}</g>`;
}

// The rack at rest: centre at x = 0, bottom at z = 0. The page moves it.
export function rackSvg() {
  const R = W.RACK;
  const out = [];
  const endPlate = (y) => paint(k.slabOf({ x: -R.w / 2, y, w: R.w, d: 2, r: 0.6 }, 0, 9, P, 2, 0.3), C.chrome);
  out.push(endPlate(-R.d / 2));
  for (const x of [-R.w / 2 + 1, R.w / 2 - 3]) out.push(paint(k.slabOf({ x, y: -R.d / 2 + 2, w: 2, d: R.d - 4, r: 0.4 }, 0, 1.6, P, 2), C.chrome));
  for (let j = 0; j < W.SLIDES; j++) {
    const sx = W.slideX(j);
    const slide = k.slabOf({ x: sx, y: -W.SLIDE.len / 2, w: W.SLIDE.t, d: W.SLIDE.len, r: 0 }, 1.6, W.SLIDE.tall, P, 1);
    const fx = sx + W.SLIDE.t;
    const patch = [[fx, -6, 4], [fx, 9, 4], [fx, 9, 11], [fx, -6, 11]];
    const frost = [[fx, -15, 1.6], [fx, -9, 1.6], [fx, -9, 13.6], [fx, -15, 13.6]];
    out.push(`<g${j === W.SLIDES - 1 ? ' data-part="pick-in-rack"' : ""}>${paint(slide, C.glass, { crease: "none", tone: "mid" })}<path class="he-patch" d="${k.pathOf(patch.map(at), true)}"/><path class="he-frost" d="${k.pathOf(frost.map(at), true)}"/></g>`);
  }
  out.push(endPlate(R.d / 2 - 2));
  // Wire bail from the end plates up to the hook.
  const bail = [[0, -R.d / 2 + 1, 9], [0, -6, R.hook - 2], [0, 6, R.hook - 2], [0, R.d / 2 - 1, 9]];
  out.push(`<path class="he-bail" d="${k.pathOf(bail.map(at))}"/>`);
  out.push(D([at(bail[0]), at(bail[3])], { size: 1.1, tone: "hi" }));
  out.push(paint(k.cylinder(0, 0, 1.5, R.hook + 1, W.ROD - 1, P, 16), C.chrome, { crease: "none" }));
  out.push(paint(k.cylinder(0, 0, 2.4, R.hook - 3, 4, P, 16), C.navy));
  return out.join("");
}

// The carriage at x = 0: rides the rail, carries the arm and the lift sleeve.
export function carriageSvg() {
  const out = [];
  const car = { x: -12, y: W.POST_Y - 9, w: 24, d: 18, r: 2 };
  out.push(paint(k.slabOf(car, W.BEAM_Z - 4, W.BEAM_H + 10, P, 3, 0.6), C.tomato));
  out.push(D([[-8, W.POST_Y - 9 + 18], [8, W.POST_Y - 9 + 18]].map(([x, y]) => at([x, y, W.BEAM_Z + 12])), { size: 0.8, tone: "hi" }));
  const arm = { x: -4, y: W.POST_Y + 9, w: 8, d: -W.POST_Y - 9 + 5, r: 2 };
  out.push(paint(k.slabOf(arm, W.ARM_Z, W.ARM_H, P, 3, 0.4), C.tomato));
  out.push(paint(k.cylinder(0, 0, 3.4, W.SLEEVE_Z, W.ARM_Z - W.SLEEVE_Z, P, 20), C.chrome));
  out.push(L(k.sideArc(0, 0, 3.4, W.SLEEVE_Z + 8, P, 14), { tone: "mid" }));
  out.push(paint(k.cylinder(0, 0, 3.8, W.ARM_Z + W.ARM_H, 3, P, 20), C.navy));
  return out.join("");
}

function mountStation() {
  const out = [shadowOf(W.TILE, 0)];
  out.push(paint(k.slabOf(W.TILE, 0, W.TILE_H, P, 4, 0.6), C.tile));
  out.push(L(k.planOutline(k.insetPlan(W.TILE, 4), W.TILE_H, P, 4), { tone: "faint" }));
  for (const y of [-13, 13]) out.push(paint(k.slabOf({ x: W.SLIDE_FLAT.x - 2, y: y - 1, w: 16, d: 2, r: 0.5 }, W.TILE_H, 0.6, P, 2), C.chrome, { crease: "none" }));
  out.push(paint(k.slabOf(W.COVERBOX, W.TILE_H, 5, P, 2, 0.4), C.blue));
  out.push(k.faceTextSvg(k.topMatrix([W.COVERBOX.x + 11, W.COVERBOX.y + 8.6], W.TILE_H + 5, P, "x"), "22×22", { size: 3.2, tone: "hi", anchor: "middle" }));
  const [bx, by] = W.DPX;
  out.push(roundShadow(bx, by, 7, W.TILE_H));
  out.push(paint(k.cylinder(bx, by, 7, W.TILE_H, 16, P, 32, 0.5), C.amber));
  out.push(k.faceTextSvg(k.sideMatrix([bx - 4.6, by + 6.6], W.TILE_H + 11, P, "left"), "DPX", { size: 3.6, tone: "hi" }));
  out.push(L(k.ring(bx, by, 4.2, W.TILE_H + 16, P, 24), { tone: "hi" }));
  out.push(L(k.lineOnTop([W.TILE.x + 8, 21], [W.TILE.x + 42, 18], W.TILE_H, P) + k.lineOnTop([W.TILE.x + 8, 21], [W.TILE.x + 42, 23], W.TILE_H, P), { tone: "hi", className: "he-thick", free: "end" }));
  return out.join("");
}

// The dropper is built standing in the bottle; the page lifts it over the slide.
export function dropperSvg() {
  const [bx, by] = W.DPX;
  const z = W.TILE_H + 18.5;
  // The screw cap belongs to the dropper: it lifts out with it.
  return paint(k.cylinder(bx, by, 0.9, z - 8, 14, P, 12), C.glass, { crease: "none" }) + paint(k.cylinder(bx, by, 4.2, W.TILE_H + 16, 2.5, P, 24), C.navy) + paint(k.cylinder(bx, by, 2.6, z + 6, 6, P, 20, 0.4), C.tomato);
}

export function figureBody() {
  const jars = [];
  for (let i = 0; i < W.JARS; i++) jars.push(`<g data-jar="${i}">${jarBack(i)}<g data-slot="${i}"></g>${jarFront(i)}</g>`);
  return [
    bench(),
    post(W.POSTS[0]),
    post(W.POSTS[1]),
    beam(),
    pipework(),
    controlBox(),
    startTray(),
    ...jars,
    mountStation(),
    `<g data-part="rack">${rackSvg()}</g>`,
    `<g data-part="live-slide"></g>`,
    `<g data-part="dropper">${dropperSvg()}</g>`,
    `<g data-part="carriage">${carriageSvg()}</g>`,
    `<g data-part="rod-top"></g>`,
    `<g data-part="words"></g>`,
  ].join("");
}
