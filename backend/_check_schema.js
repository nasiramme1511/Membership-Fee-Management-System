const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const seq = new Sequelize(process.env.DB_NAME||'mcms', process.env.DB_USER||'root', process.env.DB_PASSWORD||'', {
  host: process.env.DB_HOST||'localhost',
  port: Number(process.env.DB_PORT)||3306,
  dialect: 'mysql',
  logging: false
});
(async () => {
  await seq.authenticate();
  const tables = ['members','payments','audit_logs','sector_payment_audit_logs','sector_payments','monthly_closings'];
  for (const tbl of tables) {
    try {
      const [rows] = await seq.query("SHOW COLUMNS FROM " + tbl);
      console.log('--- ' + tbl + ' ---');
      rows.forEach(r => console.log('  ' + r.Field + ' (' + r.Type + ') ' + (r.Null==='NO'?'NOT NULL ':'') + (r.Key||'')));
    } catch(e) { console.log('--- ' + tbl + ' --- ERROR: ' + e.message); }
  }
  await seq.close();
})();
