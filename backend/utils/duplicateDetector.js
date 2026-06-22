// utils/duplicateDetector.js
// Centralized duplicate detection for members across phone, nationalId, email.
const { Op } = require('sequelize');
const Member = require('../models/Member');

const FIELDS = ['phone', 'nationalId', 'email'];

async function checkDuplicate(memberData, excludeId = null) {
  const conditions = [];
  const matchedBy = [];

  for (const field of FIELDS) {
    const value = memberData[field];
    if (!value || String(value).trim() === '') continue;
    const trimmed = String(value).trim();
    conditions.push({ [field]: trimmed });
    matchedBy.push({ field, value: trimmed });
  }

  if (conditions.length === 0) return null;

  const where = { [Op.or]: conditions };
  if (excludeId) where.id = { [Op.ne]: excludeId };

  const existing = await Member.findOne({ where, attributes: ['id', 'memberId', 'fullName', 'phone', 'nationalId', 'email'] });
  if (!existing) return null;

  const matchedFields = matchedBy
    .filter(m => String(existing[m.field]) === String(m.value))
    .map(m => `${m.field === 'phone' ? 'Phone Number' : m.field === 'nationalId' ? 'National ID' : 'Email'} "${m.value}"`);

  return {
    existing,
    matchedFields
  };
}

module.exports = { checkDuplicate };
