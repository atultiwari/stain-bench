/* ============================================================
   H&E staining, 3D: the microscope panel (a flat SVG, as in the 2D figure).
   heDrawScope(st) redraws it from the page state: the field's colours follow
   st.from -> st.to by st.blend; while a slide is being mounted it shows a side-view close-up.
   ============================================================ */
const HE_SC = { cx: 0, cy: 0, r: 104 };
const HE_SC_VB = { field: '-114 -114 228 228', closeUp: '-200 -130 400 260' };
const HE_BRASS = '#c9a14a';

function heScopeField(lk, mounted, clipId = 'heScopeClip') {
  const { cx, cy, r } = HE_SC, pt = ([u, v]) => [cx + u * r, cy + v * r];
  const poly = pts => 'M' + pts.map(p => pt(p).map(f).join(' ')).join('L') + 'Z';
  let g = `<rect x="${f(cx - r)}" y="${f(cy - r)}" width="${f(2 * r)}" height="${f(2 * r)}" fill="${lk.bg}"/>`;
  g += HE_FIELD.fibres.map(fb => `<path d="M${fb.map(p => pt(p).map(f).join(' ')).join('L')}" fill="none" stroke="${lk.fib}" stroke-width="6" stroke-linecap="round"/>`).join('');
  for (const c of HE_FIELD.cells) {
    const [nx, ny] = pt([c.nx, c.ny]);
    g += `<path d="${poly(c.pts)}" fill="${lk.cyto}" stroke="${mix(lk.cyto, '#000000', .18)}" stroke-width=".7"/>`
       + `<ellipse cx="${f(nx)}" cy="${f(ny)}" rx="${f(c.rx * r)}" ry="${f(c.ry * r)}" transform="rotate(${f(c.rot)} ${f(nx)} ${f(ny)})" fill="${lk.nuc}"/>`;
  }
  for (const rb of HE_FIELD.rbcs) {
    const [x, y] = pt(rb);
    g += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.055 * r)}" fill="${lk.rbc}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(.025 * r)}" fill="${mix(lk.rbc, '#ffffff', .3)}"/>`;
  }
  if (lk.haze > 0) g += `<rect x="${f(cx - r)}" y="${f(cy - r)}" width="${f(2 * r)}" height="${f(2 * r)}" fill="#ffffff" opacity="${f(lk.haze)}"/>`;
  if (mounted) g += `<path d="M${f(cx - r * .7)} ${f(cy - r * .3)}A${f(r * .8)} ${f(r * .8)} 0 0 1 ${f(cx - r * .25)} ${f(cy - r * .72)}" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity=".6"/>`;
  return `<clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><g clip-path="url(#${clipId})">${g}</g>`
    + `<circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="none" stroke="${HE_BRASS}" stroke-width="5"/>`
    + `<circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="none" stroke="${INK}" stroke-width="1.4"/><circle cx="${cx}" cy="${cy}" r="${r + .4}" fill="none" stroke="${INK}" stroke-width="1"/>`;
}

// draws the panel (laptops) and the phone's inset; each gets its own clip-path id
function heDrawScope(st) {
  const closeUp = !!(st.ms && st.ms.onTile && st.busy), mounted = st.to === 'mounted' && st.blend >= 1;
  const lk = heLookOf(st.from, st.to, st.blend), mini = document.getElementById('scopeMini');
  const big = !!(mini && mini.classList.contains('big'));
  const cap = document.getElementById('scopeCap');
  if (cap) cap.textContent = closeUp ? 'Close-up, side view: mounting one slide' : 'The marked slide at x40';
  // the inset only shows the mounting close-up when it is enlarged; small, it keeps the round field
  [['scope', 'scopeArt', 'heScopeClip', closeUp], ['scopeMiniSvg', 'scopeMiniArt', 'heScopeClipMini', closeUp && big]].forEach(([svgId, artId, clip, cu]) => {
    const svg = document.getElementById(svgId), art = document.getElementById(artId);
    if (!svg || !art || !svg.getClientRects().length) return;          // skip whichever one is hidden
    svg.setAttribute('viewBox', cu ? HE_SC_VB.closeUp : HE_SC_VB.field);
    art.innerHTML = cu ? heMountCloseUp(st) : heScopeField(lk, mounted, clip);
  });
  if (mini) mini.classList.toggle('wide', closeUp && big);
}

