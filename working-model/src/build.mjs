// Build: node build.mjs → index.html (one standalone page).
// The model is checked first and its self-check printed, then the art is drawn
// from the kit, then the page inlines kit + world + model + live code.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit.mjs";
import * as W from "./world.mjs";
import * as M from "./model.mjs";
import { P, figureBody } from "./art.mjs";
import { tissueSvg, TISSUE_CSS } from "./tissue.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
// The shared, verified QR for https://atultiwari.com/ (same file as the Sketchbook page); inlined, never regenerated.
const QR_SVG = readFileSync(join(HERE, "..", "..", "shared", "qr.svg"), "utf8").trim();
if (!QR_SVG.startsWith("<svg") || !QR_SVG.includes('viewBox="0 0 29 29"')) throw new Error("shared/qr.svg is missing or not the expected 29×29 QR");
// the engine is inlined into the page as a plain script
const kitScript = () => readFileSync(join(HERE, "engine", "iso-engine.mjs"), "utf8").replace(/^export /gm, "");
const strip = (file) => readFileSync(join(HERE, file), "utf8").replace(/^export /gm, "").replace(/^import .*$/gm, "");

console.log("model self-check:", M.selfCheck());

const svg = k.figureSvg({
  width: W.WIDTH,
  height: W.HEIGHT,
  label:
    "A linear slide stainer on a lab bench: a gantry carries a rack of nine slides forward along fourteen numbered glass jars, from xylene through haematoxylin, acid alcohol, Scott's tap water and eosin to the last xylene, with running-water rinse jars fed by a brass manifold, and a mounting tile at station 15 where one slide gets DPX and a coverslip.",
  body: figureBody(),
});

