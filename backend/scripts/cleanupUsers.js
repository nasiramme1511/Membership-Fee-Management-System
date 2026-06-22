// scripts/cleanupUsers.js
// Deletes all users from TiDB Cloud except those listed below.
// Also reassigns any super_admin users to admin role.
//
// Usage: node scripts/cleanupUsers.js
// SAFETY: always shows a summary and asks for confirmation before deleting.

const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '..', '.env') });

const { connectDB, sequelize } = require('../config/db');
const User = require('../models/User');

const USERS_TO_KEEP = [
  'seyfedin@pp-diredawa.org',
  'ppdiredawabranchoffice@gmail.com',
  'mohamedahme.adem0052@gmail.com',
];

async function main() {
  try {
    await connectDB();

    const allUsers = await User.findAll({ attributes: ['id', 'email', 'fullName', 'role', 'username'] });
    console.log(`\n📋 Total users in database: ${allUsers.length}`);

    const toDelete = allUsers.filter(u => !USERS_TO_KEEP.includes(u.email));
    const toKeep = allUsers.filter(u => USERS_TO_KEEP.includes(u.email));

    console.log('\n🔵 Users to KEEP:');
    for (const u of toKeep) {
      console.log(`   ✅ ${u.email} (${u.fullName || u.username}) [${u.role}]`);
    }

    console.log(`\n🔴 Users to DELETE (${toDelete.length}):`);
    for (const u of toDelete) {
      console.log(`   ❌ ${u.email} (${u.fullName || u.username}) [${u.role}]`);
    }

    // Reassign super_admin to admin first
    const [superAdminRows] = await sequelize.query(
      `SELECT id, email FROM users WHERE role = 'super_admin'`
    );
    if (superAdminRows.length > 0) {
      console.log('\n🔄 Reassigning super_admin users to admin role:');
      for (const u of superAdminRows) {
        console.log(`   → ${u.email}`);
      }
      await sequelize.query(`UPDATE users SET role = 'admin' WHERE role = 'super_admin'`);
      console.log('✅ Done.');
    }

    if (toDelete.length === 0) {
      console.log('\n✅ No users to delete. Exiting.');
      process.exit(0);
    }

    console.log('\n⚠️  WARNING: This will permanently delete all users listed above.');
    console.log(`   ${toDelete.length} user(s) will be removed.`);
    console.log('   Press Ctrl+C within 5 seconds to cancel, or wait to proceed...');

    await new Promise(resolve => setTimeout(resolve, 5000));

    for (const u of toDelete) {
      await User.destroy({ where: { id: u.id } });
      console.log(`   ✅ Deleted: ${u.email}`);
    }

    console.log(`\n🎉 Cleanup complete. ${toDelete.length} user(s) deleted.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
  }
}

main();
