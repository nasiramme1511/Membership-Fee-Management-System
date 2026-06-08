const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const seq = new Sequelize(process.env.DB_NAME||'mcms', process.env.DB_USER||'root', process.env.DB_PASSWORD||'', {
  host: process.env.DB_HOST||'localhost',
  port: Number(process.env.DB_PORT)||3306,
  dialect: 'mysql',
  logging: false
});

async function main() {
  try {
    await seq.authenticate();
    
    console.log("=== RECENT CONVERSATIONS ===");
    const [convs] = await seq.query("SELECT * FROM conversations ORDER BY id DESC LIMIT 5;");
    console.log(convs);

    console.log("\n=== RECENT MESSAGES ===");
    const [msgs] = await seq.query("SELECT * FROM messages ORDER BY id DESC LIMIT 5;");
    console.log(msgs);

    console.log("\n=== RECENT AI ACTIVITY LOGS ===");
    const [logs] = await seq.query("SELECT * FROM ai_activity_logs ORDER BY id DESC LIMIT 5;");
    console.log(logs);

  } catch (err) {
    console.error("Diagnostic error:", err.message);
  } finally {
    await seq.close();
  }
}

main();
