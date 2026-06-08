const AuditLog = require('../models/AuditLog');
const AIActivityLog = require('../models/AIActivityLog');

async function aiActionAuditLog({ userId, username, action, params, result, responseTime, success }) {
  try {
    const details = {
      action,
      params: sanitizeParams(params),
      result: sanitizeResult(result),
      responseTime,
      timestamp: new Date().toISOString()
    };

    await AuditLog.create({
      userId,
      username,
      actionType: `AI_${action}`,
      recordCount: result?.data?.total || result?.data?.approved || result?.data?.deletedCount || 
                    result?.data?.length || result?.data?.members?.length || 1,
      details
    });

    await AIActivityLog.create({
      userId,
      agent: 'action',
      query: `${action}: ${JSON.stringify(sanitizeParams(params)).substring(0, 500)}`,
      action,
      responseTime,
      tokenUsage: 0
    });

    console.log(`[AI_ACTION] ${username} → ${action} → ${success ? 'SUCCESS' : 'FAILED'} (${responseTime}ms)`);
  } catch (error) {
    console.error('[AI_ACTION_LOG] Error:', error.message);
  }
}

function sanitizeParams(params) {
  if (!params) return {};
  const sanitized = { ...params };
  delete sanitized.password;
  delete sanitized.newPassword;
  if (sanitized.updates) {
    sanitized.updates = { ...sanitized.updates };
    delete sanitized.updates.password;
  }
  return sanitized;
}

function sanitizeResult(result) {
  if (!result) return {};
  const sanitized = { ...result };
  if (sanitized.data?.rows) {
    sanitized.data = { ...sanitized.data, rows: `[${sanitized.data.rows.length} rows]` };
  }
  return sanitized;
}

module.exports = { aiActionAuditLog };
