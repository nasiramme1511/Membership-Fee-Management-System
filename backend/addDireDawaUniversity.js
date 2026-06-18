require('dotenv').config();
const { connectDB, sequelize } = require('./config/db');
const SectorType = require('./models/SectorType');
const SectorUnit = require('./models/SectorUnit');
const MemberCategory = require('./models/MemberCategory');
const SectorUnitCategory = require('./models/SectorUnitCategory');

async function migrate() {
  try {
    await connectDB();

    const existing = await SectorUnit.findOne({ where: { name: 'Dire Dawa University' } });
    if (existing) {
      console.log('Dire Dawa University already exists (id=' + existing.id + '). Nothing to do.');
      process.exit(0);
    }

    const instType = await SectorType.findOne({ where: { name: 'Institution' } });
    if (!instType) {
      console.error('Sector type "Institution" not found. Run seedSectors.js first.');
      process.exit(1);
    }

    const catNames = ['Employee Members', 'Employee Youth Wing Members', 'Employee Women Wing Members'];
    const catIds = [];
    for (const name of catNames) {
      const cat = await MemberCategory.findOne({ where: { name } });
      if (cat) catIds.push(cat.id);
    }

    if (catIds.length !== catNames.length) {
      console.warn('Warning: Only found ' + catIds.length + '/' + catNames.length + ' expected categories');
    }

    const unit = await SectorUnit.create({ name: 'Dire Dawa University', sectorTypeId: instType.id, parentId: null });
    for (const catId of catIds) {
      await SectorUnitCategory.create({ sectorUnitId: unit.id, memberCategoryId: catId });
    }

    console.log('✅ Dire Dawa University sector unit created (id=' + unit.id + ')');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
