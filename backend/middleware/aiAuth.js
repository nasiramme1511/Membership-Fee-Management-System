const { sequelize } = require('../config/db');

const requestLogs = new Map();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 20;

exports.aiRateLimiter = (req, res, next) => {
  const userId = req.userId || req.ip;
  const now = Date.now();

  if (!requestLogs.has(userId)) {
    requestLogs.set(userId, []);
  }

  const timestamps = requestLogs.get(userId).filter(ts => now - ts < RATE_LIMIT_WINDOW);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      success: false,
      message: 'Too many AI requests. Please wait before sending another query.'
    });
  }

  timestamps.push(now);
  requestLogs.set(userId, timestamps);
  next();
};

exports.logAIRequest = async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    if (req.path.includes('/ai')) {
      try {
        const { sequelize } = require('../config/db');
        const Q = sequelize.QueryTypes.INSERT;
        const query = `INSERT INTO ai_logs (userId, question, response, timestamp) VALUES (?, ?, ?, NOW())`;
        sequelize.query(query, {
          replacements: [req.userId || null, req.body?.message || '', body?.data?.response || ''],
          type: Q
        }).catch(err => console.error('AI log error:', err.message));
      } catch (err) {
        console.error('AI log error:', err.message);
      }
    }
    return originalJson(body);
  };

  next();
};
