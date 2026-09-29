// MY PROFILE fidelity test — the desktop hub must BE the approved master.
//
//   node design-masters/tools/my-profile-fidelity.cjs <pageUrl> <outDir>
//
// 1. At the master's native 2019 × 779 (DPR 1), the rendered page must equal
//    design-masters/my-profile-master.png pixel for pixel, except the small exit
//    control in the top-right corner (not in the master; owner-requested).
// 2. At every tested desktop size: the master is never distorted, the safe area
//    (five strips, title, POLAR, SETTINGS) is fully visible, the master fills the
//    window unless the safe-area zoom cap binds, and each transparent link sits
//    exactly over its strip (≤ 1 px).
// 3. No console errors and no horizontal overflow.
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
const MASTER = path.join(ROOT, "design-masters/my-profile-master.png");
const SPEC = require(path.join(ROOT, "src/app/dashboard/barber/account/profile-hub-spec.json"));
const W = SPEC.stage.width, H = SPEC.stage.height, SAFE = SPEC.safe;
// Native; realistic browser windows (screen minus Chrome UI); full-screen 16:9; 4:3; ultrawide.
const SIZES = [[W, H], [1366, 657], [1536, 730], [1920, 953], [2560, 1305], [1366, 768], [1920, 1080], [1024, 768], [3440, 1329]];
const NAMES = { details: "Details", career: "Career", eportfolio: "ePortfolio", analytics: "Analytics", settings: "Settings" };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const checks = [];
  const info = [];
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
        hits: [...document.querySelectorAll(".ph-stage a.ph-hit")].map((a) => { const r = a.getBoundingClientRect(); return { name: a.getAttribute("aria-label"), box: [r.x, r.y, r.width, r.height] }; }),
        visibleText: [...document.querySelectorAll(".ph-stage a.ph-hit")].map((a) => a.textContent.trim()).join(""),
        overflowX: document.documentElement.scrollWidth - innerWidth,
      };
    });
    const tag = `${vw}x${vh}`;
    const s = dom.img[2] / W;
    const toView = (x, y) => [dom.img[0] + x * s, dom.img[1] + y * s];
    gate(`${tag}: no console/network errors`, errors.length === 0, errors);
    gate(`${tag}: no horizontal overflow`, dom.overflowX === 0, dom.overflowX);
    gate(`${tag}: master loaded at native size`, dom.natural[0] === W && dom.natural[1] === H, dom.natural);
    gate(`${tag}: master not distorted (aspect within 0.1%)`, Math.abs(dom.img[2] / dom.img[3] - W / H) < 0.001 * (W / H), dom.img);
    const [sl, st] = toView(SAFE.left, SAFE.top), [sr, sb] = toView(SAFE.right + 1, SAFE.bottom + 1);
    gate(`${tag}: safe area fully visible`, sl >= -0.5 && st >= -0.5 && sr <= vw + 0.5 && sb <= vh + 0.5, { safeInView: [sl, st, sr, sb].map((v) => +v.toFixed(1)) });
    const capBinds = Math.max(vw / W, vh / H) > Math.min(vw / (SAFE.right - SAFE.left + 1), vh / (SAFE.bottom - SAFE.top + 1));
    const bandX = Math.max(0, dom.img[0]) + Math.max(0, vw - (dom.img[0] + dom.img[2]));
    const bandY = Math.max(0, dom.img[1]) + Math.max(0, vh - (dom.img[1] + dom.img[3]));
    gate(`${tag}: master fills the window (unless the safe-area cap binds)`, capBinds || (bandX <= 1 && bandY <= 1), { capBinds, bandX: +bandX.toFixed(1), bandY: +bandY.toFixed(1) });
    const cropL = Math.max(0, -dom.img[0] / s), cropR = Math.max(0, (dom.img[0] + dom.img[2] - vw) / s), cropT = Math.max(0, -dom.img[1] / s), cropB = Math.max(0, (dom.img[1] + dom.img[3] - vh) / s);
    info.push({ viewport: tag, scale: +s.toFixed(4), rendered: dom.img.map((v) => +v.toFixed(1)), cropMasterPx: { left: +cropL.toFixed(1), right: +cropR.toFixed(1), top: +cropT.toFixed(1), bottom: +cropB.toFixed(1) }, bandsPx: { x: +bandX.toFixed(1), y: +bandY.toFixed(1) }, capBinds });
    gate(`${tag}: five hit areas, no visible replacement text`, dom.hits.length === 5 && dom.visibleText === "", { count: dom.hits.length });
    for (const [k, r] of Object.entries(SPEC.hitAreas)) {
      const h = dom.hits.find((x) => x.name === NAMES[k]);
      const [wx, wy] = toView(r.left, r.top);
      const want = [wx, wy, (r.right - r.left + 1) * s, (r.bottom - r.top + 1) * s];
      const err = h ? Math.max(...want.map((v, i) => Math.abs(v - h.box[i]))) : Infinity;
      gate(`${tag}: ${k} hit area aligned with the master's strip (≤1px)`, err <= 1, { err: +err.toFixed(2) });
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
      gate(`native ${W}x${H}: render = master (mean |Δ| ≤ 0.5, ≤ 0.1% of pixels differ by > 2)`, e / n <= 0.5 && changed <= 0.001 * n, { meanAbs: +(e / n).toFixed(4), max, pixelsOver2: changed, pixels: n });
    }
    await page.close();
  }
  await browser.close();

  const failed = checks.filter((c) => !c.pass);
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({ url: PAGE_URL, passed: checks.length - failed.length, failed: failed.length, checks, sizes: info }, null, 2));
  for (const c of checks) if (!c.pass || /native|safe area|fills/.test(c.name)) console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.name}  ${JSON.stringify(c.detail)}`);
  for (const i of info) console.log(JSON.stringify(i));
  console.log(`\n${checks.length - failed.length}/${checks.length} gates passed.`);
  process.exit(failed.length ? 1 : 0);
})();
