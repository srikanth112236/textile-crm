/**
 * Generates the mobile app icons + splash mark from the storefront brand mark
 * (app/app/icon.svg): slate-950 rounded square, amber "M".
 *
 *   node scripts/generate-brand-assets.js
 *
 * Uses the sharp copy that ships with the web app (app/node_modules).
 */
const path = require('path');
const fs = require('fs');
const sharp = require(path.resolve(__dirname, '../../app/node_modules/sharp'));

const OUT = path.resolve(__dirname, '../assets/images');
const NAVY = '#0f172a';
const AMBER = '#f59e0b';

// Same path as app/app/icon.svg, drawn in a 64x64 viewBox.
const MARK = 'M14 46V18h7.4l10.6 15.2L42.6 18H50v28h-7V30.4L32 45.2 21 30.4V46h-7z';

function markSvg({ size, bg, padding = 0, rx = 0, color = AMBER }) {
  const inner = 64;
  const scale = (inner - padding * 2) / inner;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${inner} ${inner}">
    ${bg ? `<rect width="${inner}" height="${inner}" rx="${rx}" fill="${bg}"/>` : ''}
    <g transform="translate(${padding} ${padding}) scale(${scale})">
      <path d="${MARK}" fill="${color}"/>
    </g>
  </svg>`;
}

async function write(name, svg, size) {
  const file = path.join(OUT, name);
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(file);
  const { size: bytes } = fs.statSync(file);
  console.log(`${name.padEnd(22)} ${size}x${size}  ${Math.round(bytes / 1024)} KB`);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });

  // App icon: full-bleed navy (the OS applies its own mask/rounding).
  await write('icon.png', markSvg({ size: 1024, bg: NAVY, padding: -10 }), 1024);

  // Android adaptive foreground: transparent, mark inside the 66% safe zone.
  await write('adaptive-icon.png', markSvg({ size: 1024, padding: -2 }), 1024);

  // Splash mark on transparent — sits on the navy splash background.
  await write('splash-icon.png', markSvg({ size: 1024, padding: -6 }), 1024);

  // Web favicon / notification icon.
  await write('favicon.png', markSvg({ size: 96, bg: NAVY, padding: -8 }), 96);
  await write('notification-icon.png', markSvg({ size: 192, bg: NAVY, padding: -8 }), 192);

  // Social / store listing placeholder.
  await write('brand-mark.png', markSvg({ size: 512, bg: NAVY, padding: -10 }), 512);
})();

