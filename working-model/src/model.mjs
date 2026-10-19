// The H&E model: one pure module. Every number on the page comes from here:
// bath times, the lab clock, the speed badge, pH chips, and the colour of every
// part of the section seen through the window. The page and the build both import it.
//
// Source of every station, name and time: docs/protocol.md, shared by all
// three versions (Sketchbook, Turntable, Working Model). It follows
//   [B] Bancroft's Theory and Practice of Histological Techniques, 8th ed., ch. 10:
//       p. 131 box "Non-automated hematoxylin and eosin stain for paraffin sections" (steps 1–10),
//       p. 128 (Harris's haematoxylin, regressive, 5–15 min); ch. 11 Fig. 11.5 (linear stainer jar order).
// "sure" = the time is stated by Bancroft; "typical" = Bancroft gives the step but not the time.
// pH values are general chemistry, not from Bancroft, and are marked as approximate on screen.

export const DRAIN_SECONDS = 0; // the protocol counts bath time only; carrying the rack is not on the clock

// 17 stations: 1 start tray, 2–16 the fifteen jars below, 17 the mounting tile.
export const START_TRAY = { no: 1, short: "START", name: "Start tray: paraffin sections", how: "–", note: "the rack waits here with nine waxed sections" };

// kind: what the bath does to the section. pH is shown only for water-based baths.
export const BATHS = [
  { no: 2, short: "XYLENE", name: "Xylene", kind: "dewax", seconds: 300, liquid: "#f0e7c4", how: "typical", note: "[B] step 1 “dewax”; time typical" },
  { no: 3, short: "ALC 99%", name: "99% (absolute) alcohol", kind: "alcohol", strength: 1, seconds: 120, liquid: "#e4ecef", how: "typical", note: "[B] “descending grades of alcohol”; time typical" },
  { no: 4, short: "ALC 70%", name: "70% alcohol", kind: "alcohol", strength: 0.7, seconds: 120, liquid: "#e2eee8", how: "typical", note: "time typical" },
  { no: 5, short: "WATER", name: "Water", kind: "water", seconds: 60, pH: 7.0, liquid: "#cfe5f0", how: "typical", note: "[B] “…to water”" },
  { no: 6, short: "HAEM", name: "Harris haematoxylin", kind: "haem", seconds: 300, pH: 2.7, liquid: "#4a2766", how: "sure", note: "[B] p. 128: 5–15 min, regressive" },
  { no: 7, short: "TAP WATER", name: "Running tap water", kind: "tap", seconds: 300, pH: 7.5, liquid: "#c6e1ee", running: true, how: "sure", note: "[B] step 4: until sections ‘blue’, 5 min or less" },
  { no: 8, short: "ACID ALC", name: "1% acid alcohol (1% HCl in 70% alcohol)", kind: "acid", seconds: 10, pH: 1, dips: 4, liquid: "#f3dfe1", how: "sure", note: "[B] step 5: 5–10 s, quick dips" },
  { no: 9, short: "TAP WATER", name: "Running tap water", kind: "tap", seconds: 60, pH: 7.5, liquid: "#c6e1ee", running: true, how: "typical", note: "Fig. 11.5 water after acid alcohol; time typical" },
  { no: 10, short: "SCOTT'S", name: "Scott's tap water substitute (bluing)", kind: "blue", seconds: 60, pH: 8.0, liquid: "#d5e3f5", how: "sure", note: "[B] step 7: blue in an alkaline solution" },
  { no: 11, short: "TAP WATER", name: "Running tap water", kind: "tap", seconds: 300, pH: 7.5, liquid: "#c6e1ee", running: true, how: "sure", note: "[B] step 7: followed by a 5 minute tap water wash" },
  { no: 12, short: "EOSIN", name: "1% eosin Y", kind: "eosin", seconds: 600, pH: 4.7, liquid: "#e0507a", how: "sure", note: "[B] step 8: 10 min" },
  { no: 13, short: "TAP WATER", name: "Running tap water", kind: "tap", seconds: 120, pH: 7.5, liquid: "#c6e1ee", running: true, how: "sure", note: "[B] step 9: 1–5 min, differentiates the eosin" },
  { no: 14, short: "ALC 95%", name: "95% alcohol", kind: "alcohol", strength: 0.95, seconds: 60, liquid: "#e7edf0", how: "typical", note: "[B] step 10 “dehydrate through alcohols”; time typical" },
  { no: 15, short: "ALC 99%", name: "99% (absolute) alcohol", kind: "alcohol", strength: 1, seconds: 120, liquid: "#e4ecef", how: "typical", note: "time typical" },
  { no: 16, short: "XYLENE", name: "Xylene (clearing)", kind: "clear", seconds: 300, liquid: "#f0e7c4", how: "typical", note: "time typical; slides wait here until mounted" },
];

