const bcrypt = require('../backend/node_modules/bcryptjs');
const dotenv = require('../backend/node_modules/dotenv');
dotenv.config({path: './backend/.env'});

const { sequelize } = require('../backend/config/db');
const User = require('../backend/models/User');

async function testLogin() {
  try {
    const email = 'admin@mcms.ddu';
    const plainPassword = 'admin123';
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('User not found!');
      return;
    }
    
    console.log('User found:', user.email);
    console.log('Stored password hash:', user.password);
    
    const isMatch = await bcrypt.compare(plainPassword, user.password);
    console.log(`Bcrypt match for "${plainPassword}":`, isMatch);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

testLogin();
