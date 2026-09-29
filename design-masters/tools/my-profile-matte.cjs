// MY PROFILE: POLAR silhouette matte for profile-room-v1.webp — owner-approved 2026-09-29.
//
//   node design-masters/tools/my-profile-matte.cjs
//
// Writes public/dashboard/polar-ui/profile-polar-matte.webp: white with alpha = POLAR,
// used as a CSS mask over the untouched room file (profile-view.tsx, layer 4).
// The polygon is in profile-room-v1.webp source pixels, traced on 2× gridded zooms:
// tight where the room behind him is bright (the chair, the neon beside his left ear,
// the pink streak between his legs), slightly generous where it is dark.
// Only a mask is derived; POLAR's pixels are never modified.
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const sharp = require(process.env.SHARP || path.join(ROOT, "node_modules/sharp"));
const BOX = { x: 420, y: 155, w: 280, h: 580 }; // = profile-hub-spec.json polar.srcBox
const POLY = [[535,166],[560,168],[578,176],[595,180],[610,184],[625,190],[635,200],[637,212],[631,223],[619,233],[611,243],[604,258],[602,272],[608,283],[623,292],[639,305],[651,322],[659,342],[664,362],[663,378],[658,392],[652,404],[651,418],[653,432],[654,448],[651,462],[649,480],[649,520],[649,560],[649,600],[650,630],[654,658],[664,678],[678,694],[686,706],[684,718],[660,722],[620,722],[575,722],[566,712],[568,698],[570,675],[573,650],[570,620],[564,592],[557,568],[549,582],[541,606],[532,630],[522,655],[514,676],[510,698],[506,718],[480,725],[440,726],[430,714],[434,695],[441,668],[443,645],[446,628],[451,606],[459,585],[466,562],[476,540],[480,515],[483,490],[485,466],[486,456],[489,446],[484,430],[476,414],[466,398],[457,380],[450,356],[446,330],[449,306],[455,291],[465,277],[477,264],[488,250],[490,238],[486,226],[483,212],[482,198],[487,185],[500,174],[518,167]];
(async () => {
  const pts = POLY.map(([x, y]) => `${x - BOX.x},${y - BOX.y}`).join(" ");
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${BOX.w}" height="${BOX.h}"><rect width="100%" height="100%" fill="#000"/><polygon points="${pts}" fill="#fff"/></svg>`);
  const m = await sharp(svg).blur(0.8).greyscale().raw().toBuffer();
  const out = Buffer.alloc(BOX.w * BOX.h * 4);
  for (let i = 0; i < BOX.w * BOX.h; i++) { out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = 255; out[i * 4 + 3] = m[i]; }
  await sharp(out, { raw: { width: BOX.w, height: BOX.h, channels: 4 } }).webp({ lossless: true }).toFile(path.join(ROOT, "public/dashboard/polar-ui/profile-polar-matte.webp"));
  console.log("ok");
})();
