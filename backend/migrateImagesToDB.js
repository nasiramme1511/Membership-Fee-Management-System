const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '.env') });

const { connectDB, sequelize } = require('./config/db');
const News = require('./models/News');
const LandingPageImage = require('./models/LandingPageImage');
const path = require('path');
const fs = require('fs');

function readFileAsDataUrl(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };
    const mime = mimeMap[ext] || 'image/jpeg';
    return { data: `data:${mime};base64,${buffer.toString('base64')}`, mime };
  } catch { return null; }
}

async function backfillNewsImages() {
  const newsItems = await News.findAll({ where: { imageData: null } });
  let count = 0;
  for (const item of newsItems) {
    if (!item.image) continue;
    const filePath = path.join(__dirname, '..', item.image);
    const result = readFileAsDataUrl(filePath);
    if (result) {
      item.imageData = result.data;
      item.imageMimeType = result.mime;
      await item.save();
      count++;
    }
  }
  console.log(`Backfilled ${count} news images`);
}

async function backfillLandingImages() {
  const images = await LandingPageImage.findAll({ where: { imageData: null } });
  let count = 0;
  for (const img of images) {
    if (!img.image) continue;

    const mainPath = path.join(__dirname, '..', img.image);
    const mainResult = readFileAsDataUrl(mainPath);
    if (mainResult) {
      img.imageData = mainResult.data;
      img.imageMimeType = mainResult.mime;
    }

    if (img.thumbnailSmall) {
      const smPath = path.join(__dirname, '..', img.thumbnailSmall);
      const smResult = readFileAsDataUrl(smPath);
      if (smResult) img.thumbnailSmallData = smResult.data;
    }

    if (img.thumbnailMedium) {
      const mdPath = path.join(__dirname, '..', img.thumbnailMedium);
      const mdResult = readFileAsDataUrl(mdPath);
      if (mdResult) img.thumbnailMediumData = mdResult.data;
    }

    if (mainResult) {
      await img.save();
      count++;
    }
  }
  console.log(`Backfilled ${count} landing page images`);
}

async function addColumnsToNews() {
  const newColumns = [
    { name: 'image_data', type: 'LONGTEXT DEFAULT NULL' },
    { name: 'image_mime_type', type: 'VARCHAR(50) DEFAULT NULL' },
  ];
  for (const col of newColumns) {
    const [rows] = await sequelize.query(
      `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'news' AND COLUMN_NAME = ?`,
      { replacements: [col.name] }
    );
    if (rows[0].cnt === 0) {
      await sequelize.query(`ALTER TABLE news ADD COLUMN \`${col.name}\` ${col.type}`);
      console.log(`  → Added column: ${col.name} to news`);
    }
  }
}

async function addColumnsToLandingImages() {
  const newColumns = [
    { name: 'image_data', type: 'LONGTEXT DEFAULT NULL' },
    { name: 'image_mime_type', type: 'VARCHAR(50) DEFAULT NULL' },
    { name: 'thumbnail_small_data', type: 'LONGTEXT DEFAULT NULL' },
    { name: 'thumbnail_medium_data', type: 'LONGTEXT DEFAULT NULL' },
  ];
  for (const col of newColumns) {
    const [rows] = await sequelize.query(
      `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'landing_page_images' AND COLUMN_NAME = ?`,
      { replacements: [col.name] }
    );
    if (rows[0].cnt === 0) {
      await sequelize.query(`ALTER TABLE landing_page_images ADD COLUMN \`${col.name}\` ${col.type}`);
      console.log(`  → Added column: ${col.name} to landing_page_images`);
    }
  }
}

async function main() {
  try {
    console.log('Migrating news/landing images to TiDB Cloud persistent storage...');
    await connectDB();

    console.log('\n--- Step 1: Add new columns ---');
    await addColumnsToNews();
    await addColumnsToLandingImages();

    console.log('\n--- Step 2: Backfill existing images from filesystem ---');
    await backfillNewsImages();
    await backfillLandingImages();

    console.log('\nMigration completed!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

main();
