/* ============================================================
   H&E staining, 3D: the phone layout, "follow the rack" (../he-mobile-spec.md).
   On phones in portrait the camera glides after the rack and frames the jar it is over plus one
   neighbour each side; a drag pauses that until the next step starts; Bench zooms out to the whole bench.
   Also: the station rail, the microscope inset, the folding camera buttons and the note's More / Less.
   Loaded before he-app.js; everything here runs only when called.
   ============================================================ */
const HE_PHONE = matchMedia('(max-width:560px)');
const HE_REDUCE = matchMedia('(prefers-reduced-motion: reduce)');
const heFollow = { paused: false, bench: false, snap: true };
const hePhoneLast = { strip: -1, rail: -1 };

const heClockShort = secs => `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;
const heChipColour = s0 => HE_LIQ[s0.liq] ? HE_LIQ[s0.liq][0] : s0.liq === 'pad' ? CERAMIC.l : METAL.m;
const heIsDark = hex => { const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16)); return .299 * r + .587 * g + .114 * b < 140; };

function hePhoneBuild() {
  const rail = document.getElementById('rail');
  HE_STATIONS.forEach((s0, i) => {
    const b = document.createElement('button'), col = heChipColour(s0);
    b.textContent = s0.num; b.title = `${s0.num} ${s0.name}`; b.setAttribute('aria-label', b.title);
    b.style.background = col; b.style.color = heIsDark(col) ? '#fbf7ea' : INK;
    b.onclick = () => heTapStation(i);
    rail.appendChild(b);
  });
  const mini = document.getElementById('scopeMini');
  mini.onclick = () => {
    const big = mini.classList.toggle('big');
    mini.setAttribute('aria-pressed', String(big));
    mini.setAttribute('aria-label', big ? 'Microscope view: tap to shrink' : 'Microscope view: tap to enlarge');
    heDrawScope(st);
  };
  const camBox = document.getElementById('cam'), more = document.getElementById('camMore');
  more.onclick = () => more.setAttribute('aria-expanded', String(camBox.classList.toggle('open')));
  const note = document.querySelector('.note'), noteMore = document.getElementById('noteMore');
  noteMore.onclick = () => {
    const open = note.classList.toggle('open');
    noteMore.textContent = open ? 'Less' : 'More';
    noteMore.setAttribute('aria-expanded', String(open));
  };
  document.getElementById('heBench').onclick = () => heSetBench(!heFollow.bench);
  HE_PHONE.addEventListener('change', () => { hePhoneLast.strip = hePhoneLast.rail = -1; heFollow.snap = true; heSyncPanel(); });
}

let heBenchView = null;                      // set by he-app.js: zooms the camera out to the whole bench
function heSetBench(on) {
  heFollow.bench = on;
  if (on && heBenchView) heBenchView();
  if (!on) heFollow.paused = false;          // glide back to the rack
  const b = document.getElementById('heBench');
  b.setAttribute('aria-pressed', String(on));
  b.textContent = on ? '⤡ Rack' : '⤢ Bench';
}

// keep the strip, the rail and the card in step with the rack
function hePhoneSync() {
  document.querySelectorAll('#rail button').forEach((b, i) => {
    b.classList.toggle('on', i === (st.ms ? HE_IDX.mount : st.now));
    b.classList.toggle('done', i < (st.ms ? HE_IDX.mount : st.now));
  });
  if (!HE_PHONE.matches) return;
  const behavior = HE_REDUCE.matches ? 'auto' : 'smooth';
  const strip = Math.min(st.step, HE_STEPS.length - 1);
  if (strip !== hePhoneLast.strip) {
    hePhoneLast.strip = strip;
    const b = document.querySelectorAll('#btns .act')[strip];
    if (b) b.scrollIntoView({ inline: 'center', block: 'nearest', behavior });
  }
  const now = st.ms ? HE_IDX.mount : st.now;
  if (now !== hePhoneLast.rail) {
    hePhoneLast.rail = now;
    const rail = document.getElementById('rail'), b = rail.children[now];
    // centre the chip inside the rail only, so the page itself never jumps
    if (b) rail.scrollTo({ left: b.offsetLeft - (rail.clientWidth - b.offsetWidth) / 2, behavior });
  }
}

// the follow cam: eased toward the rack's live position (or the slide being mounted), three jars wide
function heFollowTick(T, camera, controls, cam, dt) {
  if (!HE_PHONE.matches || heFollow.paused || heFollow.bench || cam.busy) return;
  const o = st.ms ? st.ms.O : [st.rx, st.ry, st.rz], row = st.ms ? 'back' : heRowOfX(o[0]);
  const p = heW(T, o[0], o[1], 0), target = new T.Vector3(p.x, HE_ROWS[row].base + 46, p.z);
  const tanV = Math.tan(T.MathUtils.degToRad(camera.fov / 2)), tanH = tanV * camera.aspect;
  const r = Math.max((1.5 * HE_P + 14) / tanH, 92 / tanV) + 60;
  const off = new T.Vector3().setFromSpherical(new T.Spherical(r, T.MathUtils.degToRad(60), T.MathUtils.degToRad(-18)));
  const k = heFollow.snap ? 1 : 1 - Math.exp(-dt * 3);
  heFollow.snap = false;
  controls.target.lerp(target, k);
  camera.position.lerp(target.add(off), k);
}
