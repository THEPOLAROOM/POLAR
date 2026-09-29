// MY PROFILE fidelity test — the desktop hub must BE the approved master.
//
//   node design-masters/tools/my-profile-fidelity.cjs <pageUrl> <outDir>
//
// 1. At the master's native 1672 × 941 (DPR 1), the rendered page must equal
//    design-masters/my-profile-hub-concept.png pixel for pixel, except the small
//    exit control in the top-right corner (not in the master; owner-requested).
// 2. At every tested desktop size, each transparent link must sit exactly over
//    its strip in the scaled master (hit area = master frame box × scale + offset).
// 3. No console errors, no horizontal overflow, the master never distorted or cropped.
// Writes report.json, render.png and diff.png; exits 1 if any gate fails.
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
const SPEC = require(path.join(ROOT, "src/app/dashboard/barber/account/profile-hub-spec.json"));
const W = SPEC.stage.width, H = SPEC.stage.height;
const SIZES = [[1672, 941], [1024, 768], [1366, 768], [1440, 789], [1536, 730], [1920, 953], [2560, 1305]];
const NAMES = { details: "Details", career: "Career", eportfolio: "ePortfolio", analytics: "Analytics", settings: "Settings" };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const checks = [];
  const gate = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });

  for (const [vw, vh] of SIZES) {
    const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => r.status() >= 400 && errors.push(`HTTP ${r.status()} ${r.url()}`));
    await page.goto(PAGE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(250);
    const dom = await page.evaluate(() => {
      const el = document.querySelector(".ph-master");
      const img = el.getBoundingClientRect();
      return {
        img: [img.x, img.y, img.width, img.height],
        natural: [el.naturalWidth, el.naturalHeight],
        hits: [...document.querySelectorAll(".ph-stage a.ph-hit")].map((a) => { const r = a.getBoundingClientRect(); return { name: a.getAttribute("aria-label"), href: a.getAttribute("href"), box: [r.x, r.y, r.width, r.height] }; }),
        visibleText: [...document.querySelectorAll(".ph-stage a.ph-hit")].map((a) => a.textContent.trim()).join(""),
        overflowX: document.documentElement.scrollWidth - innerWidth,
      };
    });
    const tag = `${vw}x${vh}`;
    gate(`${tag}: no console/network errors`, errors.length === 0, errors);
    gate(`${tag}: no horizontal overflow`, dom.overflowX === 0, dom.overflowX);
    gate(`${tag}: master loaded at native size`, dom.natural[0] === W && dom.natural[1] === H, dom.natural);
    const s = Math.min(vw / W, vh / H);
    gate(`${tag}: master not distorted (aspect within 0.1%)`, Math.abs(dom.img[2] / dom.img[3] - W / H) < 0.001 * (W / H), dom.img);
    gate(`${tag}: master fully visible, uncropped`, dom.img[0] >= -0.5 && dom.img[1] >= -0.5 && dom.img[0] + dom.img[2] <= vw + 0.5 && dom.img[1] + dom.img[3] <= vh + 0.5, dom.img);
    gate(`${tag}: five hit areas, no visible replacement text`, dom.hits.length === 5 && dom.visibleText === "", { count: dom.hits.length, text: dom.visibleText });
    for (const [k, r] of Object.entries(SPEC.hitAreas)) {
      const h = dom.hits.find((x) => x.name === NAMES[k]);
      const want = [dom.img[0] + r.left * s, dom.img[1] + r.top * s, (r.right - r.left + 1) * s, (r.bottom - r.top + 1) * s];
      const err = h ? Math.max(...want.map((v, i) => Math.abs(v - h.box[i]))) : Infinity;
      gate(`${tag}: ${k} hit area aligned with the master's strip (≤1px)`, err <= 1, { err: +err.toFixed(2), hit: h && h.box.map((v) => +v.toFixed(1)), want: want.map((v) => +v.toFixed(1)) });
    }
    if (vw === W && vh === H) {
      const renderPath = path.join(OUT, "render.png");
      await page.screenshot({ path: renderPath });
      const a = await sharp(renderPath).removeAlpha().raw().toBuffer();
      const b = await sharp(MASTER).removeAlpha().raw().toBuffer();
      const diff = Buffer.alloc(W * H * 3);
      let e = 0, n = 0, max = 0, changed = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 3;
        const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]));
        diff[i] = Math.min(255, d * 8);
        if (x >= W - 60 && y < 60) continue; // exit control (owner-requested, not in the master)
        e += d; n++; max = Math.max(max, d); if (d > 2) changed++;
      }
      await sharp(diff, { raw: { width: W, height: H, channels: 3 } }).png().toFile(path.join(OUT, "diff.png"));
      gate("native 1672x941: render = master (mean |Δ| ≤ 0.5, ≤ 0.1% of pixels differ by > 2)", e / n <= 0.5 && changed <= 0.001 * n, { meanAbs: +(e / n).toFixed(4), max, pixelsOver2: changed, pixels: n });
    }
    await page.close();
  }
  await browser.close();

  const failed = checks.filter((c) => !c.pass);
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({ url: PAGE_URL, passed: checks.length - failed.length, failed: failed.length, checks }, null, 2));
  for (const c of checks) console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}  ${JSON.stringify(c.detail)}`);
  console.log(`\n${checks.length - failed.length}/${checks.length} gates passed.`);
  process.exit(failed.length ? 1 : 0);
})();