const css = `
.iso{--sb-page:#f5f0e5;--sb-card:#f5f0e5;--sb-paper:#f5f0e5;--sb-text:#2b3550;--sb-strong:#1f2a44;--sb-muted:#5b6480;
 --sb-hi:#1f2a44;--sb-mid:#4a5677;--sb-lo:#7c86a2;--sb-faint:#b9b2a3;--sb-lit:#1f2a44;--sb-dot:#1f2a44;--sb-weight:1.2px}
.sb-switch{padding-left:28px!important;padding-right:28px!important;margin-bottom:0!important;padding-bottom:3px!important}
@media (max-width:560px){.sb-switch{padding-left:12px!important;padding-right:12px!important}}
body{background:#f5f0e5;color:#1f2a44;font:15px/1.5 ui-rounded,"SF Pro Rounded",system-ui,-apple-system,"Segoe UI",sans-serif}
.iso-page{width:min(1240px,100% - 32px);margin:28px auto 64px}
.iso-svg .iso-line[data-tone]{vector-effect:non-scaling-stroke}
.iso-edge{stroke-width:1.2px}
.iso-crease,.iso-bevel{stroke-width:.7px}
.he-shadow{fill:#ddd4c3;stroke:none}
.he-glass-back{fill:#eef4f2;opacity:.9}
.he-glass-front path{fill:#ffffff;opacity:.22}
.he-liquid-front{opacity:.5}
.he-tape{fill:#fffaf0;stroke:#1f2a44;stroke-width:.8px;vector-effect:non-scaling-stroke}
.he-jar-no{fill:#1f2a44;font-weight:800;font-family:ui-rounded,system-ui,sans-serif}
.he-jar-name{fill:#1f2a44;font-weight:700;letter-spacing:.02em;font-family:ui-rounded,system-ui,sans-serif}
.he-lcd{fill:#24382e;stroke:#1f2a44;stroke-width:1px;vector-effect:non-scaling-stroke}
.he-lcd-text{fill:#a8f0bd;font-family:ui-monospace,Menlo,monospace;font-weight:700}
.he-led{fill:#5fd38a;stroke:#1f2a44;stroke-width:.6px}
.he-patch{fill:var(--slide-col,#efe9dd);stroke:#1f2a44;stroke-width:.5px;stroke-opacity:.5;vector-effect:non-scaling-stroke}
.he-frost{fill:#ffffff;stroke:#1f2a44;stroke-width:.5px;stroke-opacity:.5;vector-effect:non-scaling-stroke}
.he-live-glass{fill:#e6f0ee;stroke:#1f2a44;stroke-width:1px;vector-effect:non-scaling-stroke}
.he-dpx{fill:#f3e7c0;opacity:.85;stroke:#b8934a;stroke-width:.6px;vector-effect:non-scaling-stroke}
.he-coverslip{fill:#ffffff;fill-opacity:.35;stroke:#1f2a44;stroke-width:1px;vector-effect:non-scaling-stroke}
.he-bail{fill:none;stroke:#1f2a44;stroke-width:1.6px;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.he-thick{stroke-width:1.8px}
.he-bubbles circle{fill:#ffffff;stroke:#1f2a44;stroke-width:.5px;animation:he-rise 1.4s linear infinite}
@keyframes he-rise{0%{transform:translateY(4px);opacity:0}20%{opacity:1}100%{transform:translateY(-12px);opacity:0}}
.he-ripple{animation:he-ripple 1.6s ease-in-out infinite}
@keyframes he-ripple{50%{opacity:.35}}
.he-word{font-family:"Caveat","Chalkboard SE","Comic Sans MS","Marker Felt",cursive;font-size:17px;font-weight:700;fill:#c2412d;paint-order:stroke;stroke:#f5f0e5;stroke-width:3px;text-anchor:middle}

.he-head{margin:0 0 14px}
.he-head h1{font-size:clamp(20px,3vw,28px);line-height:1.2;margin:0 0 4px;color:#1f2a44}
.he-head p{margin:0;color:#5b6480}
.he-head .he-q{font-size:17px;font-weight:700;color:#2b3550;margin:2px 0 2px}
.he-card{display:grid;grid-template-columns:220px minmax(0,1fr);background:#f5f0e5;border:1.5px solid #1f2a44;border-radius:18px;box-shadow:4px 4px 0 #ddd4c3;overflow:hidden}
.he-steps{display:flex;flex-direction:column;gap:9px;padding:16px 16px 18px;border-right:1.5px solid #1f2a44;background:#efe8d8}
.he-figno{font:600 11px/1 ui-monospace,Menlo,monospace;letter-spacing:.12em;color:#5b6480}
.he-title{font-size:22px;font-weight:800;margin:4px 0 6px}
.he-switch{display:flex;background:#e4dbc7;border:1.5px solid #1f2a44;border-radius:999px;padding:3px;margin-bottom:4px}
.he-switch button{flex:1;border:0;background:none;border-radius:999px;padding:6px 0;font:inherit;font-weight:700;color:#4a5677;cursor:pointer}
.he-switch button[aria-pressed="true"]{background:#1f2a44;color:#f5f0e5}
.he-pill{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:1.5px solid #1f2a44;border-radius:999px;padding:6px 14px 6px 6px;background:#fffaf0;font:inherit;font-weight:700;color:#1f2a44;box-shadow:3px 3px 0 #ddd4c3;cursor:pointer;transition:opacity .3s,background .3s}
.he-pill .n{flex:none;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#1f2a44;color:#f5f0e5;font-size:14px}
.he-pill[data-state="locked"]{opacity:.45;cursor:not-allowed;box-shadow:none}
.he-pill[data-state="done"]{opacity:.5;cursor:default;box-shadow:none;background:#efe8d8}
.he-pill[data-state="done"] .n{background:#7fa596}
.he-pill[data-state="running"]{background:#ebbb4c;cursor:default}
.he-pill[data-state="running"] .n{background:#e0623f}
.he-pill[data-state="next"]:not(:disabled){animation:he-pulse 1.3s ease-in-out infinite}
.he-pill[data-state="next"]:disabled{cursor:default}
@keyframes he-pulse{50%{box-shadow:3px 3px 0 #ddd4c3,0 0 0 6px #ebbb4c88}}
.he-restart{margin-top:auto;padding-top:10px;color:#4a5677;font-weight:700;align-self:flex-start}
.he-stage{min-width:0;padding:14px 16px 14px;display:grid;grid-template-columns:minmax(0,1fr) 236px;grid-template-areas:"hint hint" "fig side" "map map" "chips chips";gap:10px 14px;align-items:start}
.he-hint{grid-area:hint;display:flex;align-items:center;gap:12px;background:#fffaf0;border:1.5px solid #1f2a44;border-radius:16px;padding:9px 14px;box-shadow:3px 3px 0 #ddd4c3;height:76px;overflow:hidden}
.he-hint-no{flex:none;display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:#e0623f;color:#fff;font-weight:800}
.he-hint-text{flex:1;font-size:16px;line-height:1.35}
.he-speed{flex:none;background:#1f2a44;color:#ebbb4c;font-weight:800;border-radius:999px;padding:4px 10px;font-variant-numeric:tabular-nums}
.he-fig{grid-area:fig;position:relative;min-width:0}
.he-fig .iso-svg{overflow:hidden;border-radius:12px}
.he-figbar{display:flex;justify-content:space-between;align-items:center;font:12px/1 ui-monospace,Menlo,monospace;color:#5b6480;margin:0 2px 4px;font-variant-numeric:tabular-nums}
.he-view{border:1.2px solid #1f2a44;background:#fffaf0;border-radius:999px;padding:3px 10px;font:600 12px/1.2 ui-rounded,system-ui,sans-serif;color:#1f2a44;cursor:pointer}
.he-side{grid-area:side;display:flex;flex-direction:column;gap:10px}
.he-window{text-align:center}
.he-window-label{font-size:12px;color:#4a5677;font-weight:700;margin-top:2px}
.he-active{display:flex;align-items:center;gap:10px;background:#fffaf0;border:1.5px solid #1f2a44;border-radius:14px;padding:8px 12px 8px 8px;box-shadow:3px 3px 0 #ddd4c3}
.he-active-no{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:10px;background:#1f2a44;color:#f5f0e5;font-size:20px;font-weight:800}
.he-active-swatch{flex:none;width:12px;height:40px;border-radius:5px;border:1.5px solid #1f2a44}
.he-active-name{display:block;font-size:16px;font-weight:800;line-height:1.15}
.he-active-sub{display:block;font-size:12.5px;color:#4a5677;font-variant-numeric:tabular-nums}
.he-tape{transition:fill .45s ease}
[data-jar].is-active .he-tape{fill:#ffd765}
.he-map{grid-area:map;display:grid;grid-template-columns:repeat(17,minmax(0,1fr));gap:4px;position:relative}
.he-cell{position:relative;border:1.2px solid #1f2a44;border-radius:6px;background:var(--liq,#fffaf0);height:34px;display:grid;place-items:center;font:800 12px/1 ui-rounded,system-ui,sans-serif;color:#1f2a44;transition:transform .3s,box-shadow .3s}
.he-cell small{position:absolute;bottom:-14px;left:50%;transform:translateX(-50%);font:600 8.5px/1 ui-monospace,Menlo,monospace;color:#5b6480;white-space:nowrap}
.he-cell[data-dark] {color:#fff}
.he-cell.is-past{opacity:.5}
.he-cell.is-here{box-shadow:0 0 0 3px #ebbb4c;transform:translateY(-2px)}
.he-mapnote{grid-area:map;align-self:end;margin-bottom:-2px}
.he-chips{grid-area:chips;display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.he-chip{display:inline-flex;gap:6px;align-items:baseline;background:#fffaf0;border:1.2px solid #1f2a44;border-radius:8px;padding:3px 9px;font:12.5px/1.4 ui-monospace,Menlo,monospace}
.he-chip span{color:#5b6480;text-transform:uppercase;letter-spacing:.04em;font-size:11px}
.he-chip b{font-variant-numeric:tabular-nums}
.he-idea{font-size:clamp(17px,2.2vw,21px);font-weight:800;margin:16px 0 6px;color:#1f2a44;background:#fffaf0;border:1.5px solid #1f2a44;border-radius:14px;padding:10px 14px}
.he-idea::before{content:"";display:inline-block;width:12px;height:12px;border-radius:50%;background:#ebbb4c;border:1.5px solid #1f2a44;margin-right:8px}
.he-note{font-size:12.5px;color:#5b6480;max-width:90ch}
.he-keys{font-size:12px;color:#5b6480;margin-top:6px}

.iso-page{width:min(1400px,100% - 32px);margin:12px auto 10px}
.he-head{margin:0 0 8px}
.he-head h1{font-size:24px;margin:0 0 2px}
@media (max-height:820px){.he-head{margin-bottom:4px}.he-head h1{font-size:21px;margin:0}.he-head .he-q{font-size:14px}}
.he-head .he-q{font-size:15px;font-weight:700;margin:0}
.he-head .he-q span{font-weight:400;color:#5b6480}
.he-steps{padding:12px 14px;gap:7px}
.he-title{font-size:19px;margin:0 0 4px}
.he-pill{padding:4px 12px 4px 5px}
.he-pill .n{width:26px;height:26px;font-size:13px}
.he-stage{padding:10px 14px 10px;gap:8px 14px;grid-template-columns:minmax(0,1fr) 210px}
.he-hint{height:62px;padding:7px 12px}
.he-hint-text{font-size:15px}
.he-chips{margin-top:12px}
.he-idea{font-size:16px;margin:10px 0 4px;padding:7px 12px}
.he-foot{display:flex;gap:14px;align-items:baseline;font-size:12px;color:#5b6480}
.he-sources summary{cursor:pointer;font-weight:700;color:#4a5677}
.he-sources p{max-width:110ch;margin:4px 0 0}
.he-credit{margin:6px 0 0;text-align:center;font-size:12.5px;color:#7c86a2}
.he-heart{color:#d33a3a}
.he-credit{position:relative}
.he-qr-link{position:absolute;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;gap:3px;color:#5b6480;text-decoration:none;font-size:10px;letter-spacing:.06em}
.he-qr-link svg{width:76px;height:76px;background:#fbf8f0;border:1.5px solid #1f2a44;border-radius:8px;padding:4px}
@media (min-width:561px){.he-idea,.he-foot{margin-right:96px}}
@media (max-width:560px){.he-qr-link{position:static;margin:10px auto 0;width:max-content}.he-qr-link svg{width:64px;height:64px}}
@media (max-height:820px) and (min-width:1100px){.he-hint{height:56px}.he-pill{padding:3px 12px 3px 5px}.he-steps{gap:5px}}
@media (max-width:1099px){
 .he-stage{grid-template-columns:1fr;grid-template-areas:"hint" "fig" "map" "side" "chips"}
 .he-side{flex-direction:row;align-items:center}
 .he-window{width:46%;flex:none}
 .he-active{flex:1}
}
@media (max-width:820px){
 .iso-page{width:calc(100% - 24px);margin:14px auto 40px}
 .he-card{grid-template-columns:1fr}
 .he-steps{display:grid;grid-template-columns:1fr 1fr;gap:7px;border-right:0;border-bottom:1.5px solid #1f2a44;padding:12px}
 .he-title,.he-switch,.he-restart{grid-column:1/-1}
 .he-title{font-size:18px;margin:0}
 .he-restart{margin-top:0;padding-top:2px}
 .he-pill{padding:5px 10px 5px 5px;font-size:13.5px;gap:7px}
 .he-pill .n{width:26px;height:26px;font-size:13px}
 .he-stage{padding:10px 8px}
 .he-hint-text{font-size:14.5px}
 .he-hint{height:112px}
 .he-side{flex-direction:column}
 .he-window{width:min(78%,260px)}
 .he-active{align-self:stretch}
 .he-cell{height:26px;font-size:10.5px;border-radius:4px}
 .he-cell small{display:none}
 .he-map{gap:2px}
}
@media (prefers-reduced-motion:reduce){.he-bubbles circle,.he-ripple,.he-pill{animation:none!important}}

.he-mrow,.he-player,.he-more-btn,.he-credit-link{display:none}
@media (max-width:560px){
 .iso-page{width:calc(100% - 20px);margin:8px auto 0;padding-bottom:78px}
 .he-head{margin:0 0 6px}
 .he-head h1{font-size:15px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .he-head .he-q{display:none}
 .he-card{overflow:visible;border-radius:14px;box-shadow:none}
 .he-steps{position:sticky;top:0;z-index:5;display:flex;flex-direction:row;overflow-x:auto;gap:6px;padding:8px;background:#f5f0e5;border-right:0;border-bottom:1.5px solid #1f2a44;border-radius:14px 14px 0 0;scrollbar-width:none}
 .he-steps::-webkit-scrollbar,.he-map::-webkit-scrollbar{display:none}
 .he-title,.he-switch,.he-restart{display:none}
 .he-pill{flex:none;width:auto;min-height:42px;white-space:nowrap;padding:5px 13px 5px 6px;font-size:14px;box-shadow:none}
 .he-pill[data-state="next"]{background:#fff3c4}
 .he-stage{display:grid;grid-template-columns:minmax(0,1fr);grid-template-areas:"mrow" "fig" "map" "active" "hint" "chips";gap:8px;padding:8px}
 .he-side{display:contents}
 .he-active{grid-area:active;margin:0}
 .he-active-name{font-size:16px}
 .he-mrow{grid-area:mrow;display:flex;gap:10px;align-items:center;font:600 12.5px/1.2 ui-monospace,Menlo,monospace;color:#4a5677;font-variant-numeric:tabular-nums}
 .he-mrow-step{color:#1f2a44}
 .he-mrow-badge{margin-left:auto;background:#1f2a44;color:#ebbb4c;border-radius:999px;padding:3px 8px;font-weight:800}
 .he-mrow-badge:empty{display:none}
 .he-figbar{display:none}
 .he-fig .iso-svg{display:block;width:100%;height:44vh;background:#f5f0e5;border:1.2px solid #1f2a44;border-radius:12px}
 .he-fig .he-window{position:absolute;top:6px;right:6px;width:56px;margin:0;z-index:2;cursor:zoom-in;transition:width .25s ease}
 .he-fig .he-window.is-big{width:70%;cursor:zoom-out}
 .he-window-label{display:none}
 .he-map{display:flex;overflow-x:auto;gap:4px;padding:2px;scrollbar-width:none}
 .he-cell{flex:none;width:38px;height:34px;font-size:12px;cursor:pointer;border-radius:6px}
 .he-hint{grid-area:hint;height:auto;min-height:0;align-items:flex-start;flex-wrap:wrap;gap:4px;padding:8px 10px;box-shadow:none}
 .he-hint-no,.he-hint .he-speed{display:none}
 .he-hint-text{flex:1 1 100%;font-size:14.5px;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
 .he-stage.is-more .he-hint-text{display:block}
 .he-more-btn{display:inline-block;border:0;background:none;padding:0;font:700 13px/1.4 ui-rounded,system-ui,sans-serif;color:#4a5677;text-decoration:underline;cursor:pointer}
 .he-chips{display:none;margin-top:0}
 .he-stage.is-more .he-chips{display:flex}
 .he-player{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:10;gap:8px;padding:8px 10px calc(8px + env(safe-area-inset-bottom));background:#f5f0e5;border-top:1.5px solid #1f2a44}
 .he-player button{flex:1;min-height:48px;border:1.5px solid #1f2a44;border-radius:12px;background:#fffaf0;font:800 15px/1 ui-rounded,system-ui,sans-serif;color:#1f2a44}
 .he-player button[data-on="true"]{background:#ebbb4c}
 .he-idea{font-size:15px;margin:10px 0 4px}
 .he-idea,.he-foot{margin-right:0}
 .he-keys{display:none}
 .he-qr-link{display:none}
 .he-credit-link{display:block;margin-top:4px;color:#4a5677;font-weight:700}
}
@media (orientation:landscape) and (max-height:500px){
 .iso-page{width:calc(100% - 20px);margin:6px auto}
 .he-head .he-q{display:none}
 .he-head h1{font-size:16px}
 .he-card{grid-template-columns:170px minmax(0,1fr)}
 .he-steps{display:flex;flex-direction:column;gap:4px;border-right:1.5px solid #1f2a44;border-bottom:0;padding:8px}
 .he-title{font-size:15px;margin:0}
 .he-switch{grid-column:auto}
 .he-pill{padding:2px 8px 2px 3px;font-size:12.5px}
 .he-pill .n{width:22px;height:22px;font-size:11px}
 .he-stage{grid-template-columns:minmax(0,1fr) 150px;grid-template-areas:"hint hint" "fig side" "map map" "chips chips";padding:6px 8px;gap:6px 10px}
 .he-side{flex-direction:column;align-items:stretch}
 .he-window{width:100%}
 .he-active{padding:5px 8px 5px 5px}
 .he-active-no{width:30px;height:30px;font-size:15px}
 .he-active-name{font-size:13px}
 .he-hint{height:44px}
 .he-hint-text{font-size:13px}
 .he-cell{height:24px;font-size:10.5px}
 .he-cell small{display:none}
}
${TISSUE_CSS}`;

