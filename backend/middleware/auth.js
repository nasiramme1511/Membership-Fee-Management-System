// middleware/auth.js - JWT Authentication Middleware (MySQL / Sequelize)
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT Token
exports.auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid or inactive user.' });
    }

    req.user   = user;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// Role-based Authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    const effectiveRoles = roles.flatMap(r => {
      if (r === 'admin') return ['admin', 'super_admin'];
      if (r === 'sector_officer') return ['sector_officer'];
      if (r === 'expert') return ['expert'];
      return [r];
    });
    if (!effectiveRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

// Optional Auth - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      });
      if (user && user.isActive) {
        req.user   = user;
        req.userId = decoded.userId;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

// Enforce Sector Boundaries
exports.scopeSector = (req, res, next) => {
  if (req.user && req.user.role === 'sector_officer') {
    if (!req.user.sectorUnitId) {
      return res.status(403).json({ success: false, message: 'Sector Officer has no assigned sector.' });
    }
    req.query.sectorId = req.user.sectorUnitId;
    if (req.method === 'POST' || req.method === 'PUT') {
      req.body.sectorUnitId = req.user.sectorUnitId;
    }
  }
  next();
};
