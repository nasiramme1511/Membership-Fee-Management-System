let sharp;
try {
  sharp = require('sharp');
} catch {
  try {
    sharp = require('../../backend/node_modules/sharp');
  } catch {
    console.log('sharp not installed, skipping icon generation (committed icons will be used)');
    process.exit(0);
  }
}
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const LOGO_PATH = path.join(__dirname, '..', 'public', 'icons', 'image.png');

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];

async function generateIcons() {
  const logoBuffer = fs.readFileSync(LOGO_PATH);

  for (const size of SIZES) {
    const svgBg = Buffer.from(
      `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#0B5D3B"/>
      </svg>`
    );

    const resizedLogo = await sharp(logoBuffer)
      .resize(Math.round(size * 0.8), Math.round(size * 0.8), { fit: 'contain' })
      .png()
      .toBuffer();

    const padding = Math.round(size * 0.1);

    await sharp(svgBg)
      .composite([{ input: resizedLogo, top: padding, left: padding }])
      .png()
      .toFile(path.join(ICONS_DIR, `icon-${size}x${size}.png`));
    console.log(`Created icon-${size}x${size}.png`);
  }

  for (const size of MASKABLE_SIZES) {
    const padding = Math.round(size * 0.1);
    const innerSize = size - padding * 2;

    const svgBg = Buffer.from(
      `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#0B5D3B"/>
      </svg>`
    );

    const resizedLogo = await sharp(logoBuffer)
      .resize(innerSize, innerSize, { fit: 'contain' })
      .png()
      .toBuffer();

    await sharp(svgBg)
      .composite([{ input: resizedLogo, top: padding, left: padding }])
      .png()
      .toFile(path.join(ICONS_DIR, `maskable-icon-${size}x${size}.png`));
    console.log(`Created maskable-icon-${size}x${size}.png`);
  }

  fs.copyFileSync(LOGO_PATH, path.join(ICONS_DIR, 'icon-512x512.png'));
  console.log('Copied image.png as icon-512x512.png');

  console.log('\nAll PWA icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Icon generation failed:', err.message);
  process.exit(1);
});
