const sharp = require("C:/Users/New Guest/Documents/GitHub/POLAR/node_modules/sharp");
const [M, OUT] = process.argv.slice(2);
const B = [11, 4, 14];          // master's purple-black interior
const NAVY = [6, 11, 30];       // POLAR deep navy (#060b1e)
(async () => {
  const { data, info } = await sharp(M).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const inBox = (x, y, [x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  const HOLES = [[1358, 102, 1556, 199], [118, 212, 1572, 300], [137, 300, 1550, 836]];
  const KEEP = []; // corner paint ships as its own transparent piece
  const unblendA = (i) => { let a = 0; for (let c = 0; c < 3; c++) a = Math.max(a, (data[i + c] - B[c]) / (255 - B[c])); return Math.max(0, Math.min(1, a)); };
  // 1) Chrome: master re-tinted to navy, holes for live UI.
  const chrome = Buffer.from(data);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (HOLES.some((h) => inBox(x, y, h)) && !KEEP.some((k) => inBox(x, y, k))) { chrome[i + 3] = 0; continue; }
    const alpha = data[i + 3] / 255;
    if (alpha < 0.78) continue; // paint over transparency (drips) — keep as supplied
    const a = unblendA(i);
    for (let c = 0; c < 3; c++) chrome[i + c] = Math.max(0, Math.min(255, Math.round(data[i + c] + (NAVY[c] - B[c]) * (1 - a))));
  }
  await sharp(chrome, { raw: { width: W, height: H, channels: 4 } }).webp({ lossless: true }).toFile(OUT + "/calendar-chrome.webp");
  // 2) Period splash (paint only, text removed), keyed to alpha.
  const [sx0, sy0, sx1, sy1] = [425, 274, 792, 306];
  const sw = sx1 - sx0, sh = sy1 - sy0, splat = Buffer.alloc(sw * sh * 4);
  for (let y = sy0; y < sy1; y++) for (let x = sx0; x < sx1; x++) {
    const i = (y * W + x) * 4, o = ((y - sy0) * sw + (x - sx0)) * 4;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (Math.min(r, g, b) > 120) continue; // white/grey lettering
    const a = unblendA(i);
    if (a < 0.05) continue;
    for (let c = 0; c < 3; c++) splat[o + c] = Math.max(0, Math.min(255, Math.round(B[c] + (data[i + c] - B[c]) / a)));
    splat[o + 3] = Math.round(a * (data[i + 3]));
  }
  await sharp(splat, { raw: { width: sw, height: sh, channels: 4 } }).webp({ lossless: true }).toFile(OUT + "/calendar-period-splat.webp");
  const fs = require("fs");
  for (const f of ["calendar-chrome.webp", "calendar-period-splat.webp"]) console.log(f, Math.round(fs.statSync(OUT + "/" + f).size / 1024) + "KB");
  // Preview over the room-dark backdrop
  const prev = await sharp({ create: { width: W, height: H, channels: 3, background: "#101018" } }).composite([{ input: OUT + "/calendar-chrome.webp" }, { input: OUT + "/calendar-period-splat.webp", left: sx0, top: sy0 }]).png().toBuffer();
  await sharp(prev).resize(1100).png().toFile(process.env.S + "/chrome-check.png");
})();
// 3) Bottom-right corner paint (transparent, grid lines removed).
(async () => {
  const M = process.argv[2], OUT = process.argv[3];
  const { data, info } = await sharp(M).raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const [x0, y0, x1, y1] = [1476, 784, 1550, 836], w = x1 - x0, h = y1 - y0, buf = Buffer.alloc(w * h * 4);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    if (Math.abs(x - 1553) <= 2 || Math.abs(y - 839) <= 2 || Math.abs(x - 1340) <= 1) continue; // grid border lines stay live
    const i = (y * W + x) * 4, o = ((y - y0) * w + (x - x0)) * 4;
    let a = 0; for (let c = 0; c < 3; c++) a = Math.max(a, (data[i + c] - B[c]) / (255 - B[c])); a = Math.max(0, Math.min(1, a));
    if (a < 0.08 || data[i + 3] < 200) continue;
    for (let c = 0; c < 3; c++) buf[o + c] = Math.max(0, Math.min(255, Math.round(B[c] + (data[i + c] - B[c]) / a)));
    buf[o + 3] = Math.round(a * 255);
  }
  await sharp(buf, { raw: { width: w, height: h, channels: 4 } }).webp({ lossless: true }).toFile(OUT + "/calendar-corner-splat.webp");
  console.log("corner splat ok");
})();