// Mounting is not on the lab clock (protocol: "–"); `seconds` only paces how the section seals.
export const MOUNT = { no: 17, short: "MOUNT", name: "Mounting: DPX and coverslip", seconds: 60, timed: false, how: "–", note: "[B] step 10: clear, and mount" };
export const STATIONS = 17;

export const STEPS = [
  { key: "dewax", label: "Dewax", baths: [0, 1, 2, 3], hint: "The tissue is stuck in wax. Xylene washes the wax out, then alcohol and water make it wet again." },
  { key: "haem", label: "Haematoxylin", baths: [4, 5], hint: "A purple dye soaks in for 5 minutes. Running water washes the extra away." },
  { key: "diff", label: "Differentiate", baths: [6, 7], hint: "Quick dips in acid pull the purple off everything except the nuclei, which turn red." },
  { key: "blue", label: "Blue", baths: [8, 9], hint: "Scott's water is gently alkaline. It turns the red nuclei crisp blue." },
  { key: "eosin", label: "Eosin", baths: [10, 11], hint: "A pink dye colours the rest of the cell. Running water then rinses out the extra pink." },
  { key: "dehydrate", label: "Dehydrate & clear", baths: [12, 13, 14], hint: "Alcohol pulls the water out and xylene makes the tissue see-through. The slides wait in xylene." },
  { key: "mount", label: "Coverslip", baths: [15], hint: "One slide comes out, gets a drop of glue, and a thin glass lid is lowered from one edge so no bubbles hide." },
];

export const BIG_IDEA = "The big idea: haematoxylin colours what is acidic (the DNA in nuclei) blue; eosin colours what is basic (the proteins in cytoplasm) pink.";

// The section before staining: a paraffin section, wax in, dry, unstained.
export const START = Object.freeze({ wax: 1, wet: 0, haemN: 0, haemC: 0, blue: 0, eosC: 0, eosR: 0, clear: 0, mounted: 0 });

const toward = (value, target, seconds, tau) => target + (value - target) * Math.exp(-seconds / tau);

// What `seconds` in one bath does to the section. Time constants are chosen so the
// standard time above gets the textbook result; they are a teaching model, not measured.
export function soak(state, bath, seconds) {
  const s = { ...state };
  const t = Math.max(0, seconds);
  switch (bath.kind) {
    case "dewax":
      s.wax = toward(s.wax, 0, t, 50); // 5 min leaves ~0.25% wax
      break;
    case "alcohol":
      s.wet = toward(s.wet, bath.strength >= 0.99 ? 0 : 1 - bath.strength, t, 12);
      s.eosC *= Math.exp(-t / (bath.strength >= 0.99 ? 900 : 300)); // 95% pulls a little eosin back out; 99% less
      break;
    case "water":
      s.wet = toward(s.wet, 1, t, 10);
      break;
    case "haem": {
      const uptake = s.wet; // a dry or waxy section takes no aqueous dye
      s.haemN = toward(s.haemN, 1, t * uptake, 95); // 5 min → 96% of the nuclei's capacity
      s.haemC = toward(s.haemC, 0.65, t * uptake, 100); // regressive: deliberately over-stains everything
      s.blue = toward(s.blue, 0, t, 5); // pH 2.7: the aluminium-haematein lake is red-purple
      break;
    }
    case "tap":
      s.blue = Math.max(s.blue, toward(s.blue, 0.35, t, 160)); // tap water blues slowly and only partly; never un-blues
      s.eosC *= Math.exp(-t / 600); // after eosin, the wash differentiates it ([B] step 9)
      break;
    case "acid":
      s.haemC = toward(s.haemC, 0, t, 2.5); // 10 s strips ~98% of the background stain
      s.haemN = toward(s.haemN, 0, t, 160); // nuclei lose only ~6% in 10 s
      s.blue = toward(s.blue, 0, t, 0.8); // acid turns the lake red again
      break;
    case "blue":
      s.blue = toward(s.blue, 1, t, 14); // pH 8 → crisp blue in well under a minute
      break;
    case "eosin":
      s.eosC = toward(s.eosC, 0.9, t, 120); // 10 min → 99%
      s.eosR = toward(s.eosR, 1, t, 80);
      break;
    case "clear":
      s.clear = toward(s.clear, 1, t * (1 - s.wet), 60);
      break;
    case "mount":
      s.mounted = Math.min(1, t / bath.seconds);
      break;
    default:
      break;
  }
  return Object.freeze(s);
}