const pill = (s, i) => `<button class="he-pill" data-state="locked" type="button"><span class="n">${i + 1}</span>${s.label}</button>`;
const chip = (key, label) => `<span class="he-chip"><span>${label}</span><b data-chip="${key}">—</b></span>`;
const sources = M.BATHS.filter((b) => b.how === "typical").map((b) => `${b.no} ${b.name} ${Math.round(b.seconds / 60)} min`).join(", ");

const cell = (b) => `<div class="he-cell" style="--liq:${b.liquid || "#f6f2e9"}"${b.kind === "haem" || b.kind === "eosin" ? " data-dark" : ""}>${b.no}<small>${b.short}</small></div>`;
const body = `
<header class="he-head"><h1>H&amp;E Staining · Working Model</h1>
<p class="he-q">How does H&amp;E staining turn a colourless tissue section pink and blue? <span>Press the steps in order; the rack only ever moves forward, station 1 → 17.</span></p></header>
<div class="he-card">
  <nav class="he-steps" aria-label="Staining steps">
    <span class="he-title">The H&amp;E stainer</span>
    <div class="he-switch" role="group" aria-label="Mode"><button type="button" data-mode="auto" aria-pressed="false">▸ Auto</button><button type="button" data-mode="manual" aria-pressed="true">Manual</button></div>
    ${M.STEPS.map(pill).join("")}
    <a href="#" class="he-restart">↺ Start over</a>
  </nav>
  <section class="he-stage">
    <div class="he-mrow" aria-hidden="true"><span class="he-mrow-step">Step 1 of 7</span><span class="he-mrow-clock"></span><span class="he-mrow-badge"></span></div>
    <div class="he-hint" aria-live="polite"><span class="he-hint-no">1</span><span class="he-hint-text"></span><span class="he-speed" hidden></span><button type="button" class="he-more-btn" aria-expanded="false">More</button></div>
    <div class="he-fig iso" data-theme="light">
      <div class="he-figbar"><span data-readout></span><button type="button" class="he-view" aria-pressed="false">Whole bench</button></div>
      ${svg}
    </div>
    <div class="he-side">
      <div class="he-window" aria-label="Window: the section on the slides, seen at ×400"><svg viewBox="-12 -12 224 224" role="img" aria-label="Magnified tissue section">${tissueSvg()}</svg><div class="he-window-label">Window: the section at ×400</div></div>
      <div class="he-active"><span class="he-active-no">1</span><span class="he-active-swatch"></span><span><span class="he-active-name">Xylene</span><span class="he-active-sub"></span></span></div>
    </div>
    <div class="he-map" aria-label="The line of stations, 1 to 17">${cell(M.START_TRAY)}${M.BATHS.map(cell).join("")}${cell(M.MOUNT)}</div>
    <div class="he-chips">${chip("bath", "Station")}${chip("time", "In bath")}${chip("clock", "Lab clock")}${chip("ph", "pH")}${chip("nuc", "Nuclei")}${chip("cyto", "Cytoplasm")}${chip("rbc", "Red cells")}${chip("look", "Section")}</div>
    <div class="he-player" role="toolbar" aria-label="Player"><button type="button" data-player="play">▶ Play</button><button type="button" data-player="pause">❚❚ Pause</button><button type="button" data-player="stop">■ Stop</button><button type="button" data-player="bench" aria-pressed="false">Bench</button></div>
  </section>
</div>
<p class="he-idea">${M.BIG_IDEA}</p>
<div class="he-foot"><span class="he-keys">Space or Enter runs the next step.</span><details class="he-sources"><summary>Sources</summary><p>Every station, name and time follows the shared protocol (he-protocol.md): Bancroft's <i>Theory and Practice of Histological Techniques</i>, 8th ed., ch. 10, p. 131 (non-automated H&amp;E, steps 1–10) and p. 128 (Harris haematoxylin, regressive, 5–15 min); ch. 11, Fig. 11.5 (jar order of a linear stainer). Stated by Bancroft: haematoxylin 5 min, tap water until blue 5 min, acid alcohol 10 s, Scott's then a 5 min wash, eosin 10 min then a 1–5 min wash (2 min here). Typical times where Bancroft gives none: ${sources}. Lab clock = bath time only, ${Math.floor(M.TOTAL_SECONDS / 60)} min ${M.TOTAL_SECONDS % 60} s; carrying the rack and mounting are not counted. pH values are approximate general chemistry. Stain uptake curves are a teaching model tuned to the textbook result, not measurements.</p></details></div>
<footer class="he-credit">Made with <span class="he-heart">♥</span> and a passion for teaching pathology · Dr. Atul Tiwari<a class="he-qr-link" href="https://atultiwari.com/" target="_blank" rel="noopener">${QR_SVG}<span>atultiwari.com</span></a><a class="he-credit-link" href="https://atultiwari.com/" target="_blank" rel="noopener">atultiwari.com</a></footer>`;

const script = [kitScript(), strip("world.mjs"), strip("model.mjs"), `const P = ${JSON.stringify(P)};`, readFileSync(join(HERE, "live.js"), "utf8")].join("\n");
const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap" rel="stylesheet">`;
const html = k.pageHtml({ title: "H&E Staining · Working Model", theme: "light", body, script, width: 1240 }).replace("</head>", `${fonts}<style>${css}</style><script src="../shared/switcher.js" defer></script></head>`).replace('<body class="iso" data-theme="light">', '<body class="iso" data-theme="light">');
writeFileSync(join(HERE, "..", "index.html"), html);
console.log("wrote index.html", (html.length / 1024).toFixed(0), "KB");
