// Generates KeyDrop PWA icons as PNGs with no external image deps.
// Sky-blue gradient background + white falling-tile motif + hit line.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
mkdirSync(OUT, { recursive: true });

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function render(size, padding) {
  // RGBA pixel buffer
  const px = Buffer.alloc(size * size * 4);
  const set = (x, y, r, g, b) => {
    const i = (y * size + x) * 4;
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
    px[i + 3] = 255;
  };
  const inset = Math.round(size * padding);
  const area = size - inset * 2;
  for (let y = 0; y < size; y++) {
    const t = y / size;
    const r = lerp(14, 37, t); // 0ea5e9 -> 2563eb
    const g = lerp(165, 99, t);
    const b = lerp(233, 235, t);
    for (let x = 0; x < size; x++) set(x, y, r, g, b);
  }
  // three white falling tiles
  const tileW = Math.round(area * 0.16);
  const gap = Math.round(area * 0.1);
  const startX = inset + Math.round(area * 0.18);
  const tops = [0.2, 0.32, 0.12];
  for (let k = 0; k < 3; k++) {
    const x0 = startX + k * (tileW + gap);
    const y0 = inset + Math.round(area * tops[k]);
    const y1 = inset + Math.round(area * 0.62);
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x0 + tileW; x++) set(x, y, 245, 250, 255);
  }
  // hit line glow
  const ly = inset + Math.round(area * 0.66);
  for (let y = ly; y < ly + Math.max(3, Math.round(size * 0.012)); y++)
    for (let x = inset; x < size - inset; x++) set(x, y, 186, 230, 253);

  // PNG encode (color type 6, 8-bit)
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

writeFileSync(join(OUT, "icon-192.png"), render(192, 0.06));
writeFileSync(join(OUT, "icon-512.png"), render(512, 0.06));
// maskable: extra padding so the motif stays inside the safe zone
writeFileSync(join(OUT, "icon-maskable-512.png"), render(512, 0.18));
console.log("icons written to", OUT);
