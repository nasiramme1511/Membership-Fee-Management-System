
const { sequelize } = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function debugLogin() {
  try {
    const email = 'admin@mcms.gov.et';
    const plainPassword = 'adminpassword123';
    
    let admin = await User.findOne({ where: { email } });
    if (!admin) {
      console.log('Admin not found, creating...');
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      admin = await User.create({
        username: 'admin',
        email: email,
        password: hashedPassword,
        fullName: 'System Administrator',
        role: 'admin'
      });
    } else {
      console.log('Admin found. Resetting password via instance save (hooks handle hashing)...');
      admin.password = plainPassword;
      await admin.save();
    }

    // Verify
    const verifyUser = await User.findOne({ where: { email } });
    console.log(`Stored Hash: ${verifyUser.password}`);
    const match = await bcrypt.compare(plainPassword, verifyUser.password);
    console.log(`Verify match for "${plainPassword}": ${match}`);
    
  } catch (err) {
    console.error('Debug Error:', err);
  } finally {
    process.exit();
  }
}

debugLogin();
