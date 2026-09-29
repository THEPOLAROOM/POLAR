// MY PROFILE navigation-strip art, extracted from the approved master
// (design-masters/my-profile-hub-concept.png) — owner-approved 2026-09-29.
//
//   node design-masters/tools/my-profile-strips.cjs [concept.png] [outDir]
//
// Writes profile-strip-<name>.webp (lossless RGBA; default outDir
// public/dashboard/polar-ui) and prints each strip's measured boxes (frame, art,
// icon, label, chevron) as JSON: the source of "strips" in profile-hub-spec.json.
// Every kept pixel is the master's own: alpha and colour are solved from
// p = a·col + (1 − a)·k (art over the master's dark background, level k). The baked
// icon, label and chevron are erased (they are live HTML), connector stubs are
// erased (redrawn in SVG), and identified room features are masked out. Splatter
// and drips are kept only at each strip's two ends and only where saturated.
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const s = require(process.env.SHARP || path.join(ROOT, "node_modules/sharp"));
const CONCEPT = process.argv[2] || path.join(ROOT, "design-masters/my-profile-hub-concept.png");
const OUT = process.argv[3] || path.join(ROOT, "public/dashboard/polar-ui");
const PAD = { l: 48, r: 48, t: 40, b: 62 };
const STRIPS = {
  details:    { f: [213, 259, 545, 343], erase: [[548, 289, 600, 306], [268, 219, 290, 258], [268, 345, 290, 405]] },
  career:     { f: [1122, 259, 1462, 344], erase: [[1070, 290, 1119, 307], [1476, 219, 1510, 264]] },
  eportfolio: { f: [271, 562, 566, 644], erase: [[569, 583, 618, 600], [486, 522, 524, 552], [318, 650, 350, 706], [505, 672, 530, 700], [222, 640, 240, 668], [238, 528, 256, 550], [500, 646, 530, 664], [340, 645, 356, 656]] },
  analytics:  { f: [1108, 560, 1440, 646], erase: [[1056, 581, 1105, 598], [1378, 678, 1396, 706], [1450, 652, 1488, 708], [1280, 528, 1330, 548]] },
  // SETTINGS sits over the reflective floor and POLAR's shoes: drips truncated, top glow band kept tight.
  settings:   { f: [652, 782, 1014, 868], erase: [[822, 700, 839, 779], [680, 742, 772, 779], [928, 742, 1000, 779]], maxBottom: 880, topGlow: 7, paintTop: 18 },
};
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
(async () => {
  const { data, info } = await s(CONCEPT).removeAlpha().raw().toBuffer({ resolveWithObject: true }); const W = info.width;
  const px = (x, y) => { const i = (y * W + x) * 3; return [data[i], data[i + 1], data[i + 2]]; };
  const cyan = ([r, g, b]) => b > 200 && g > 140 && r < 150;
  const white = ([r, g, b]) => r > 185 && g > 185 && b > 185 && Math.max(r, g, b) - Math.min(r, g, b) < 45;
  const bbox = (x0, y0, x1, y1, t) => { const b = [1e9, 1e9, -1, -1]; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (t(px(x, y))) { b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); } return b[2] < 0 ? null : b; };
  const spec = {};
  for (const [name, st] of Object.entries(STRIPS)) {
    const [L, T, R, B] = st.f;
    const x0 = L - PAD.l, y0 = T - PAD.t, x1 = R + PAD.r, y1 = Math.min(st.maxBottom ?? 1e9, B + PAD.b);
    const w = x1 - x0, h = y1 - y0;
    // baked content boxes (live in HTML)
    const icon = bbox(L + 20, T + 12, L + 95, B - 12, cyan);
    const label = bbox(L + 95, T + 16, R - 60, B - 16, white);
    const chev = bbox(R - 60, T + 24, R - 14, B - 20, cyan);
    const boxes = [icon, label, chev].filter(Boolean).map(([a, b, c, d]) => [a - 4, b - 4, c + 4, d + 4]);
    const erase = [...boxes, ...st.erase];
    const out = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const X = x0 + x, Y = y0 + y, o = (y * w + x) * 4;
      if (erase.some(([a, b, c, d]) => X >= a && X <= c && Y >= b && Y <= d)) continue;
      const p = px(X, Y);
      // distance outside the frame box (0 inside); interior = inside the frame line
      const dx = Math.max(L - X, 0, X - R), dy = Math.max(T - Y, 0, Y - B), dist = Math.hypot(dx, dy);
      const interior = X > L + 6 && X < R - 6 && Y > T + 6 && Y < B - 6;
      const mx = Math.max(...p), mn = Math.min(...p), sat = mx ? (mx - mn) / mx : 0;
      // black point: low in the glow band, higher inside the panel (drops baked haze), smooth ramp outward
      const k = interior ? 24 : 10 + 28 * smooth(12, 26, dist);
      const a0 = Math.max(0, Math.max(...p) - k) / (255 - k);
      let a = a0;
      const q = p.map((v) => Math.max(0, v - k));
      if (st.topGlow && Y < T && dist > st.topGlow && !(X < L + 75 || X > R - 75)) continue;
      if (dist > 12) {
        // Splatter/drips only live at the strip's two ends, <=32px above the frame, and are saturated paint.
        const inEnds = X < L + 75 || X > R - 75;
        const zone = inEnds && Y >= T - (st.paintTop ?? 32) ? 1 : 0;
        a *= 1 - smooth(12, 26, dist) * (1 - zone * smooth(0.35, 0.55, sat) * smooth(0, 40, Math.max(...q)));
      }
      if (a <= 0.004) continue;
      const aa = Math.max(a0, 1e-3);
      for (let c = 0; c < 3; c++) out[o + c] = Math.max(0, Math.min(255, Math.round((p[c] - (1 - aa) * k) / aa)));
      out[o + 3] = Math.round(Math.min(1, a) * 255);
    }
    await s(out, { raw: { width: w, height: h, channels: 4 } }).webp({ lossless: true, effort: 6 }).toFile(path.join(OUT, `profile-strip-${name}.webp`));
    spec[name] = { frame: { left: L, top: T, right: R, bottom: B }, art: { left: x0, top: y0, width: w, height: h }, icon, label, chevron: chev };
  }
  console.log(JSON.stringify(spec));
})();
