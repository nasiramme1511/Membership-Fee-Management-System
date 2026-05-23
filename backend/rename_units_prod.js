const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({
    host: 'gateway01.us-west-2.prod.aws.tidbcloud.com',
    user: '4MTQ6Lc9AYGCnHs.root',
    password: 'Nxn3TScRBpC6GCJy',
    database: 'mcms',
    port: 4000,
    ssl: { rejectUnauthorized: false },
    connectTimeout: 30000
  });

  // Update Secondary Schools
  await conn.query("UPDATE sector_units SET name = REPLACE(name, '18.', '') WHERE sectorTypeId = (SELECT id FROM sector_types WHERE name = 'Secondary School')");
  console.log('Updated Secondary School names');

  // Update Health Institutions
  await conn.query("UPDATE sector_units SET name = REPLACE(name, '21.', '') WHERE sectorTypeId = (SELECT id FROM sector_types WHERE name = 'Health Institution')");
  console.log('Updated Health Institution names');

  // Verify
  const [rows] = await conn.query("SELECT st.name as type, su.name FROM sector_units su JOIN sector_types st ON su.sectorTypeId=st.id WHERE st.name IN ('Secondary School','Health Institution') ORDER BY st.name, su.name");
  rows.forEach(r => console.log(r.type + ': ' + r.name));

  await conn.end();
  process.exit();
}
run().catch(e => console.error(e.message));
