const AuditLog = require('../models/AuditLog');

exports.createAuditLog = async ({ userId, username, actionType, recordCount, req }) => {
  try {
    const ipAddress = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
      || req?.connection?.remoteAddress
      || req?.socket?.remoteAddress
      || null;

    await AuditLog.create({
      userId,
      username,
      actionType,
      recordCount,
      ipAddress
    });
  } catch (error) {
    console.error('Audit log creation error:', error.message);
  }
};
