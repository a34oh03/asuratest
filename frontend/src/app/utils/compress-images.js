// scripts/compress-images.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const STATIC_DIR = path.join(__dirname, '../public/static');

async function compress() {
  const files = fs.readdirSync(STATIC_DIR);
  for (const file of files) {
    if (/\.png$/i.test(file)) {
      const inputPath  = path.join(STATIC_DIR, file);
      const webpName   = file.replace(/\.png$/i, '.webp');
      const outputPath = path.join(STATIC_DIR, webpName);

      if (fs.existsSync(outputPath)) continue;

      try {
        await sharp(inputPath)
          .webp({ quality: 80 })
          .toFile(outputPath);
        console.log(`✔ ${file} → ${webpName}`);
      } catch (err) {
        console.error(`✘ ${file} 처리 실패:`, err);
      }
    }
  }
}

compress();
