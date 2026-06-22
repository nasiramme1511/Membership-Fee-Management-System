// utils/memberIdGenerator.js
// Generates unique member IDs with automatic duplicate checking and retry.
const { getEthiopianYear } = require('./ethiopianCalendar');

let Member = null;

function getModel() {
  if (!Member) Member = require('../models/Member');
  return Member;
}

function generateRawId() {
  const year = getEthiopianYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `DD-${year}-${rand}`;
}

async function generateMemberId(maxRetries = 10) {
  const model = getModel();
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const candidate = generateRawId();
    const existing = await model.findOne({ where: { memberId: candidate }, attributes: ['id'] });
    if (!existing) return candidate;
  }
  const fallback = `DD-${getEthiopianYear()}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  return fallback;
}

module.exports = { generateMemberId, generateRawId };
