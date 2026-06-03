const { sequelize } = require('../config/db');

const VALIDATION_THRESHOLD = 1.10;

async function getExpectedRevenue(sectorUnitId, billingMonth, billingYear) {
  const [rows] = await sequelize.query(`
    SELECT COUNT(*) AS memberCount,
           COALESCE(SUM(contributionMonthlyFee), 0) AS expectedAmount
    FROM members
    WHERE sectorUnitId = ? AND status = 'Active'
  `, { replacements: [Number(sectorUnitId)] });
  return {
    memberCount: Number(rows[0].memberCount),
    expectedAmount: Number(rows[0].expectedAmount)
  };
}

async function getCollectedPayments(sectorUnitId, billingMonth, billingYear) {
  const [rows] = await sequelize.query(`
    SELECT COUNT(DISTINCT p.memberDbId) AS paidMemberCount,
           COALESCE(SUM(p.amount), 0) AS collectedAmount
    FROM payments p
    JOIN members m ON p.memberDbId = m.id
    WHERE m.sectorUnitId = ?
      AND p.periodMonth = ?
      AND p.periodYear = ?
      AND p.status = 'Paid'
  `, { replacements: [Number(sectorUnitId), Number(billingMonth), Number(billingYear)] });
  return {
    paidMemberCount: Number(rows[0].paidMemberCount),
    collectedAmount: Number(rows[0].collectedAmount)
  };
}

async function getApprovedDeposits(sectorUnitId, billingMonth, billingYear) {
  const [rows] = await sequelize.query(`
    SELECT COALESCE(SUM(totalAmount), 0) AS approvedDeposits
    FROM sector_payments
    WHERE sectorUnitId = ?
      AND billingMonth = ?
      AND billingYear = ?
      AND approvalStatus = 'APPROVED'
  `, { replacements: [Number(sectorUnitId), Number(billingMonth), Number(billingYear)] });
  return { approvedDeposits: Number(rows[0].approvedDeposits) };
}

async function isPeriodClosed(sectorUnitId, billingMonth, billingYear) {
  const [rows] = await sequelize.query(`
    SELECT COUNT(*) AS cnt FROM monthly_closings
    WHERE sectorUnitId = ? AND billingMonth = ? AND billingYear = ?
  `, { replacements: [Number(sectorUnitId), Number(billingMonth), Number(billingYear)] });
  return Number(rows[0].cnt) > 0;
}

async function validateSectorFinance(sectorUnitId, billingMonth, billingYear, depositAmount) {
  const { memberCount, expectedAmount } = await getExpectedRevenue(sectorUnitId, billingMonth, billingYear);
  const { paidMemberCount, collectedAmount } = await getCollectedPayments(sectorUnitId, billingMonth, billingYear);
  const { approvedDeposits } = await getApprovedDeposits(sectorUnitId, billingMonth, billingYear);
  const closed = await isPeriodClosed(sectorUnitId, billingMonth, billingYear);

  const numDeposit = Number(depositAmount);
  const hasDeposit = !isNaN(numDeposit) && numDeposit > 0;
  const totalDeposited = approvedDeposits + (hasDeposit ? numDeposit : 0);
  const remainingBalance = collectedAmount === 0 ? null : (collectedAmount - totalDeposited);
  const memberCollectionRate = memberCount > 0 ? Math.round((paidMemberCount / memberCount) * 100) : 0;

  const warnings = [];
  let validationStatus;
  let validationDifference = null;

  if (!hasDeposit) {
    validationStatus = 'INFO';
  } else if (closed) {
    validationStatus = 'FLAGGED';
    warnings.push('This period is closed. New deposits are not allowed.');
  } else if (numDeposit > collectedAmount && collectedAmount > 0) {
    validationStatus = 'FLAGGED';
    warnings.push(`Deposit (ETB ${numDeposit.toLocaleString()}) exceeds amount collected from members (ETB ${collectedAmount.toLocaleString()}).`);
  } else if (collectedAmount > expectedAmount && expectedAmount > 0) {
    validationStatus = 'FLAGGED';
    warnings.push(`Collected amount (ETB ${collectedAmount.toLocaleString()}) exceeds expected revenue (ETB ${expectedAmount.toLocaleString()}). Data inconsistency detected.`);
  } else if (remainingBalance < 0 && collectedAmount > 0) {
    validationStatus = 'FLAGGED';
    warnings.push(`Remaining balance is negative (ETB ${remainingBalance.toLocaleString()}). Deposits exceed collected amount.`);
  } else if (hasDeposit && collectedAmount === 0) {
    validationStatus = 'WARNING';
    warnings.push('No member payment records have been entered for this billing period. This deposit can still be submitted and requires administrator verification against the uploaded bank receipt.');
  } else if (numDeposit > expectedAmount && expectedAmount > 0) {
    const ratio = numDeposit / expectedAmount;
    if (ratio >= VALIDATION_THRESHOLD) {
      validationStatus = 'FLAGGED';
      warnings.push(`Deposit exceeds expected revenue by more than ${Math.round((VALIDATION_THRESHOLD - 1) * 100)}%.`);
    } else {
      validationStatus = 'WARNING';
      warnings.push(`Deposit (ETB ${numDeposit.toLocaleString()}) slightly exceeds expected revenue (ETB ${expectedAmount.toLocaleString()}).`);
    }
  } else if (expectedAmount > 0 && numDeposit !== expectedAmount) {
    validationStatus = 'WARNING';
    warnings.push(`Deposit (ETB ${numDeposit.toLocaleString()}) differs from expected revenue (ETB ${expectedAmount.toLocaleString()}).`);
  } else {
    validationStatus = 'VALID';
  }

  if (hasDeposit) {
    if (collectedAmount === 0) {
      validationDifference = null;
    } else {
      validationDifference = numDeposit - collectedAmount;
    }
  }

  return {
    totalMembers: memberCount,
    paidMembers: paidMemberCount,
    expectedRevenue: expectedAmount,
    collectedAmount,
    approvedDeposits,
    depositAmount: hasDeposit ? numDeposit : 0,
    totalDeposited,
    remainingBalance,
    validationDifference,
    validationStatus,
    memberCollectionRate,
    isClosed: closed,
    warnings
  };
}

module.exports = {
  getExpectedRevenue,
  getCollectedPayments,
  getApprovedDeposits,
  validateSectorFinance,
  isPeriodClosed
};
