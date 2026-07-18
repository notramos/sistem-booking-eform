// Script sekali-pakai: generate ikon PWA (192/512/maskable) + favicon dari logo Paroki Albertus.
// Jalankan manual: node scripts/generate-pwa-icons.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = path.join(__dirname, '..', 'public', 'img', 'albertus-logo.png');
const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const APP_DIR = path.join(__dirname, '..', 'src', 'app');

async function main() {
  const meta = await sharp(SRC).metadata();
  console.log('Source logo:', meta.width, 'x', meta.height, meta.format);

  fs.mkdirSync(ICONS_DIR, { recursive: true });

  // Ikon PWA standar (latar putih, logo di-contain supaya tidak terpotong)
  const sizes = [192, 512];
  for (const size of sizes) {
    await sharp(SRC)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(ICONS_DIR, `icon-${size}.png`));
    console.log(`icons/icon-${size}.png`);
  }

  // Maskable icon (Android adaptive icon) — logo diperkecil ke ~70% dengan padding aman
  const maskableSize = 512;
  const logoSize = Math.round(maskableSize * 0.7);
  const logoBuffer = await sharp(SRC).resize(logoSize, logoSize, { fit: 'contain' }).toBuffer();
  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: logoBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(ICONS_DIR, 'maskable-512.png'));
  console.log('icons/maskable-512.png');

  // Favicon Next.js App Router (dipakai otomatis sebagai <link rel="icon">)
  await sharp(SRC)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(APP_DIR, 'icon.png'));
  console.log('src/app/icon.png (favicon)');

  // Apple touch icon
  await sharp(SRC)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(APP_DIR, 'apple-icon.png'));
  console.log('src/app/apple-icon.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
