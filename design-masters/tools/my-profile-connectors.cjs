// MY PROFILE: measure the master's connector lines and dots (source of "connectors" in profile-hub-spec.json).
//   node design-masters/tools/my-profile-connectors.cjs
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const s = require(process.env.SHARP || path.join(ROOT, "node_modules/sharp"));
const C = path.join(ROOT, "design-masters/my-profile-hub-concept.png");
const Z = { tl: [546, 270, 720, 400], tr: [950, 270, 1122, 400], bl: [566, 470, 730, 620], br: [940, 470, 1108, 620], st: [790, 690, 880, 782] };
(async () => {
  const { data, info } = await s(C).removeAlpha().raw().toBuffer({ resolveWithObject: true }); const W = info.width;
  const cy = (x, y) => { const i = (y * W + x) * 3; const r = data[i], g = data[i + 1], b = data[i + 2]; return b > 190 && g > 140 && r < 140; };
  for (const [n, [x0, y0, x1, y1]] of Object.entries(Z)) {
    const H = [], V = [];
    for (let y = y0; y < y1; y++) { let run = 0, st = 0; for (let x = x0; x <= x1; x++) { if (x < x1 && cy(x, y)) { if (!run) st = x; run++; } else { if (run >= 20) H.push([y, st, st + run - 1]); run = 0; } } }
    for (let x = x0; x < x1; x++) { let run = 0, st = 0; for (let y = y0; y <= y1; y++) { if (y < y1 && cy(x, y)) { if (!run) st = y; run++; } else { if (run >= 20) V.push([x, st, st + run - 1]); run = 0; } } }
    // dots: 11x11 windows with >= 70 cyan px
    const dots = []; for (let y = y0 + 5; y < y1 - 5; y++) for (let x = x0 + 5; x < x1 - 5; x++) { let c = 0; for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) if (cy(x + dx, y + dy)) c++; if (c >= 70) dots.push([x, y, c]); }
    const cl = []; for (const d of dots.sort((a, b) => b[2] - a[2])) if (!cl.some((c) => Math.hypot(c[0] - d[0], c[1] - d[1]) < 12)) cl.push(d);
    const grp = (arr) => { const out = []; for (const r of arr) { const l = out[out.length - 1]; if (l && r[0] - l[1] <= 1 && Math.abs(r[1] - l[2]) < 6) { l[1] = r[0]; } else out.push([r[0], r[0], r[1], r[2]]); } return out; };
    console.log(n, "H(yFrom,yTo,x1,x2):", JSON.stringify(grp(H)), "\n   V(xFrom,xTo,y1,y2):", JSON.stringify(grp(V)), "\n   dots:", JSON.stringify(cl.map((d) => d.slice(0, 2))));
  }
})();
