require('dotenv').config();
const { connectDB, sequelize } = require('./config/db');
const SectorType = require('./models/SectorType');
const SectorUnit = require('./models/SectorUnit');
const MemberCategory = require('./models/MemberCategory');
const SectorUnitCategory = require('./models/SectorUnitCategory');
const Member = require('./models/Member');

async function migrate() {
  await connectDB();

  console.log('=== STEP 1: Data Integrity Check ===\n');

  // 1. Check FK integrity
  const [orphanUnits] = await sequelize.query(
    `SELECT COUNT(*) as cnt FROM members m 
     LEFT JOIN sector_units su ON m.sectorUnitId = su.id 
     WHERE m.sectorUnitId IS NOT NULL AND su.id IS NULL`
  );
  console.log(`Orphaned sectorUnitId refs: ${orphanUnits[0].cnt}`);

  const [orphanCats] = await sequelize.query(
    `SELECT COUNT(*) as cnt FROM members m 
     LEFT JOIN member_categories mc ON m.memberCategoryId = mc.id 
     WHERE m.memberCategoryId IS NOT NULL AND mc.id IS NULL`
  );
  console.log(`Orphaned memberCategoryId refs: ${orphanCats[0].cnt}`);

  // 2. Check sector_type - sector_unit integrity
  const [orphanUnitsNoType] = await sequelize.query(
    `SELECT COUNT(*) as cnt FROM sector_units su 
     LEFT JOIN sector_types st ON su.sectorTypeId = st.id 
     WHERE st.id IS NULL`
  );
  console.log(`Orphaned sector_units (no sector_type): ${orphanUnitsNoType[0].cnt}`);

  // 3. Check sector_unit_categories integrity
  const [orphanSUC] = await sequelize.query(
    `SELECT COUNT(*) as cnt FROM sector_unit_categories suc
     LEFT JOIN sector_units su ON suc.sectorUnitId = su.id
     LEFT JOIN member_categories mc ON suc.memberCategoryId = mc.id
     WHERE su.id IS NULL OR mc.id IS NULL`
  );
  console.log(`Orphaned sector_unit_categories: ${orphanSUC[0].cnt}`);

  // 4. Show current distribution
  const [typeCounts] = await sequelize.query(
    `SELECT st.name as sectorType, COUNT(m.id) as cnt
     FROM sector_types st
     LEFT JOIN sector_units su ON su.sectorTypeId = st.id
     LEFT JOIN members m ON m.sectorUnitId = su.id
     GROUP BY st.id, st.name
     ORDER BY st.id`
  );
  console.log('\nCurrent member distribution by sector type:');
  for (const t of typeCounts) {
    console.log(`  ${t.sectorType}: ${t.cnt} members`);
  }

  console.log('\n=== STEP 2: Verify Sector Types, Units, and Categories ===\n');

  // Fetch all sector types with their units
  const sectorTypes = await SectorType.findAll({ order: [['id', 'ASC']] });
  console.log(`Sector Types: ${sectorTypes.length}`);
  for (const st of sectorTypes) {
    const units = await SectorUnit.findAll({ where: { sectorTypeId: st.id }, order: [['id', 'ASC']] });
    console.log(`  ${st.name} (id=${st.id}): ${units.length} units`);
    for (const u of units) {
      const cats = await sequelize.query(
        `SELECT mc.id, mc.name FROM member_categories mc
         JOIN sector_unit_categories suc ON suc.memberCategoryId = mc.id
         WHERE suc.sectorUnitId = ?
         ORDER BY mc.id`,
        { replacements: [u.id], type: sequelize.QueryTypes.SELECT }
      );
      console.log(`    - ${u.name} (id=${u.id}): ${cats.map(c => c.name).join(', ')}`);
    }
  }

  const memberCategories = await MemberCategory.findAll({ order: [['id', 'ASC']] });
  console.log(`\nMember Categories: ${memberCategories.length}`);
  for (const mc of memberCategories) {
    const [cnt] = await sequelize.query(
      `SELECT COUNT(*) as cnt FROM members WHERE memberCategoryId = ?`,
      { replacements: [mc.id] }
    );
    console.log(`  ${mc.name} (id=${mc.id}): ${cnt[0].cnt} members`);
  }

  console.log('\n=== STEP 3: Member Reassignment ===\n');

  // Get all members with current assignments
  const members = await Member.findAll({
    order: [['id', 'ASC']],
    attributes: ['id', 'fullName', 'membershipType', 'sectorUnitId', 'memberCategoryId', 'cluster', 'sector', 'branch']
  });
  console.log(`Total members: ${members.length}`);

  // Reset current (wrong) assignments to NULL
  console.log('\nResetting all current sectorUnitId and memberCategoryId to NULL...');
  await Member.update(
    { sectorUnitId: null, memberCategoryId: null },
    { where: {} }
  );

  // Load the sector hierarchy
  const allSectorTypes = await SectorType.findAll({ order: [['id', 'ASC']] });
  const typeMap = {};
  for (const st of allSectorTypes) {
    const units = await SectorUnit.findAll({
      where: { sectorTypeId: st.id },
      order: [['id', 'ASC']]
    });
    const unitsWithCats = [];
    for (const u of units) {
      const cats = await sequelize.query(
        `SELECT mc.id, mc.name FROM member_categories mc
         JOIN sector_unit_categories suc ON suc.memberCategoryId = mc.id
         WHERE suc.sectorUnitId = ?
         ORDER BY mc.id`,
        { replacements: [u.id], type: sequelize.QueryTypes.SELECT }
      );
      unitsWithCats.push({ unitId: u.id, unitName: u.name, categories: cats });
    }
    typeMap[st.name] = { typeId: st.id, units: unitsWithCats };
  }

  // Use Employee Members category for all Salary-Based members
  const employeeCategory = await MemberCategory.findOne({ where: { name: 'Employee Members' } });

  // Assign members to appropriate sector types/units based on membershipType and data hints
  let assignCount = 0;
  const unitRoundRobin = {};

  for (const member of members) {
    let targetType = null;
    let targetCategoryId = null;

    // Determine category based on membershipType
    if (member.membershipType === 'Salary-Based') {
      targetCategoryId = employeeCategory.id;
      targetType = 'Government Institutions';
    } else if (member.membershipType === 'Non-Salary') {
      const farmerCat = await MemberCategory.findOne({ where: { name: 'Farmer Members' } });
      const urbanResCat = await MemberCategory.findOne({ where: { name: 'Urban Residents' } });
      targetCategoryId = farmerCat ? farmerCat.id : null;
      targetType = 'Rural Clusters';
    } else if (member.membershipType === 'Business') {
      const entCat = await MemberCategory.findOne({ where: { name: 'Enterprises' } });
      targetCategoryId = entCat ? entCat.id : null;
      targetType = 'Urban Woredas';
    } else if (member.membershipType === 'Student') {
      const studentCat = await MemberCategory.findOne({ where: { name: 'Student Members' } });
      targetCategoryId = studentCat ? studentCat.id : null;
      targetType = 'Urban Woredas';
    } else if (member.membershipType === 'Investor') {
      const investorCat = await MemberCategory.findOne({ where: { name: 'Investors' } });
      targetCategoryId = investorCat ? investorCat.id : null;
      targetType = 'Urban Woredas';
    } else if (member.membershipType === 'Wing') {
      targetType = 'Government Institutions';
    }

    // Fallback if no category determined
    if (!targetCategoryId) {
      targetCategoryId = employeeCategory ? employeeCategory.id : null;
    }

    // Get units for target type, or use first available type
    let typeInfo = targetType ? typeMap[targetType] : null;
    if (!typeInfo || typeInfo.units.length === 0) {
      typeInfo = allSectorTypes.length > 0 ? typeMap[allSectorTypes[0].name] : null;
    }

    if (!typeInfo || !targetCategoryId) {
      console.log(`  Cannot assign ${member.fullName}: no matching sector type`);
      continue;
    }

    // Round-robin across units of this sector type
    if (!unitRoundRobin[targetType]) unitRoundRobin[targetType] = 0;
    const unitIndex = unitRoundRobin[targetType] % typeInfo.units.length;
    unitRoundRobin[targetType]++;

    const unit = typeInfo.units[unitIndex];

    // Verify this unit supports the chosen category
    const unitSupportsCategory = unit.categories.some(c => c.id === targetCategoryId);
    const finalCategoryId = unitSupportsCategory ? targetCategoryId : (unit.categories[0] ? unit.categories[0].id : null);

    await sequelize.query(
      `UPDATE members SET sectorUnitId = ?, memberCategoryId = ? WHERE id = ?`,
      { replacements: [unit.unitId, finalCategoryId, member.id] }
    );

    assignCount++;
  }

  console.log(`\nAssigned ${assignCount}/${members.length} members successfully.`);

  console.log('\n=== STEP 4: Final Verification ===\n');

  // Check no unassigned members
  const [unassigned] = await sequelize.query(
    "SELECT COUNT(*) as cnt FROM members WHERE sectorUnitId IS NULL OR memberCategoryId IS NULL"
  );
  console.log(`Members with NULL assignments: ${unassigned[0].cnt}`);

  // Show final distribution
  const [finalTypeCounts] = await sequelize.query(
    `SELECT st.name as sectorType, COUNT(m.id) as cnt
     FROM sector_types st
     LEFT JOIN sector_units su ON su.sectorTypeId = st.id
     LEFT JOIN members m ON m.sectorUnitId = su.id
     GROUP BY st.id, st.name
     ORDER BY st.id`
  );
  console.log('\nFinal member distribution by sector type:');
  for (const t of finalTypeCounts) {
    console.log(`  ${t.sectorType}: ${t.cnt} members`);
  }

  // Show per-unit distribution
  const [finalUnitCounts] = await sequelize.query(
    `SELECT su.name, COUNT(m.id) as cnt
     FROM sector_units su
     LEFT JOIN members m ON m.sectorUnitId = su.id
     GROUP BY su.id, su.name
     ORDER BY su.sectorTypeId, su.name`
  );
  console.log('\nFinal member distribution by sector unit:');
  for (const u of finalUnitCounts) {
    console.log(`  ${u.name}: ${u.cnt} members`);
  }

  // Show per-category distribution
  const [finalCatCounts] = await sequelize.query(
    `SELECT mc.name, COUNT(m.id) as cnt
     FROM member_categories mc
     LEFT JOIN members m ON m.memberCategoryId = mc.id
     GROUP BY mc.id, mc.name
     ORDER BY mc.name`
  );
  console.log('\nFinal member distribution by category:');
  for (const c of finalCatCounts) {
    console.log(`  ${c.name}: ${c.cnt} members`);
  }

  console.log('\n=== Migration Complete! ===');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
