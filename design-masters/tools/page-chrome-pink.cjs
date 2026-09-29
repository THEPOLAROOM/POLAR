// Clients chrome: the CALENDAR-UI master's own frame, drips and header bar,
// translated from hot pink to the Clients blue/cyan palette, on POLAR navy.
const sharp = require("C:/Users/New Guest/Documents/GitHub/POLAR/node_modules/sharp");
const WT = "C:/Users/New Guest/Documents/GitHub/POLAR-barber-redesign";
const S = process.argv[2];
const OUT = WT + "/public/dashboard/polar-ui/";
const B = [11, 4, 14], NAVY = [6, 11, 30];

function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hsl2rgb(h, s, l) {
  h /= 360;
  if (s === 0) return [l, l, l].map((v) => Math.round(v * 255));
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255));
}
// Pink (≈300–340°) → electric blue (≈214°); the brightest neon cores lean cyan (≈192°).
function toBlue(r, g, b) { return [r, g, b];
  const [h, s, l] = rgb2hsl(r, g, b);
  if (s < 0.18) return [r, g, b];
  const pinkish = h >= 240 || h <= 20;
  if (!pinkish) return [r, g, b];
  const hue = 214 - 22 * Math.max(0, Math.min(1, (l - 0.45) / 0.35));
  return hsl2rgb(hue, Math.min(1, s * 1.02), Math.min(0.92, l * 1.04));
}

(async () => {
  const { data, info } = await sharp(WT + "/design-masters/barber-calendar-master.png").raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const ua = (i) => { let a = 0; for (let c = 0; c < 3; c++) a = Math.max(a, (data[i + c] - B[c]) / (255 - B[c])); return Math.max(0, Math.min(1, a)); };
  // Navy re-tint (same as Calendar), then blue translation.
  const base = Buffer.from(data);
  for (let i = 0; i < base.length; i += 4) {
    if (data[i + 3] >= 199) { const a = ua(i); for (let c = 0; c < 3; c++) base[i + c] = Math.max(0, Math.min(255, Math.round(data[i + c] + (NAVY[c] - B[c]) * (1 - a)))); }
    const [r, g, b] = toBlue(base[i], base[i + 1], base[i + 2]);
    base[i] = r; base[i + 1] = g; base[i + 2] = b;
  }
  const inBox = (x, y, [x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  const HOLES = [[1358, 102, 1556, 199], [118, 212, 1572, 300], [137, 300, 1550, 836]];
  const chrome = Buffer.from(base);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (HOLES.some((h) => inBox(x, y, h))) { chrome[i + 3] = 0; continue; }
    // Header bar: remove the Calendar's icon, lettering and crown (x 128–772) using the bar's own plain column.
    if (x >= 128 && x <= 772 && y >= 102 && y <= 211) { const o = (y * W + 1000) * 4; for (let c = 0; c < 4; c++) chrome[i + c] = base[o + c]; }
  }
  // The lettering pokes into the top frame edge (x 350–752): continue the plain rail (col 770), taper the join, drop non-paint remnants.
  const src = Buffer.from(chrome);
  for (let x = 350; x <= 752; x++) {
    const t = Math.min(1, (x - 350) / 120);
    for (let y = 40; y <= 85; y++) { const d = (y * W + x) * 4; const paint = src[d] - src[d + 1] > 60; chrome[d + 3] = x >= 430 || !paint ? 0 : Math.round(src[d + 3] * (430 - x) / 80); }
    for (let y = 86; y <= 101; y++) { const d = (y * W + x) * 4, o = (y * W + 770) * 4; const letter = x > 360 && Math.min(src[d], src[d + 1], src[d + 2]) > 110 && src[d] - src[d + 1] < 60; const k = letter ? 1 : t; for (let c = 0; c < 4; c++) chrome[d + c] = Math.round(src[d + c] * (1 - k) + src[o + c] * k); }
  }
  await sharp(chrome, { raw: { width: W, height: H, channels: 4 } }).webp({ lossless: true }).toFile(OUT + "services-chrome.webp");
  // Keyed blue pieces: crown, bottom-right corner paint.
  const keyed = async (name, [x0, y0, x1, y1]) => {
    const w = x1 - x0, h = y1 - y0, buf = Buffer.alloc(w * h * 4);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const i = (y * W + x) * 4, o = ((y - y0) * w + (x - x0)) * 4, a = ua(i);
      if (a < 0.1) continue;
      const c0 = [0, 1, 2].map((c) => Math.max(0, Math.min(255, Math.round(B[c] + (data[i + c] - B[c]) / a))));
      const [r, g, b] = toBlue(...c0);
      buf[o] = r; buf[o + 1] = g; buf[o + 2] = b; buf[o + 3] = Math.round(a * 255);
    }
    await sharp(buf, { raw: { width: w, height: h, channels: 4 } }).webp({ lossless: true }).toFile(OUT + name);
    console.log(name, w, h);
  };
  await keyed("services-crown.webp", [647, 114, 724, 182]);
  await keyed("services-corner-splat.webp", [1476, 784, 1550, 836]);
  const prev = await sharp({ create: { width: W, height: H, channels: 3, background: "#060b1e" } }).composite([{ input: OUT + "services-chrome.webp" }]).png().toBuffer();
  await sharp(prev).resize(1100).png().toFile(S + "/services-chrome-check.png");
  console.log("services-chrome.webp ok");
})();
