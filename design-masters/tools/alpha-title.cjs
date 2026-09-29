// Page-title artwork composed from the official POLAR display alphabet
// (design-masters/polar-display-alphabet.png): each letter is the sheet's own
// painted letterform; edges rebuilt to the CALENDAR/CLIENTS construction
// (solid near-black outline, offset coloured edge, paint flecks), letters
// layered left-to-right with overlap like the example titles.
// usage: node alpha-title.cjs WORD pink|blue out.webp
const sharp = require("C:/Users/New Guest/Documents/GitHub/POLAR/node_modules/sharp");
const WT = "C:/Users/New Guest/Documents/GitHub/POLAR-barber-redesign";
const S = "C:/Users/NEWGUE~1/AppData/Local/Temp/claude/c--Users-New-Guest-Documents-GitHub-POLAR/c5f1b12e-8286-4648-915c-dadfc66133c9/scratchpad/wm/";
const [WORD, MODE, OUTFILE] = process.argv.slice(2);
const ROWS = { r1: [140, 330], r2: [336, 530], r3: [536, 718] };
const CELLS = {
  A: ["r1", 42, 176], B: ["r1", 251, 375], C: ["r1", 445, 563], D: ["r1", 633, 759], E: ["r1", 821, 951], F: ["r1", 1030, 1144], G: ["r1", 1208, 1346], H: ["r1", 1409, 1533], I: ["r1", 1634, 1696],
  J: ["r2", 48, 179], K: ["r2", 250, 384], L: ["r2", 441, 555], M: ["r2", 619, 764], N: ["r2", 822, 956], O: ["r2", 1023, 1141], P: ["r2", 1215, 1346], Q: ["r2", 1409, 1545], R: ["r2", 1605, 1733],
  S: ["r3", 58, 201], T: ["r3", 286, 410], U: ["r3", 486, 608], V: ["r3", 702, 814], W: ["r3", 893, 1033], X: ["r3", 1092, 1244], Y: ["r3", 1330, 1456], Z: ["r3", 1528, 1712],
};
const EDGE = MODE === "blue" || MODE === "bluepink" ? [40, 150, 255] : [253, 18, 200];
const FLECK_KEEP_PINK = MODE === "bluepink";
const BODY_MIN = Number(process.env.BODY_MIN || 92); // subtle POLAR-pink accent flecks
function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; if (mx === mn) return [0, 0, l]; const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h * 60, s, l]; }
function hsl2rgb(h, s, l) { h /= 360; if (s === 0) return [l, l, l].map((v) => Math.round(v * 255)); const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }; return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255)); }
const recolor = (r, g, b) => { if (MODE !== "blue") return [r, g, b]; const [h, s, l] = rgb2hsl(r, g, b); if (s < 0.18 || !(h >= 240 || h <= 20)) return [r, g, b]; return hsl2rgb(214 - 22 * Math.max(0, Math.min(1, (l - 0.45) / 0.35)), s, Math.min(0.9, l)); };

