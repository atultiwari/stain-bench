import assert from "node:assert/strict";
import * as M from "./model.mjs";
const last = M.BATHS.length - 1;
// wax is gone after dewax, section wet after water
assert.ok(M.sectionAt(0, 300).wax < 0.01);
assert.ok(M.sectionAt(3, 60).wet > 0.99);
// haematoxylin over-stains, acid strips background, nuclei keep it
const h = M.sectionAt(4, 300); assert.ok(h.haemN > 0.9 && h.haemC > 0.5 && h.blue < 0.01);
const a = M.sectionAt(6, 10); assert.ok(a.haemC < 0.12 && a.haemN > 0.85 && a.blue < 0.1);
assert.ok(M.sectionAt(8, 60).blue > 0.95);
const e = M.sectionAt(last, M.BATHS[last].seconds); assert.ok(e.eosC > 0.45 && e.eosR > 0.9 && e.clear > 0.9 && e.wet < 0.01);
// purity: same input, same output; START is never mutated
assert.deepEqual(M.sectionAt(5, 30), M.sectionAt(5, 30)); assert.equal(M.START.wax, 1);
// clock is monotonic across baths
let prev = -1; for (let i = 0; i < M.BATHS.length; i++) for (const t of [0, M.BATHS[i].seconds]) { const c = M.clockAt(i, t); assert.ok(c >= prev); prev = c; }
// steps cover every bath once, in order (forward only)
assert.deepEqual(M.STEPS.flatMap((s) => s.baths).slice(0, -1), M.BATHS.map((_, i) => i));
assert.equal(M.badge(10), "×1 real time");
// the protocol file: 15 jars numbered 2–16, 47 min 10 s of bath time, mount 17, eosin 10 min then a tap wash
assert.deepEqual(M.BATHS.map((b) => b.no), [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
assert.equal(M.TOTAL_SECONDS, 47 * 60 + 10);
assert.equal(M.MOUNT.no, 17); assert.equal(M.START_TRAY.no, 1);
assert.equal(M.BATHS[10].seconds, 600); assert.equal(M.BATHS[11].kind, "tap");
assert.ok(M.sectionAt(11, 120).eosC < M.sectionAt(10, 600).eosC); // the wash takes a little eosin out
console.log("model ok", M.selfCheck());
