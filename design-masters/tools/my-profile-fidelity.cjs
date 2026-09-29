// MY PROFILE fidelity test — the approved master is the measurable target.
//
//   node design-masters/tools/my-profile-fidelity.cjs <pageUrl> <outDir>
//
// Renders the desktop hub at the master's native 1672 × 941 (DPR 1) and scores
// it against design-masters/my-profile-hub-concept.png and the measured spec
// (src/app/dashboard/barber/account/profile-hub-spec.json). Writes report.json,
// render.png, onion.png (red = master, blue = render) and diff.png, and exits 1
// if any gate fails. Regions listed in DEVIATIONS differ from the master by an
// owner-approved decision; they are measured and reported, not gated.
//
// Needs playwright-core and a Chromium build. Paths via env:
//   PLAYWRIGHT_CORE (module path), CHROMIUM (executable), SHARP (module path).
const path = require("path");
const fs = require("fs");
const ROOT = path.resolve(__dirname, "../..");
const sharp = require(process.env.SHARP || path.join(ROOT, "node_modules/sharp"));
const { chromium } = require(process.env.PLAYWRIGHT_CORE || "playwright-core");

const [, , PAGE_URL, OUT = "fidelity-out"] = process.argv;
const MASTER = path.join(ROOT, "design-masters/my-profile-hub-concept.png");
const MATTE = path.join(ROOT, "public/dashboard/polar-ui/profile-polar-matte.webp");
const SPEC = require(path.join(ROOT, "src/app/dashboard/barber/account/profile-hub-spec.json"));
const W = 1672, H = 941;

// Owner-approved differences (2026-09-29, D1–D5 + extraction approval).
const DEVIATIONS = [
  "POLAR: production POLAR at 1:1 (untouched pixels), not the master's re-rendered POLAR (head ~25px higher, different render).",
  "Room: untouched profile-room-v1.webp positioned +276,+35; the master's room layout (left chair/lamp, right shelves and pink cabinet, brighter floor) is not reproduced. Left 276px / top 35px / bottom 97px fade to navy.",
  "Title: official POLAR alphabet at the master's letter height; wider than the master's lettering; no title splatter halo.",
  "SETTINGS strip: lower drips truncated and top glow thinned (floor-reflection contamination in the master).",
  "Close ✕: not in the master; top-right.",
];

const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

