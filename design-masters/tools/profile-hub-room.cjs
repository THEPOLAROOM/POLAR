// My Profile hub background: the production POLAR profile scene
// (profile-room-v1.webp) re-framed onto the 1672×941 stage with POLAR
// centred, at native resolution (no upscaling). "After closing time":
// the room drops to ~30% light; POLAR keeps his light with a soft falloff;
// a restrained electric-blue glow sits behind him; edges fade to dark.
const sharp = require("C:/Users/New Guest/Documents/GitHub/POLAR/node_modules/sharp");
const WT = "C:/Users/New Guest/Documents/GitHub/POLAR-barber-redesign";
const S = process.argv[2];
const W = 1672, H = 941, OX = 271, OY = 35;
const BG = [3, 6, 15];
const PC = [836, 35 + 446]; // POLAR centre on the stage (source 565, 446)
(async () => {
  const { data, info } = await sharp(WT + "/public/dashboard/profile-room-v1.webp").raw().toBuffer({ resolveWithObject: true });
  const SW = info.width, SH = info.height, ch = info.channels;
  const out = Buffer.alloc(W * H * 3);
  const smooth = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 3; const sx = x - OX, sy = y - OY;
    let c = BG.slice();
    if (sx >= 0 && sy >= 0 && sx < SW && sy < SH) {
      const i = (sy * SW + sx) * ch; const src = [data[i], data[i + 1], data[i + 2]];
      // light falloff: POLAR ellipse bright, room dark
      const ex = (x - PC[0]) / 150, ey = (y - PC[1]) / 330; const r = Math.sqrt(ex * ex + ey * ey);
      const lit = 1 - smooth(0.86, 1.12, r); // 1 inside POLAR, 0 outside
      const k = 0.22 + 0.73 * lit; // room 22%, POLAR 95%
      // pull the room's colour slightly toward navy (pink/red neon restrained)
      const sat = 0.6 + 0.4 * lit;
      const lum = 0.3 * src[0] + 0.59 * src[1] + 0.11 * src[2];
      c = src.map((v, j) => (lum + (v - lum) * sat) * k);
      // feather the scene's own edges into the background
      const edge = Math.min(smooth(0, 260, sx), smooth(0, 110, sy), smooth(0, 170, SH - sy));
      c = c.map((v, j) => BG[j] + (v - BG[j]) * edge);
    }
    // restrained electric-blue glow behind POLAR
    const gx = (x - PC[0]) / 330, gy = (y - (PC[1] - 20)) / 430; const g = Math.max(0, 1 - Math.sqrt(gx * gx + gy * gy)); const gl = 0.16 * g * g;
    c = [c[0] + 20 * gl * 4, c[1] + 90 * gl * 4, c[2] + 255 * gl * 4].map((v, j) => Math.max(0, Math.min(255, j === 0 ? v * (1 - gl) + 0 : v)));
    // overall vignette
    const vx = (x - W / 2) / (W * 0.62), vy = (y - H * 0.5) / (H * 0.72); const vig = 1 - 0.55 * smooth(0.55, 1.05, Math.sqrt(vx * vx + vy * vy));
    out[o] = Math.round(BG[0] + (c[0] - BG[0]) * vig); out[o + 1] = Math.round(BG[1] + (c[1] - BG[1]) * vig); out[o + 2] = Math.round(BG[2] + (c[2] - BG[2]) * vig);
  }
  await sharp(out, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 88, effort: 6 }).toFile(WT + "/public/dashboard/polar-ui/profile-hub-room.webp");
  await sharp(out, { raw: { width: W, height: H, channels: 3 } }).resize(1100).png().toFile(S + "/profile-bg-check.png");
  console.log("ok", require("fs").statSync(WT + "/public/dashboard/polar-ui/profile-hub-room.webp").size);
})();