// The section after bath `index` has run for `seconds` (all earlier baths ran in full).
export function sectionAt(index, seconds) {
  let s = START;
  for (let i = 0; i < index; i++) s = soak(s, BATHS[i], BATHS[i].seconds);
  if (index >= 0 && index < BATHS.length) s = soak(s, BATHS[index], seconds);
  if (index === BATHS.length) s = soak(sectionAt(BATHS.length - 1, BATHS[BATHS.length - 1].seconds), { kind: "mount", seconds: MOUNT.seconds }, seconds);
  return s;
}

// Lab clock in real seconds when bath `index` has run for `seconds`.
export function clockAt(index, seconds) {
  let t = 0;
  for (let i = 0; i < Math.min(index, BATHS.length); i++) t += DRAIN_SECONDS + BATHS[i].seconds;
  if (index >= BATHS.length) return t; // mounting is not on the lab clock
  return t + DRAIN_SECONDS + Math.max(0, seconds);
}
export const TOTAL_SECONDS = clockAt(BATHS.length, 0); // 2830 s = 47 min 10 s, as in he-protocol.md

// How long each bath plays on screen, and the honest speed badge that follows.
export function playSeconds(seconds) {
  return seconds <= 12 ? seconds : Math.min(5, 1.6 + Math.sqrt(seconds) * 0.2); // short dips play in real time
}
export const speedOf = (seconds) => seconds / playSeconds(seconds);
export function badge(seconds) {
  const x = speedOf(seconds);
  if (Math.abs(x - 1) < 0.05) return "×1 real time";
  return x >= 1 ? `×${Math.round(x)}` : `×1/${Math.round(1 / x)}`;
}

// ---- colour ---------------------------------------------------------------
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const out = (rgb) => "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
export const mix = (a, b, t) => {
  const [x, y] = [hex(a), hex(b)];
  const k = Math.max(0, Math.min(1, t));
  return out(x.map((v, i) => v + (y[i] - v) * k));
};

export const INK = {
  bare: { nuc: "#e6dfd2", cyto: "#f1ece2", rbc: "#efdcc4", bg: "#f8f5ee" }, // unstained: nearly colourless (RBCs faintly yellow)
  haemRed: "#8c2d6c", // unblued alum haematein: red-purple
  haemBlue: "#2b3d93", // blued: crisp blue-purple
  eosinC: "#ec8fae", // cytoplasm pink
  eosinR: "#e04a3c", // red cells: bright orange-red
};

export function coloursOf(s) {
  const hue = mix(INK.haemRed, INK.haemBlue, s.blue);
  const nuc = mix(INK.bare.nuc, hue, s.haemN * 0.95);
  const cyto = mix(mix(INK.bare.cyto, hue, s.haemC * 0.6), INK.eosinC, Math.min(1, s.eosC * 1.15));
  const rbc = mix(mix(INK.bare.rbc, hue, s.haemC * 0.25), INK.eosinR, s.eosR * 0.9);
  const fibre = mix(mix("#e9e2d4", hue, s.haemC * 0.45), "#e8679a", Math.min(1, s.eosC * 1.2));
  return { nuc, cyto, rbc, fibre, bg: INK.bare.bg, haze: Math.min(0.78, s.wax * 0.78) };
}

export function wordsOf(s) {
  const nuc = s.haemN < 0.1 ? "colourless" : s.blue > 0.6 ? "crisp blue" : s.blue > 0.25 ? "purple" : "red-purple";
  const cyto = s.eosC > 0.35 ? "pink" : s.haemC > 0.25 ? "purple (too much)" : s.haemC > 0.05 ? "faint purple" : "colourless";
  const rbc = s.eosR > 0.4 ? "red" : "pale";
  const look = s.wax > 0.2 ? "hazy with wax" : s.mounted > 0.99 ? "sealed under glass" : s.clear > 0.9 ? "clear" : s.wet > 0.5 ? "wet" : "dry";
  return { nuc, cyto, rbc, look };
}

// A self-check printed by the build: the numbers should read like a textbook.
export function selfCheck() {
  const end = sectionAt(BATHS.length - 1, BATHS[BATHS.length - 1].seconds);
  const afterHaem = sectionAt(4, 300);
  const afterAcid = sectionAt(6, 10);
  return {
    total: `${Math.floor(TOTAL_SECONDS / 60)} min ${TOTAL_SECONDS % 60} s`,
    waxLeft: sectionAt(0, 300).wax.toFixed(3),
    haemNuclei: afterHaem.haemN.toFixed(2),
    haemBackground: afterHaem.haemC.toFixed(2),
    backgroundAfterAcid: afterAcid.haemC.toFixed(2),
    blueAfterScotts: sectionAt(8, 60).blue.toFixed(2),
    eosinAfterEosin: sectionAt(10, 600).eosC.toFixed(2),
    eosinCyto: end.eosC.toFixed(2),
    badges: BATHS.map((b) => `${b.no}:${badge(b.seconds)}`).join(" "),
  };
}