async function raw(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, px: (x, y) => { const i = (y * info.width + x) * 3; return [data[i], data[i + 1], data[i + 2]]; } };
}
function bbox(img, [x0, y0, x1, y1], test) {
  const b = [1e9, 1e9, -1, -1];
  let sum = [0, 0, 0], n = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const p = img.px(x, y); if (test(p)) { b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); sum = sum.map((v, i) => v + p[i]); n++; } }
  return b[2] < 0 ? null : { box: b, colour: sum.map((v) => Math.round(v / n)) };
}
const white = ([r, g, b]) => r > 185 && g > 185 && b > 185 && Math.max(r, g, b) - Math.min(r, g, b) < 45;
const glyph = ([r, g, b]) => b > 200 && g > 120 && r < 90;
const pink = ([r, g, b]) => r > 180 && b > 120 && g < 90;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(PAGE_URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const dom = await page.evaluate(() => {
    const st = document.querySelector(".ph-stage").getBoundingClientRect();
    return {
      stage: [st.x, st.y, st.width, st.height],
      strips: [...document.querySelectorAll(".ph-stage a.ph-strip")].map((a) => { const r = a.getBoundingClientRect(); return { label: a.getAttribute("aria-label"), href: a.getAttribute("href"), box: [r.x, r.y, r.right - 1, r.bottom - 1].map(Math.round) }; }),
      overflowX: document.documentElement.scrollWidth - innerWidth,
      title: (() => { const r = document.querySelector(".ph-stage h1").getBoundingClientRect(); return [r.x, r.y, r.right, r.bottom].map(Math.round); })(),
    };
  });
  const renderPath = path.join(OUT, "render.png");
  await page.screenshot({ path: renderPath });
  const refPage = await browser.newPage({ viewport: { width: SPEC.room.width, height: SPEC.room.height }, deviceScaleFactor: 1 });
  await refPage.setContent(`<body style="margin:0;background:#000"><img src="${new URL(SPEC.room.src, PAGE_URL).href}" style="display:block;width:${SPEC.room.width}px;height:${SPEC.room.height}px"></body>`, { waitUntil: "networkidle" });
  const refPath = path.join(OUT, "room-browser-decoded.png");
  await refPage.screenshot({ path: refPath });
  await browser.close();

  const M = await raw(MASTER), Rn = await raw(renderPath);
  const checks = [];
  const gate = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });

  gate("no console errors", errors.length === 0, errors);
  gate("no horizontal overflow", dom.overflowX === 0, dom.overflowX);
  gate("stage at scale 1 on whole pixels at native size", dom.stage[0] === 0 && dom.stage[1] === 0 && dom.stage[2] === W && dom.stage[3] === H, dom.stage);

  for (const [k, s] of Object.entries(SPEC.strips)) {
    const d = dom.strips.find((x) => Math.abs(x.box[0] - s.frame.left) < 40 && Math.abs(x.box[1] - s.frame.top) < 40);
    gate(`${k}: link box = master frame box`, d && d.box[0] === s.frame.left && d.box[1] === s.frame.top && d.box[2] === s.frame.right && d.box[3] === s.frame.bottom, { dom: d && d.box, master: s.frame });
    const f = s.frame;
    // label: cap box of white text inside the frame
    const lr = bbox(Rn, [f.left + 95, f.top + 16, f.right - 60, f.bottom - 20], white);
    const [ml, mt, mr, mb] = s.label;
    const lb = lr && lr.box;
    gate(`${k}: label cap top/bottom within 3px`, lb && Math.abs(lb[1] - mt) <= 3 && Math.abs(lb[3] - mb) <= 3, { render: lb, master: s.label });
    gate(`${k}: label left within 3px`, lb && Math.abs(lb[0] - ml) <= 3, { render: lb && lb[0], master: ml });
    gate(`${k}: label width within 10%`, lb && Math.abs((lb[2] - lb[0]) - (mr - ml)) <= 0.1 * (mr - ml), { render: lb && lb[2] - lb[0], master: mr - ml });
    // icon glyph
    const ir = bbox(Rn, [f.left + 26, f.top + 14, f.left + 92, f.bottom - 14], glyph), im = bbox(M, [f.left + 26, f.top + 14, f.left + 92, f.bottom - 14], glyph);
    const c = (b) => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
    gate(`${k}: icon centre within 3px`, ir && Math.hypot(c(ir.box)[0] - c(im.box)[0], c(ir.box)[1] - c(im.box)[1]) <= 3, { render: ir && ir.box, master: im.box });
    gate(`${k}: icon size within 10%`, ir && Math.abs((ir.box[2] - ir.box[0]) - (im.box[2] - im.box[0])) <= 0.1 * (im.box[2] - im.box[0]) + 1 && Math.abs((ir.box[3] - ir.box[1]) - (im.box[3] - im.box[1])) <= 0.1 * (im.box[3] - im.box[1]) + 1, { render: ir && ir.box, master: im.box });
    gate(`${k}: icon colour within 30 RGB`, ir && dist(ir.colour, im.colour) <= 30, { render: ir && ir.colour, master: im.colour });
    // chevron
    const [cl, ct, cr, cb] = s.chevron;
    const cRn = bbox(Rn, [cl - 6, ct - 6, cr + 6, cb + 6], glyph);
    gate(`${k}: chevron within 3px`, cRn && Math.abs(cRn.box[0] - cl) <= 3 && Math.abs(cRn.box[1] - ct) <= 3 && Math.abs(cRn.box[3] - cb) <= 3, { render: cRn && cRn.box, master: s.chevron });
  }

  // Strip art: where the master's art is (near-)opaque, the render must match it.
  for (const [k, s] of Object.entries(SPEC.strips)) {
    const a = s.art;
    const { data: al, info } = await sharp(path.join(ROOT, "public", s.art.src)).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
    let e = 0, n = 0;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      if (al[y * info.width + x] < 200) continue;
      const X = a.left + x, Y = a.top + y; const p = Rn.px(X, Y), q = M.px(X, Y);
      e += (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2])) / 3; n++;
    }
    gate(`${k}: frame/splatter art matches master (MAE ≤ 12 where opaque)`, n > 500 && e / n <= 12, { mae: +(e / n).toFixed(2), pixels: n });
  }

  // POLAR integrity: rendered pixels inside his matte are the untouched source pixels.
  {
    const room = await raw(path.join(OUT, "room-browser-decoded.png")); // same decoder as the page
    const { data: mt, info } = await sharp(MATTE).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
    const b = SPEC.polar.srcBox, R = SPEC.room;
    let e = 0, n = 0, max = 0;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      if (mt[y * info.width + x] < 255) continue;
      const sx = b.x + x, sy = b.y + y, X = R.left + sx, Y = R.top + sy;
      if (X >= W || Y >= H) continue;
      const p = Rn.px(X, Y), q = room.px(sx, sy);
      const d = Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1]), Math.abs(p[2] - q[2]));
      e += d; n++; max = Math.max(max, d);
    }
    gate("POLAR: rendered pixels = untouched source file (mean |Δ| ≤ 1)", n > 50000 && e / n <= 1, { meanAbs: +(e / n).toFixed(3), max, pixels: n });
  }

  // Connectors: every spec segment is drawn in the render.
  for (const [k, c] of Object.entries(SPEC.connectors)) {
    let hit = 0, tot = 0;
    for (let i = 1; i < c.path.length; i++) {
      const [x0, y0] = c.path[i - 1], [x1, y1] = c.path[i];
      const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let t = 2; t < steps - 2; t += 2) { const x = Math.round(x0 + ((x1 - x0) * t) / steps), y = Math.round(y0 + ((y1 - y0) * t) / steps); tot++; let ok = false; for (let d = -1; d <= 1 && !ok; d++) { const p = Rn.px(x + (y0 === y1 ? 0 : d), y + (y0 === y1 ? d : 0)); if (p[2] > 190 && p[1] > 150) ok = true; } if (ok) hit++; }
    }
    gate(`connector ${k}: drawn on the master's path (≥95%)`, tot > 0 && hit / tot >= 0.95, { coverage: +(hit / tot).toFixed(3) });
  }

  // Title letter core height (the D2 decision: match the master's height).
  // Letter core height over each title's own letters (the D2 metric): rows holding >= 25% of the peak white count.
  const core = (img, x0, x1) => { const rows = []; for (let y = 0; y < 230; y++) { let n = 0; for (let x = x0; x <= x1; x++) if (white(img.px(x, y))) n++; rows.push(n); } const th = Math.max(...rows) * 0.25; let a = -1, b = -1; rows.forEach((n, i) => { if (n >= th) { if (a < 0) a = i; b = i; } }); return { rows: [a, b], h: b - a }; };
  const cm = core(M, SPEC.title.letters[0], SPEC.title.letters[2]);
  const tb = dom.title, sc = SPEC.title.box.width / 1085; // title asset is 1085 px wide, letters span 10..1072
  const cr = core(Rn, Math.round(tb[0] + 10 * sc), Math.round(tb[0] + 1072 * sc));
  gate("title: letter core height within 4px of master", Math.abs(cr.h - cm.h) <= 4, { render: cr, master: cm });
  gate("title: letters centred on the master's (±6px)", Math.abs((tb[0] + (10 + 1072) / 2 * sc) - (SPEC.title.letters[0] + SPEC.title.letters[2]) / 2) <= 6, { renderCentre: Math.round(tb[0] + 541 * sc), master: (SPEC.title.letters[0] + SPEC.title.letters[2]) / 2 });

  // Pink in the strip regions (D3: the master's pink is the target).
  let pm = 0, pr = 0;
  for (const s of Object.values(SPEC.strips)) { const a = s.art; for (let y = a.top; y < a.top + a.height; y++) for (let x = a.left; x < a.left + a.width; x++) { if (pink(M.px(x, y))) pm++; if (pink(Rn.px(x, y))) pr++; } }
  gate("pink in strip regions ≥ 80% of master", pr >= 0.8 * pm, { render: pr, master: pm });

  // Whole-frame information (deviation regions included): band luminance.
  const band = (img, x0, y0, x1, y1) => { let t = 0, n = 0; for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) { t += lum(...img.px(x, y)); n++; } return +(t / n).toFixed(1); };
  const info = { bands: {} };
  for (const [n, r] of Object.entries({ left: [0, 0, 250, H], right: [W - 250, 0, W, H], floor: [0, 780, W, H], centre: [700, 200, 970, 760] })) info.bands[n] = { master: band(M, ...r), render: band(Rn, ...r) };

  // Images: onion (red = master, blue = render) and diff heatmap.
  const on = Buffer.alloc(W * H * 3), df = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) { const a = [M.data[i * 3], M.data[i * 3 + 1], M.data[i * 3 + 2]], b = [Rn.data[i * 3], Rn.data[i * 3 + 1], Rn.data[i * 3 + 2]]; const la = lum(...a), lb = lum(...b); on[i * 3] = Math.min(255, la * 1.6); on[i * 3 + 1] = Math.min(255, Math.min(la, lb) * 1.6); on[i * 3 + 2] = Math.min(255, lb * 1.6); const d = Math.min(255, dist(a, b) * 2); df[i * 3] = d; df[i * 3 + 1] = d * 0.3; df[i * 3 + 2] = 0; }
  await sharp(on, { raw: { width: W, height: H, channels: 3 } }).png().toFile(path.join(OUT, "onion.png"));
  await sharp(df, { raw: { width: W, height: H, channels: 3 } }).png().toFile(path.join(OUT, "diff.png"));

  const failed = checks.filter((c) => !c.pass);
  const report = { url: PAGE_URL, passed: checks.length - failed.length, failed: failed.length, checks, deviations: DEVIATIONS, info };
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
  for (const c of checks) console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}  ${JSON.stringify(c.detail)}`);
  console.log(`\n${checks.length - failed.length}/${checks.length} gates passed. Bands: ${JSON.stringify(info.bands)}`);
  process.exit(failed.length ? 1 : 0);
})();