const recolorBlue = (r, g, b) => { const [h, s2, l] = rgb2hsl(r, g, b); if (s2 < 0.18 || !(h >= 240 || h <= 20)) return [r, g, b]; return hsl2rgb(214 - 22 * Math.max(0, Math.min(1, (l - 0.45) / 0.35)), s2, Math.min(0.9, l)); };
(async () => {
  const { data, info } = await sharp(WT + "/design-masters/polar-display-alphabet.png").raw().toBuffer({ resolveWithObject: true });
  const MW = info.width, ch = info.channels;
  const px = (x, y) => { const i = (y * MW + x) * ch; return [data[i], data[i + 1], data[i + 2]]; };
  const isBody = (r, g, b) => Math.min(r, g, b) > (BODY_MIN) && Math.max(r, g, b) - Math.min(r, g, b) < 60;
  const isPaint = (r, g, b) => r > 110 && r - g > 70 && b > 60;

  function extract(letter) {
    const [row, a, b] = CELLS[letter]; const [y0, y1] = ROWS[row];
    const x0 = a - 30, x1 = b + 30, w = x1 - x0, h = y1 - y0;
    const body = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const [r, g, bb] = px(x + x0, y + y0); if (isBody(r, g, bb)) body[y * w + x] = 1; }
    // keep the big components (the letter), drop specks and neighbours' edges
    const lab = new Int32Array(w * h), sizes = [0]; let id = 0;
    for (let i = 0; i < w * h; i++) if (body[i] && !lab[i]) { id++; let n = 0; const st = [i]; lab[i] = id; while (st.length) { const j = st.pop(); n++; const x = j % w, y = (j / w) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const k = yy * w + xx; if (body[k] && !lab[k]) { lab[k] = id; st.push(k); } } } sizes.push(n); }
    const big = Math.max(...sizes);
    const keep = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) if (body[i] && sizes[lab[i]] >= Math.max(120, big * 0.04)) keep[i] = 1;
    // core rows (for baseline alignment / scale)
    const rowN = new Array(h).fill(0); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) rowN[y] += keep[y * w + x];
    const mx = Math.max(...rowN); let top = -1, bot = -1; rowN.forEach((n, y) => { if (n >= mx * 0.3) { if (top < 0) top = y; bot = y; } });
    let minX = w, maxX = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (keep[y * w + x]) { if (x < minX) minX = x; if (x > maxX) maxX = x; }
    return { letter, x0, y0, w, h, keep, top, bot, minX, maxX };
  }

  const glyphs = [...WORD].filter((c) => c !== " ").map(extract);
  const spaceAfter = new Set(); { let k = -1; for (const c of WORD) { if (c === " ") spaceAfter.add(k); else k++; } }
  const coreH = glyphs.map((g) => g.bot - g.top);
  const target = coreH.sort((a, b) => a - b)[Math.floor(coreH.length / 2)];
  // Layout: common baseline, overlap ~16% of core height (as in the example titles).
  const OVER = Math.round(target * Number(process.env.OVERLAP || 0.27)), PAD = 14;
  let pen = PAD; const placed = [];
  for (const [gi, g] of glyphs.entries()) {
    const dx = pen - g.minX; const dy = PAD + 40 - g.top; // align core tops (all letters same cap height)
    placed.push({ g, dx, dy });
    pen += g.maxX - g.minX + 1 - OVER + (spaceAfter.has(gi) ? Math.round(target * 0.42) : 0);
  }
  let W = 0, H = 0; for (const { g, dx, dy } of placed) { W = Math.max(W, g.w + dx + PAD); H = Math.max(H, g.h + dy + PAD); }
  const out = Buffer.alloc(W * H * 4);
  const put = (o, r, g, b, a) => { const A = a / 255, B = out[o + 3] / 255, Ao = A + B * (1 - A); if (Ao <= 0) return; out[o] = Math.round((r * A + out[o] * B * (1 - A)) / Ao); out[o + 1] = Math.round((g * A + out[o + 1] * B * (1 - A)) / Ao); out[o + 2] = Math.round((b * A + out[o + 2] * B * (1 - A)) / Ao); out[o + 3] = Math.round(Ao * 255); };
  const R = 8;
  for (const { g, dx, dy } of placed) {
    const { w, h, keep, x0, y0 } = g;
    const kp = (x, y) => x >= 0 && y >= 0 && x < w && y < h && keep[y * w + x];
    const dist = new Float32Array(w * h).fill(99);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (keep[y * w + x]) for (let yy = Math.max(0, y - R); yy <= Math.min(h - 1, y + R); yy++) for (let xx = Math.max(0, x - R); xx <= Math.min(w - 1, x + R); xx++) { const d = Math.hypot(xx - x, yy - y); if (d < dist[yy * w + xx]) dist[yy * w + xx] = d; }
    // 1) the letter's own paint flecks near it
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (dist[y * w + x] > 26 && dist[y * w + x] < 99) continue; if (dist[y * w + x] >= 99) continue;
      const [r, gg, b] = px(x + x0, y + y0); if (!isPaint(r, gg, b)) continue;
      const [nr, ng, nb] = recolor(r, gg, b); const a = Math.min(255, Math.max(0, (r - gg - 60) * 2.2));
      const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      if (FLECK_KEEP_PINK) { const pinkish = ((x * 7 + y * 13) % 5) === 0; if (pinkish) put((Y * W + X) * 4, r, gg, b, a * 0.55); else { const [br, bg2, bb] = recolorBlue(r, gg, b); put((Y * W + X) * 4, br, bg2, bb, a * 0.9); } } else put((Y * W + X) * 4, nr, ng, nb, a * 0.9);
    }
    // 2) offset coloured edge (lower-left) + 3) solid near-black outline
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (kp(x, y)) continue; const d = dist[y * w + x]; if (d > 7.2) continue;
      const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const o = (Y * W + X) * 4;
      if ((kp(x + 2, y - 2) || kp(x + 3, y - 3)) && d <= 3.2) { put(o, EDGE[0], EDGE[1], EDGE[2], 255); continue; }
      if (d <= 6.0) put(o, 4, 6, 13, 255); else put(o, 4, 6, 13, Math.round(255 * (7.2 - d) / 1.2));
    }
    // 4) body on top, as painted
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (keep[y * w + x]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const [r, gg, b] = px(x + x0, y + y0); const o = (Y * W + X) * 4; out[o] = r; out[o + 1] = gg; out[o + 2] = b; out[o + 3] = 255; }
  }
  const png = await sharp(out, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer();
  await sharp(png).webp({ lossless: true }).toFile(OUTFILE);
  const m = await sharp(png).metadata();
  // core height of the final art (rows with >= 30% of the widest row's body)
  const raw = await sharp(png).raw().toBuffer(); const rows = new Array(m.height).fill(0);
  for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) { const i = (y * m.width + x) * 4; if (raw[i + 3] > 200 && isBody(raw[i], raw[i + 1], raw[i + 2])) rows[y]++; }
  const mr = Math.max(...rows); let t = -1, bt = -1; rows.forEach((n, y) => { if (n >= mr * 0.3) { if (t < 0) t = y; bt = y; } });
  const clients = await sharp(WT + "/public/dashboard/polar-ui/clients-title.webp").png().toBuffer(); const cm = await sharp(clients).metadata();
  const sheet = await sharp({ create: { width: Math.max(m.width, cm.width) + 40, height: m.height + cm.height + 60, channels: 3, background: "#060b1e" } }).composite([{ input: clients, left: 20, top: 20 }, { input: png, left: 20, top: cm.height + 40 }]).png().toBuffer();
  await sharp(sheet).resize((Math.max(m.width, cm.width) + 40) * 2).png().toFile(S + "alpha-review.png");
  console.log(JSON.stringify({ size: [m.width, m.height], core: [t, bt, bt - t], letterCore: target }));
})();
