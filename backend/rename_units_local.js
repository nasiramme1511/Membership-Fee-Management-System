require('dotenv').config();
const { sequelize } = require('./config/db');

async function run() {
  await sequelize.authenticate();
  
  // Update local Secondary Schools
  await sequelize.query("UPDATE sector_units SET name = REPLACE(name, '18.', '') WHERE sectorTypeId = (SELECT id FROM sector_types WHERE name = 'Secondary School')");
  console.log('Updated Secondary School names on localhost');
  
  // Update local Health Institutions
  await sequelize.query("UPDATE sector_units SET name = REPLACE(name, '21.', '') WHERE sectorTypeId = (SELECT id FROM sector_types WHERE name = 'Health Institution')");
  console.log('Updated Health Institution names on localhost');
  
  // Verify
  const [rows] = await sequelize.query("SELECT st.name, su.name FROM sector_units su JOIN sector_types st ON su.sectorTypeId=st.id WHERE st.name IN ('Secondary School','Health Institution') ORDER BY st.name, su.name");
  rows.forEach(r => console.log(r.name + ': ' + r.su));
  
  process.exit();
}
run().catch(e => console.error(e.message));
