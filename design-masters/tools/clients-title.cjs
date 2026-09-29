// CLIENTS title artwork cut from the official POLAR display alphabet sheet:
// white brush body + dark edge kept as painted; the pink neon rim is
// translated to the Clients blue (per the POLAR UI colour rule).
const sharp = require("C:/Users/New Guest/Documents/GitHub/POLAR/node_modules/sharp");
const WT = "C:/Users/New Guest/Documents/GitHub/POLAR-barber-redesign";
const S = "C:/Users/NEWGUE~1/AppData/Local/Temp/claude/c--Users-New-Guest-Documents-GitHub-POLAR/c5f1b12e-8286-4648-915c-dadfc66133c9/scratchpad/wm/";
const [X0, Y0, X1, Y1] = [1012, 720, 1448, 882];
function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; if (mx === mn) return [0, 0, l]; const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h * 60, s, l]; }
function hsl2rgb(h, s, l) { h /= 360; if (s === 0) return [l, l, l].map((v) => Math.round(v * 255)); const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }; return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map((v) => Math.round(v * 255)); }
const toBlue = (r, g, b) => { const [h, s, l] = rgb2hsl(r, g, b); if (s < 0.18 || !(h >= 240 || h <= 20)) return [r, g, b]; return hsl2rgb(214 - 22 * Math.max(0, Math.min(1, (l - 0.45) / 0.35)), s, Math.min(0.9, l)); };
(async () => {
  const { data, info } = await sharp(WT + "/design-masters/polar-display-alphabet.png").raw().toBuffer({ resolveWithObject: true });
  const MW = info.width, ch = info.channels, W = X1 - X0, H = Y1 - Y0;
  const px = (x, y) => { const i = (y * MW + x) * ch; return [data[i], data[i + 1], data[i + 2]]; };
  const body = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [r, g, b] = px(x + X0, y + Y0); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mn > 92 && mx - mn < 60) body[y * W + x] = 1; }
  // Drop tiny isolated specks (keep only pixels with enough body neighbours).
  const keep = new Uint8Array(W * H);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (body[y * W + x]) { let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) n += body[(y + dy) * W + x + dx]; if (n >= 3) keep[y * W + x] = 1; }
  // Drop detached fragments (e.g. the sheet's neon-rule highlight): keep components >= 400 px.
  { const lab = new Int32Array(W * H); let id = 0; const sizes = [0];
    for (let i = 0; i < W * H; i++) if (keep[i] && !lab[i]) { id++; let n = 0; const st = [i]; lab[i] = id;
      while (st.length) { const j = st.pop(); n++; const x = j % W, y = (j / W) | 0; for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const k = yy * W + xx; if (keep[k] && !lab[k]) { lab[k] = id; st.push(k); } } }
      sizes.push(n); }
    for (let i = 0; i < W * H; i++) if (keep[i] && sizes[lab[i]] < 400) keep[i] = 0;
    console.log("components", sizes.length - 1, "kept", sizes.filter((n) => n >= 400).length); }
  // Calendar-matched edge: ~2px coloured inner line (Clients blue) + ~6.5px solid
  // near-black outline, a touch heavier to the lower-left (as on CALENDAR).
  const PAD = 10, W2 = W + PAD * 2, H2 = H + PAD * 2, R = 9;
  const kp = (x, y) => x >= 0 && y >= 0 && x < W && y < H && keep[y * W + x];
  const dist = new Float32Array(W2 * H2).fill(99), sdist = new Float32Array(W2 * H2).fill(99);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (keep[y * W + x]) for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const d = Math.hypot(dx, dy); if (d > R) continue;
    const X = x + PAD + dx, Y = y + PAD + dy; if (X < 0 || Y < 0 || X >= W2 || Y >= H2) continue;
    const k = Y * W2 + X; if (d < dist[k]) dist[k] = d;
    const X2 = X - 1, Y2 = Y + 1.5 | 0; if (X2 >= 0 && Y2 < H2) { const k2 = Y2 * W2 + X2; if (d < sdist[k2]) sdist[k2] = d; }
  }
  // Rows carrying the sheet's horizontal neon rules (not splatter): skip their pink.
  const ruleRow = new Uint8Array(H);
  for (let y = 0; y < H; y++) { let n = 0; for (let x = 0; x < W; x++) { const [r, g, b] = px(x + X0, y + Y0); if (r > 150 && g < 90 && b > 90) n++; } if (n > W * 0.3) ruleRow[y] = 1; }
  for (let y = 1; y < H - 1; y++) if (ruleRow[y - 1] && ruleRow[y + 1]) ruleRow[y] = 1;
  // Long horizontal pink runs are the sheet's neon rules, not paint.
  const longRun = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) { let st = -1; for (let x = 0; x <= W; x++) { let p = false; if (x < W) { const [r, g, b] = px(x + X0, y + Y0); p = r > 110 && r - g > 70 && b > 60; }
    if (p && st < 0) st = x; if (!p && st >= 0) { if (x - st > 22) for (let k = st; k < x; k++) for (let dy = -2; dy <= 2; dy++) if (y + dy >= 0 && y + dy < H) longRun[(y + dy) * W + k] = 1; st = -1; } } }
  const out = Buffer.alloc(W2 * H2 * 4);
  const put = (o, r, g, b, a) => { const A = a / 255, B = out[o + 3] / 255, Ao = A + B * (1 - A); if (Ao <= 0) return; out[o] = Math.round((r * A + out[o] * B * (1 - A)) / Ao); out[o + 1] = Math.round((g * A + out[o + 1] * B * (1 - A)) / Ao); out[o + 2] = Math.round((b * A + out[o + 2] * B * (1 - A)) / Ao); out[o + 3] = Math.round(Ao * 255); };
  // 1) The artwork's own paint splatter, pink → Clients blue.
  for (let y = 0; y < H; y++) { if (ruleRow[y] || (y > 0 && ruleRow[y - 1]) || (y < H - 1 && ruleRow[y + 1])) continue; for (let x = 0; x < W; x++) {
    const [r, g, b] = px(x + X0, y + Y0); if (!(r > 110 && r - g > 70 && b > 60)) continue;
    if (longRun[y * W + x]) continue;
    const [nr, ng, nb] = toBlue(r, g, b); const a = Math.min(255, Math.max(0, (r - g - 60) * 2.2));
    // Fade out towards the crop edges and away from the lettering (no hard cut lines).
    const edge = Math.min(x, W - 1 - x, y, H - 1 - y); const fe = Math.min(1, edge / 14);
    const near = dist[(y + PAD) * W2 + x + PAD]; const fn = near < 99 ? 1 : 0.8;
    put(((y + PAD) * W2 + x + PAD) * 4, nr, ng, nb, Math.min(255, a * 1.15 * fe * fn));
  } }
  for (let Y = 0; Y < H2; Y++) for (let X = 0; X < W2; X++) {
    const x = X - PAD, y = Y - PAD, o = (Y * W2 + X) * 4;
    if (kp(x, y)) continue;
    const d = Math.min(dist[Y * W2 + X], sdist[Y * W2 + X] + 0.4);
    // 2) Offset coloured edge (lower-left), as on CALENDAR.
    const inShadow = kp(x + 2, y - 2) || kp(x + 3, y - 3);
    if (inShadow && d <= 3.2) { put(o, 40, 150, 255, 255); continue; }
    // 3) Solid near-black outline all round.
    if (d <= 6.0) { put(o, 4, 6, 13, 255); continue; }
    if (d <= 7.2) put(o, 4, 6, 13, Math.round(255 * (7.2 - d) / 1.2));
  }
  // 4) Letter body on top, as painted.
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (keep[y * W + x]) { const [r, g, b] = px(x + X0, y + Y0); const o = ((y + PAD) * W2 + x + PAD) * 4; out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = 255; }
  const Wf = W2, Hf = H2;
  const png = await sharp(out, { raw: { width: Wf, height: Hf, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer();
  await sharp(png).webp({ lossless: true }).toFile(S + "clients-title.webp");
  const m = await sharp(png).metadata();
  // Review: CLIENTS (new) under the live CALENDAR wordmark, on the Clients navy, 2.5x.
  const cal = await sharp(WT + "/public/dashboard/polar-ui/calendar-wordmark.webp").png().toBuffer(); const cm = await sharp(cal).metadata();
  const scaleTo = Math.round(m.width * (cm.height / m.height));
  const cw = Math.max(cm.width, m.width) + 40, chh = cm.height + m.height + 60;
  const sheet = await sharp({ create: { width: cw, height: chh, channels: 3, background: "#060b1e" } }).composite([{ input: cal, left: 20, top: 20 }, { input: png, left: 20, top: cm.height + 40 }]).png().toBuffer();
  await sharp(sheet).resize(cw * 2).png().toFile(S + "clients-title-review.png");
  const blue = await sharp({ create: { width: m.width + 40, height: m.height + 40, channels: 3, background: "#060b1e" } }).composite([{ input: png, left: 20, top: 20 }]).png().toBuffer();
  await sharp(blue).resize((m.width + 40) * 2).png().toFile(S + "clients-title-zoom.png");
  console.log("title", m.width, m.height, "calendar wordmark", cm.width, cm.height, "scaled width at same height", scaleTo);
})();
