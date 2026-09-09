/**
 * Generates the PWA icon set. There is no SVG rasteriser on this machine, so
 * the mark is drawn straight into a pixel buffer and PNG-encoded by hand.
 *
 * The mark is a flashcard pair on the site accent: a tinted card behind, a
 * white one in front carrying an accent "heading" bar and three slate body
 * bars. Everything is axis-aligned, which is what makes it drawable without a
 * graphics library — edges are smoothed by rendering at 4x and box-averaging
 * back down rather than by computing coverage analytically.
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const SS = 4; // supersample factor
const MASTER = 1024; // design grid the coordinates below are written against

const ACCENT = [0x1f, 0x3f, 0xa8];
const CARD_BACK = [0x6b, 0x82, 0xdd];
const WHITE = [0xff, 0xff, 0xff];
const SLATE = [0xcc, 0xd5, 0xe4];

/** Rounded-rect hit test: dx/dy measure how far into a corner arc we are. */
function inRoundRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const dx = Math.max(x0 + r - x, 0, x - (x1 - r));
  const dy = Math.max(y0 + r - y, 0, y - (y1 - r));
  return dx * dx + dy * dy <= r * r;
}

/**
 * The shapes, in master-grid coordinates, painted back to front.
 * `scale` shrinks the composition about the centre for the maskable variant,
 * whose outer ~20% can be cropped away by the launcher.
 */
function shapes(scale) {
  const s = (v) => (v - 512) * scale + 512;
  const r = (v) => v * scale;
  const rect = (x0, y0, x1, y1, rad, color) => ({
    x0: s(x0), y0: s(y0), x1: s(x1), y1: s(y1), r: r(rad), color,
  });
  return [
    rect(240, 220, 730, 690, 44, CARD_BACK),
    rect(294, 274, 784, 744, 44, WHITE),
    rect(350, 340, 620, 372, 16, ACCENT),
    rect(350, 432, 728, 460, 14, SLATE),
    rect(350, 512, 728, 540, 14, SLATE),
    rect(350, 592, 596, 620, 14, SLATE),
  ];
}

/** Renders the mark at `size` px, returning a tightly packed RGB buffer. */
function render(size, scale) {
  const items = shapes(scale);
  const out = Buffer.alloc(size * size * 3);
  const step = MASTER / (size * SS);

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          // centre of this subsample, mapped onto the master grid
          const mx = ((px * SS + sx) + 0.5) * step;
          const my = ((py * SS + sy) + 0.5) * step;
          let color = ACCENT; // background
          for (const it of items) {
            if (inRoundRect(mx, my, it.x0, it.y0, it.x1, it.y1, it.r)) color = it.color;
          }
          r += color[0]; g += color[1]; b += color[2];
        }
      }
      const n = SS * SS;
      const i = (py * size + px) * 3;
      out[i] = Math.round(r / n);
      out[i + 1] = Math.round(g / n);
      out[i + 2] = Math.round(b / n);
    }
  }
  return out;
}

/* --- minimal PNG writer (truecolour, 8-bit, no alpha) --- */
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(size, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  // rows carry a leading filter byte; 0 (none) keeps the encoder trivial
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    rgb.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public", { recursive: true });
const targets = [
  ["public/pwa-192.png", 192, 1],
  ["public/pwa-512.png", 512, 1],
  // launcher-cropped: the composition pulls in so nothing important is clipped
  ["public/pwa-maskable-512.png", 512, 0.72],
  // iOS never rounds a transparent corner for us, so this one is full-bleed too
  ["public/apple-touch-icon.png", 180, 1],
  ["public/favicon.png", 64, 1],
];
for (const [file, size, scale] of targets) {
  writeFileSync(file, png(size, render(size, scale)));
  console.log(`wrote ${file} (${size}x${size})`);
}
