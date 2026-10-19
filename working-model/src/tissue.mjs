// The window: the section on slide 1 seen at ×400. Drawn once at build time from a
// seeded random, so every build is identical. Colours come from CSS variables
// (--nuc, --cyto, --rbc, --fibre, --haze) that the page sets from the model.

const R = 84; // field radius inside the 200 × 200 window
const C = 100;

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const f = (v) => v.toFixed(1);
const inField = (x, y, pad = 0) => Math.hypot(x - C, y - C) < R + pad;

// A polygon cell: an irregular hexagon around (x, y).
function cellPath(rand, x, y, r) {
  const n = 6;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand() * 0.3;
    const rr = r * (0.86 + rand() * 0.22);
    pts.push(`${f(x + Math.cos(a) * rr)} ${f(y + Math.sin(a) * rr * 0.92)}`);
  }
  return `M${pts.join("L")}Z`;
}

export function tissueSvg() {
  const rand = seeded(20261019);
  const out = [];
  out.push(`<defs><clipPath id="he-field"><circle cx="${C}" cy="${C}" r="${R}"/></clipPath>
<pattern id="he-wax" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 7 7 0" stroke="#ffffff" stroke-width="1.4" opacity=".55"/></pattern></defs>`);
  out.push(`<g clip-path="url(#he-field)">`);
  out.push(`<rect x="0" y="0" width="200" height="200" class="tx-bg"/>`);

  // Stroma below the epithelium: wavy collagen fibres (take eosin).
  for (let i = 0; i < 9; i++) {
    const y0 = 128 + i * 7 + rand() * 3;
    let d = `M8 ${f(y0)}`;
    for (let x = 8; x <= 192; x += 16) d += `Q${f(x + 8)} ${f(y0 + (rand() - 0.5) * 9)} ${f(x + 16)} ${f(y0 + (rand() - 0.5) * 3)}`;
    out.push(`<path class="tx-fibre" d="${d}"/>`);
  }
  // Stromal fibroblast nuclei: thin and dark.
  for (let i = 0; i < 7; i++) {
    const x = 30 + rand() * 140, y = 132 + rand() * 50;
    if (!inField(x, y, -6)) continue;
    out.push(`<ellipse class="tx-nuc" cx="${f(x)}" cy="${f(y)}" rx="${f(6 + rand() * 3)}" ry="1.7" transform="rotate(${f((rand() - 0.5) * 20)} ${f(x)} ${f(y)})"/>`);
  }

  // A capillary in the stroma, packed with red cells.
  out.push(`<path class="tx-vessel" d="M40 158C70 146 120 146 168 160C120 176 70 174 40 158Z"/>`);
  for (let i = 0; i < 9; i++) {
    const x = 54 + i * 12.5 + (rand() - 0.5) * 3, y = 159 + (rand() - 0.5) * 6;
    out.push(`<g class="tx-rbc-g"><circle class="tx-rbc" cx="${f(x)}" cy="${f(y)}" r="5.2"/><circle class="tx-rbc-pale" cx="${f(x)}" cy="${f(y)}" r="2"/></g>`);
  }
  out.push(`<ellipse class="tx-nuc" cx="62" cy="151" rx="7" ry="1.8" transform="rotate(-12 62 151)"/><ellipse class="tx-nuc" cx="142" cy="167" rx="7" ry="1.8" transform="rotate(10 142 167)"/>`);

  // Epithelium: polygonal cells, each with a round nucleus and chromatin specks.
  const r = 12.5;
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 9; col++) {
      const x = 8 + col * r * 1.75 + (row % 2) * r * 0.88 + (rand() - 0.5) * 2.5;
      const y = 14 + row * r * 1.55 + (rand() - 0.5) * 2.5;
      if (!inField(x, y, 10) || y > 118) continue;
      out.push(`<path class="tx-cyto" d="${cellPath(rand, x, y, r)}"/>`);
      const nx = x + (rand() - 0.5) * 3, ny = y + (rand() - 0.5) * 3, nr = 4.6 + rand() * 1.4;
      out.push(`<ellipse class="tx-nuc" cx="${f(nx)}" cy="${f(ny)}" rx="${f(nr)}" ry="${f(nr * 0.85)}"/>`);
      const specks = [];
      for (let k = 0; k < 4; k++) specks.push(`<circle cx="${f(nx + (rand() - 0.5) * nr)}" cy="${f(ny + (rand() - 0.5) * nr * 0.8)}" r="0.7"/>`);
      out.push(`<g class="tx-chromatin">${specks.join("")}</g>`);
      if (rand() > 0.82) out.push(`<circle class="tx-nucleolus" cx="${f(nx + 1)}" cy="${f(ny - 1)}" r="1.1"/>`);
    }
  }
  // Wax haze: a milky veil with a hatch, fades as xylene dissolves the paraffin.
  out.push(`<g class="tx-haze"><rect width="200" height="200" fill="#fbf8f0"/><rect width="200" height="200" fill="url(#he-wax)"/></g>`);
  // Coverslip glint once mounted.
  out.push(`<path class="tx-glint" d="M30 52 70 22M40 62 84 30"/>`);
  out.push(`</g>`);

  // The window's brass bezel: ring, screws and a tick at ×400.
  out.push(`<circle class="tx-ring" cx="${C}" cy="${C}" r="${R + 5}"/><circle class="tx-edge" cx="${C}" cy="${C}" r="${R}"/><circle class="tx-edge" cx="${C}" cy="${C}" r="${R + 10}"/>`);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    out.push(`<circle class="tx-screw" cx="${f(C + Math.cos(a) * (R + 5))}" cy="${f(C + Math.sin(a) * (R + 5))}" r="1.6"/>`);
  }
  return out.join("");
}

export const TISSUE_CSS = `
.he-window svg{display:block;width:100%;height:auto;overflow:visible}
.tx-bg{fill:var(--bg,#f8f5ee)}
.tx-cyto{fill:var(--cyto);stroke:#1f2a44;stroke-opacity:.28;stroke-width:.6}
.tx-nuc{fill:var(--nuc);stroke:#1f2a44;stroke-opacity:.35;stroke-width:.6}
.tx-chromatin circle,.tx-nucleolus{fill:#1f2a44;opacity:calc(var(--stain,0) * .45)}
.tx-fibre{fill:none;stroke:var(--fibre);stroke-width:3.2;stroke-linecap:round;opacity:.9}
.tx-vessel{fill:#f6f1e7;stroke:#1f2a44;stroke-opacity:.3;stroke-width:.6}
.tx-rbc{fill:var(--rbc);stroke:#1f2a44;stroke-opacity:.3;stroke-width:.5}
.tx-rbc-pale{fill:#ffffff;opacity:.28}
.tx-haze{opacity:var(--haze,0)}
.tx-glint{fill:none;stroke:#ffffff;stroke-width:3;stroke-linecap:round;opacity:calc(var(--mounted,0) * .7)}
.tx-ring{fill:none;stroke:#d9a441;stroke-width:10}
.tx-edge{fill:none;stroke:#1f2a44;stroke-width:1.4}
.tx-screw{fill:#1f2a44}
`;
