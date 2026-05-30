const fs = require('fs');
const zlib = require('zlib');
function uint32(n) { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; }
function crc32(buf) { let c = -1; for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xff]; return (c ^ -1) >>> 0; }
const table = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
function chunk(type, data) { const buf = Buffer.alloc(4 + type.length + data.length + 4); buf.writeUInt32BE(data.length, 0); buf.write(type, 4, 'ascii'); data.copy(buf, 8); buf.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length); return buf; }
function pngBuffer(width, height, pixels) { const header = Buffer.from('\x89PNG\r\n\x1a\n', 'binary'); const ihdr = chunk('IHDR', Buffer.concat([uint32(width), uint32(height), Buffer.from([8, 6, 0, 0, 0])])); const raw = Buffer.alloc((width * 4 + 1) * height); for (let y = 0; y < height; y++) { raw[y * (width * 4 + 1)] = 0; for (let x = 0; x < width; x++) { const idx = y * width + x; const px = pixels[idx]; raw[y * (width * 4 + 1) + 1 + x * 4] = px[0]; raw[y * (width * 4 + 1) + 2 + x * 4] = px[1]; raw[y * (width * 4 + 1) + 3 + x * 4] = px[2]; raw[y * (width * 4 + 1) + 4 + x * 4] = px[3]; } } const idat = chunk('IDAT', zlib.deflateSync(raw)); const iend = chunk('IEND', Buffer.alloc(0)); return Buffer.concat([header, ihdr, idat, iend]); }
function pointInPoly(x, y, poly) { let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1]; const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi); if (intersect) inside = !inside; } return inside; }
function drawIcon(size, options = {}) {
  const bg = [0x25, 0x63, 0xeb, 0xff];
  const white = [0xff, 0xff, 0xff, 0xff];
  const pixels = new Array(size * size);
  const logoScale = options.logoScale || 1;
  const offset = (256 - 256 * logoScale) / 2;
  const scale = size / 256;
  const toIconPoint = ([x, y]) => [(offset + x * logoScale) * scale, (offset + y * logoScale) * scale];
  const leftPoly = [[48, 200], [128, 40], [128, 50], [65, 200]].map(toIconPoint);
  const rightPoly = [[128, 50], [208, 200], [191, 200], [128, 60]].map(toIconPoint);
  const barMinX = (offset + 80 * logoScale) * scale;
  const barMaxX = (offset + 176 * logoScale) * scale;
  const barMinY = (offset + 130 * logoScale) * scale;
  const barMaxY = (offset + 146 * logoScale) * scale;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let col = bg;
      if (
        pointInPoly(x + 0.5, y + 0.5, leftPoly) ||
        pointInPoly(x + 0.5, y + 0.5, rightPoly) ||
        (x >= barMinX && x < barMaxX && y >= barMinY && y < barMaxY)
      ) {
        col = white;
      }
      pixels[y * size + x] = col;
    }
  }
  return pixels;
}

for (const size of [192, 512]) {
  const variants = [
    [`public/icon-${size}.png`, drawIcon(size)],
    [`public/icon-maskable-${size}.png`, drawIcon(size, { logoScale: 0.72 })],
  ];

  for (const [path, pixels] of variants) {
    const buf = pngBuffer(size, size, pixels);
    fs.writeFileSync(path, buf);
    console.log(`wrote ${path} (${buf.length} bytes)`);
  }
}
