// server.js - Main entry point for MCMS-DDU Backend (MySQL / Sequelize)
const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');

dotenv.config();

const app = express();

// CORS — allow all in production (frontend served from same Express server)
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? true  // Same-origin: frontend served by this Express server
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files - serve uploaded profile pics
const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ── MySQL Connection & Model Sync ─────────────────────────────────────────────
const { connectDB, sequelize } = require('./config/db');

// Define Sequelize associations BEFORE connectDB syncs tables
const User         = require('./models/User');
const Member       = require('./models/Member');
const Payment      = require('./models/Payment');
const Receipt      = require('./models/Receipt');
const Contribution = require('./models/Contribution');

// Payment ↔ Member
Payment.belongsTo(Member, { foreignKey: 'memberDbId', as: 'memberInfo', onDelete: 'CASCADE' });
Member.hasMany(Payment,   { foreignKey: 'memberDbId', as: 'payments',   onDelete: 'CASCADE' });

// Receipt ↔ Member
Receipt.belongsTo(Member,  { foreignKey: 'memberDbId',  as: 'memberInfo', onDelete: 'CASCADE'  });
Member.hasMany(Receipt,    { foreignKey: 'memberDbId',  as: 'receipts',    onDelete: 'CASCADE'  });

// Receipt ↔ Payment
Receipt.belongsTo(Payment, { foreignKey: 'paymentDbId', as: 'paymentInfo', onDelete: 'CASCADE' });
Payment.hasMany(Receipt,   { foreignKey: 'paymentDbId', as: 'receipts',    onDelete: 'CASCADE'    });

// Contribution ↔ Member
Contribution.belongsTo(Member, { foreignKey: 'memberDbId', as: 'memberInfo', onDelete: 'CASCADE' });
Member.hasMany(Contribution,   { foreignKey: 'memberDbId', as: 'contributions', onDelete: 'CASCADE' });

// Connect and sync tables
connectDB();

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/users',         require('./routes/userRoutes'));
app.use('/api/members',       require('./routes/memberRoutes'));
app.use('/api/contributions', require('./routes/contributionRoutes'));
app.use('/api/payments',      require('./routes/paymentRoutes'));
app.use('/api/receipts',      require('./routes/receiptRoutes'));
app.use('/api/reports',       require('./routes/reportRoutes'));
app.use('/api/dashboard',     require('./routes/dashboardRoutes'));
app.use('/api/import',        require('./routes/importRoutes'));
app.use('/api/settings',      require('./routes/settingRoutes'));
app.use('/api/backup',        require('./routes/backupRoutes'));
app.use('/api',               require('./routes/sectorRoutes'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Prosperity Party Membership Backend Running', timestamp: new Date() });
});

// ── Serve Frontend (Production) ───────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    // SPA fallback — all non-API routes serve index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
    console.log('✅ Serving frontend from:', frontendDist);
  } else {
    console.warn('⚠️  Frontend dist folder not found. Run: npm run build');
  }
}

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Prosperity Party Membership Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗄️  Database: MySQL (Sequelize)`);
});

module.exports = app;