/* the mounting close-up: a side view big enough to see the drop and the angle of the coverslip */
function heMountCloseUp(st) {
  const m = st.ms, lk = heLookOf(st.from, st.to, st.blend);
  const txt = (x, y, t, a = 'middle') => `<text x="${x}" y="${y}" font-size="12" text-anchor="${a}" font-family="ui-monospace,Menlo,monospace" font-weight="800" fill="${INK}">${t}</text>`;
  let s = `<rect x="-185" y="44" width="370" height="22" rx="4" fill="${CERAMIC.m}" stroke="${INK}" stroke-width="1.6"/>` + txt(150, 82, 'TILE');
  s += `<rect x="-160" y="30" width="320" height="14" fill="${HE_GLASS.l}" stroke="${INK}" stroke-width="1.6"/><rect x="100" y="31" width="58" height="12" fill="#fbfaf5"/>` + txt(-160, 100, 'SLIDE, STILL WET WITH XYLENE', 'start');
  s += `<rect x="-120" y="26" width="110" height="4" rx="2" fill="${heTissue(lk)}" stroke="${INK}" stroke-width=".8"/>` + txt(-65, 16, 'SECTION');
  if (m.drop > 0 && m.drop < 1) {
    const y = -70 + 92 * ease(m.drop);
    s += `<rect x="-71" y="-112" width="12" height="34" rx="3" fill="${CLEAR.m}" stroke="${INK}" stroke-width="1.2"/><ellipse cx="-65" cy="-116" rx="9" ry="7" fill="${DARK.m}" stroke="${INK}" stroke-width="1.2"/>`
       + `<circle cx="-65" cy="${f(y)}" r="6" fill="#e2b766" stroke="${INK}" stroke-width="1"/>` + txt(-40, -84, 'DROP OF DPX', 'start');
  }
  if (m.dpx > 0) {
    // the drop spreads under the coverslip and stays on the slide (x -160..160)
    const k = (m.dpx - .15) / .85, w = 10 + 105 * k, h = 7 * (1 - .6 * k), cx = -65 + 40 * k;
    s += `<path d="M${f(cx - w)} 26Q${f(cx)} ${f(26 - 2 * h)} ${f(cx + w)} 26Z" fill="#e2b766" fill-opacity=".55" stroke="${INK}" stroke-width=".8"/>`;
  }
  if (m.cs > 0) {
    const t = m.cs, lift = Math.max(0, 1 - t / .3) * 40, ang = (t < .3 ? 1 : 1 - ease((t - .3) / .7)) * 35 * Math.PI / 180;
    const hx = -150, hy = 22 - lift, ex = hx + 250 * Math.cos(ang), ey = hy - 250 * Math.sin(ang);
    s += `<path d="M${hx} ${f(hy)}L${f(ex)} ${f(ey)}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M${hx} ${f(hy)}L${f(ex)} ${f(ey)}" stroke="#e8f4f6" stroke-width="2.6" stroke-linecap="round"/>`;
    s += t < 1 ? txt(f(ex - 10), f(ey - 12), 'COVERSLIP', 'end') + txt(-150, -100, 'LOWERED FROM ONE EDGE', 'start') + txt(-150, -84, 'SO NO AIR IS TRAPPED', 'start')
               : txt(-150, -100, 'SEALED: NO BUBBLES', 'start');
    if (t < 1) s += `<path d="M${f(ex + 14)} ${f(ey - 6)}q 14 18 2 34" fill="none" stroke="${INK}" stroke-width="1.4"/><path d="M${f(ex + 10)} ${f(ey + 24)}l6 6 4-8" fill="none" stroke="${INK}" stroke-width="1.4"/>`;
  }
  return s;
}
