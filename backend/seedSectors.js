// seedSectors.js
const { connectDB, sequelize } = require('./config/db');
const SectorType = require('./models/SectorType');
const SectorUnit = require('./models/SectorUnit');
const MemberCategory = require('./models/MemberCategory');
const SectorUnitCategory = require('./models/SectorUnitCategory');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const data = {
  institution: {
    units: [
      "Mayor Office",
      "Prosperity Party Dire Dawa Branch Office",
      "Council",
      "Mass Media Agency",
      "Office of the Auditor General",
      "Trade Industry and Investment Bureau",
      "Micro and Medium Manufacturing Corporation",
      "Finance and Economic Development Bureau",
      "Revenue Authority",
      "Government Communication Affairs Bureau",
      "Construction and Urban Development Bureau",
      "Labor and Skills Bureau",
      "Agriculture Water Mines and Energy Bureau",
      "Land Development and Management Bureau",
      "Justice Security and Legal Affairs Bureau",
      "Public Service and Human Resource Development Bureau",
      "Education Bureau",
      "Women Children and Social Affairs Bureau",
      "Health Bureau",
      "City Manager Office",
      "Water and Sewerage Authority"
    ],
    categories: [
      "Employee Members",
      "Urban Residents Members",
      "Enterprises Members",
      "Students Members",
      "Investors Members",
      "Farmer Members",
      "Employee Youth Wing Members",
      "Employee Women Wing Members",
      "Resident Youth Wing Members",
      "Resident Women Wing Members"
    ]
  },
  urban: {
    units: ["Woreda 1", "Woreda 2", "Woreda 3", "Woreda 4", "Woreda 5", "Woreda 6", "Woreda 7", "Woreda 8", "Woreda 9"],
    categories: [
      "Employee Members",
      "Urban Residents Members",
      "Enterprises Members",
      "Students Members",
      "Investors Members",
      "Employee Youth Wing Members",
      "Employee Women Wing Members",
      "Resident Youth Wing Members",
      "Resident Women Wing Members"
    ]
  },
  rural: {
    units: ["Biyyo Awwalle Cluster", "Wahel Cluster", "Aseliso Cluster", "Jeldessa Cluster"],
    categories: [
      "Employee Members",
      "Farmer Members",
      "Enterprises Members",
      "Students Members",
      "Investors Members",
      "Employee Youth Wing Members",
      "Employee Women Wing Members",
      "Resident Youth Wing Members",
      "Resident Women Wing Members"
    ]
  }
};

async function seed() {
  try {
    await connectDB();
    console.log('🌱 Seeding Sectors and Categories...');

    // Clear existing
    await SectorUnitCategory.destroy({ where: {} });
    await SectorUnit.destroy({ where: {} });
    await SectorType.destroy({ where: {} });
    await MemberCategory.destroy({ where: {} });

    // 1. Seed Sector Types
    const instType = await SectorType.create({ name: 'Institution' });
    const urbanType = await SectorType.create({ name: 'Urban Woreda' });
    const ruralType = await SectorType.create({ name: 'Rural Cluster' });

    // 2. Seed Member Categories (unique names)
    const allCategoryNames = new Set([
      ...data.institution.categories,
      ...data.urban.categories,
      ...data.rural.categories
    ]);
    const categoryMap = {};
    for (const name of allCategoryNames) {
      const cat = await MemberCategory.create({ name });
      categoryMap[name] = cat.id;
    }

    // 3. Seed Units and link to Categories
    const seedUnits = async (units, typeId, categoryNames) => {
      for (const name of units) {
        const unit = await SectorUnit.create({ name, sectorTypeId: typeId });
        for (const catName of categoryNames) {
          await SectorUnitCategory.create({
            sectorUnitId: unit.id,
            memberCategoryId: categoryMap[catName]
          });
        }
      }
    };

    await seedUnits(data.institution.units, instType.id, data.institution.categories);
    await seedUnits(data.urban.units, urbanType.id, data.urban.categories);
    await seedUnits(data.rural.units, ruralType.id, data.rural.categories);

    console.log('✅ Sector Units created. Now creating Roles and Users...');

    await User.destroy({ where: {} });

    // 1. Admin
    await User.create({
      username: 'admin',
      email: 'admin@mcms.gov.et',
      password: 'Password123!',
      fullName: 'System Administrator',
      role: 'admin'
    });
    console.log('✅ Created Admin User: admin@mcms.gov.et');

    // 2. Expert / Analyst
    await User.create({
      username: 'analyst',
      email: 'analyst@mcms.gov.et',
      password: 'Password123!',
      fullName: 'Expert Analyst',
      role: 'expert'
    });
    console.log('✅ Created Expert User: analyst@mcms.gov.et');

    // 3. Sector Officers (We will create one for each type as an example)
    const healthBureau = await SectorUnit.findOne({ where: { name: 'Health Bureau' } });
    await User.create({
      username: 'health_officer',
      email: 'health@mcms.gov.et',
      password: 'Password123!',
      fullName: 'Health Bureau Officer',
      role: 'sector_officer',
      sectorUnitId: healthBureau.id
    });
    console.log('✅ Created Sector Officer (Institution): health@mcms.gov.et');

    const woreda1 = await SectorUnit.findOne({ where: { name: 'Woreda 1' } });
    await User.create({
      username: 'woreda1_officer',
      email: 'woreda1@mcms.gov.et',
      password: 'Password123!',
      fullName: 'Woreda 1 Officer',
      role: 'sector_officer',
      sectorUnitId: woreda1.id
    });
    console.log('✅ Created Sector Officer (Urban): woreda1@mcms.gov.et');

    const wahelCluster = await SectorUnit.findOne({ where: { name: 'Wahel Cluster' } });
    await User.create({
      username: 'wahel_officer',
      email: 'wahel@mcms.gov.et',
      password: 'Password123!',
      fullName: 'Wahel Cluster Officer',
      role: 'sector_officer',
      sectorUnitId: wahelCluster.id
    });
    console.log('✅ Created Sector Officer (Rural): wahel@mcms.gov.et');

    console.log('✅ Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
