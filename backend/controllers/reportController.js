// controllers/reportController.js - Report Controller (MySQL / Sequelize)
const Member  = require('../models/Member');
const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');
const { getEthiopianYear, getEthiopianMonth } = require('../utils/ethiopianCalendar');

// ─── Shared helper: build scope strings from filters ─────────────────────────
function buildScope(sequelize, filters = {}) {
  const { sectorId, sectorType, memberCategoryId } = filters;
  const mConds = [];
  const directConds = [];
  let extraJoin = '';

  if (sectorId) {
    const esc = sequelize.escape(sectorId);
    mConds.push(`m.sectorUnitId = ${esc}`);
    directConds.push(`sectorUnitId = ${esc}`);
  }
  if (memberCategoryId) {
    const esc = sequelize.escape(memberCategoryId);
    mConds.push(`m.memberCategoryId = ${esc}`);
    directConds.push(`memberCategoryId = ${esc}`);
  }
  if (sectorType) {
    const esc = sequelize.escape(sectorType);
    extraJoin = ' JOIN sector_units su ON m.sectorUnitId = su.id';
    mConds.push(`su.sectorTypeId = (SELECT id FROM sector_types WHERE name = ${esc})`);
    directConds.push(`sectorUnitId IN (SELECT id FROM sector_units WHERE sectorTypeId = (SELECT id FROM sector_types WHERE name = ${esc}))`);
  }

  const mStr = mConds.length > 0 ? ' AND ' + mConds.join(' AND ') : '';
  const dStr = directConds.length > 0 ? ' AND ' + directConds.join(' AND ') : '';

  return {
    memberWhere: dStr,
    mWhere:      mStr,
    pWhere:      extraJoin + mStr,
    payWhere:    dStr ? ` AND memberDbId IN (SELECT id FROM members WHERE 1=1 ${dStr})` : ''
  };
}

// ─── Monthly Revenue Report ────────────────────────────────────────────────────
exports.monthlyRevenue = async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const Q = sequelize.QueryTypes.SELECT;
    const currentMonth = Number(req.query.month) || getEthiopianMonth();
    const currentYear  = Number(req.query.year)  || getEthiopianYear();
    const { pWhere } = buildScope(sequelize, {
      sectorId: req.query.sectorId,
      sectorType: req.query.sectorType,
      memberCategoryId: req.query.memberCategoryId
    });

    const [summary] = await sequelize.query(
      `SELECT COALESCE(SUM(p.amount),0) AS totalRevenue,
              COUNT(*)                  AS totalPayments,
              COALESCE(AVG(p.amount),0) AS avgPayment
       FROM payments p 
       JOIN members m ON p.memberDbId = m.id
       WHERE p.periodMonth = ? AND p.periodYear = ? ${pWhere}`,
      { replacements: [currentMonth, currentYear], type: Q }
    );

    const byType = await sequelize.query(
      `SELECT m.membershipType AS _id,
              SUM(p.amount)    AS totalRevenue,
              COUNT(*)         AS count
       FROM payments p
       JOIN members m ON p.memberDbId = m.id
       WHERE p.periodMonth = ? AND p.periodYear = ? ${pWhere}
       GROUP BY m.membershipType`,
      { replacements: [currentMonth, currentYear], type: Q }
    );

    const byBranch = await sequelize.query(
      `SELECT COALESCE(su.name, m.sector, m.branch) AS _id,
              SUM(p.amount) AS totalRevenue,
              COUNT(*)      AS count
       FROM payments p
       JOIN members m ON p.memberDbId = m.id
       LEFT JOIN sector_units su ON m.sectorUnitId = su.id
       WHERE p.periodMonth = ? AND p.periodYear = ? ${pWhere}
       GROUP BY COALESCE(su.name, m.sector, m.branch)`,
      { replacements: [currentMonth, currentYear], type: Q }
    );

    // Member category breakdown for sector officer
    const byCategory = await sequelize.query(
      `SELECT COALESCE(mc.name, m.membershipType) AS _id,
              SUM(p.amount) AS totalRevenue,
              COUNT(*)      AS count
       FROM payments p
       JOIN members m ON p.memberDbId = m.id
       LEFT JOIN member_categories mc ON m.memberCategoryId = mc.id
       WHERE p.periodMonth = ? AND p.periodYear = ? ${pWhere}
       GROUP BY COALESCE(mc.name, m.membershipType)
       ORDER BY totalRevenue DESC`,
      { replacements: [currentMonth, currentYear], type: Q }
    );

    res.json({
      success: true,
      data: {
        period: { month: currentMonth, year: currentYear },
        summary: summary || { totalRevenue: 0, totalPayments: 0, avgPayment: 0 },
        byType,
        byBranch,
        byCategory
      }
    });
  } catch (error) {
    console.error('monthlyRevenue error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Yearly Revenue Report ─────────────────────────────────────────────────────
exports.yearlyRevenue = async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const Q = sequelize.QueryTypes.SELECT;
    const currentYear = Number(req.query.year) || getEthiopianYear();
    const { pWhere } = buildScope(sequelize, {
      sectorId: req.query.sectorId,
      sectorType: req.query.sectorType,
      memberCategoryId: req.query.memberCategoryId
    });

    const yearlyData = await sequelize.query(
      `SELECT p.periodMonth AS _id,
              SUM(p.amount) AS monthlyRevenue,
              COUNT(*)      AS payments
       FROM payments p
       JOIN members m ON p.memberDbId = m.id
       WHERE p.periodYear = ? ${pWhere}
       GROUP BY p.periodMonth
       ORDER BY p.periodMonth ASC`,
      { replacements: [currentYear], type: Q }
    );

    const totalRevenue  = yearlyData.reduce((s, d) => s + Number(d.monthlyRevenue), 0);
    const totalPayments = yearlyData.reduce((s, d) => s + Number(d.payments),       0);

    res.json({
      success: true,
      data: { year: currentYear, totalRevenue, totalPayments, monthlyBreakdown: yearlyData }
    });
  } catch (error) {
    console.error('yearlyRevenue error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── HQ vs Branch Distribution ─────────────────────────────────────────────────
exports.hqBranchDistribution = async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const Q = sequelize.QueryTypes.SELECT;
    const currentYear = Number(req.query.year) || getEthiopianYear();
    const { memberWhere } = buildScope(sequelize, {
      sectorId: req.query.sectorId,
      sectorType: req.query.sectorType,
      memberCategoryId: req.query.memberCategoryId
    });

    const [row] = await sequelize.query(
      `SELECT COALESCE(SUM(contributionHqShare),0)     AS totalHQ,
              COALESCE(SUM(contributionBranchShare),0) AS totalBranch
       FROM members WHERE status = 'Active' ${memberWhere}`,
      { type: Q }
    );

    const totalHQ     = Number(row?.totalHQ)     || 0;
    const totalBranch = Number(row?.totalBranch) || 0;
    const grand       = totalHQ + totalBranch;

    res.json({
      success: true,
      data: {
        year: currentYear,
        hqShare:     { amount: totalHQ,     percentage: grand > 0 ? (totalHQ     / grand * 100).toFixed(2) : 0 },
        branchShare: { amount: totalBranch, percentage: grand > 0 ? (totalBranch / grand * 100).toFixed(2) : 0 },
        total: grand
      }
    });
  } catch (error) {
    console.error('hqBranchDistribution error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Defaulter Report ──────────────────────────────────────────────────────────
exports.defaulterReport = async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const Q = sequelize.QueryTypes.SELECT;
    const currentMonth = getEthiopianMonth();
    const currentYear  = getEthiopianYear();
    const { mWhere } = buildScope(sequelize, {
      sectorId: req.query.sectorId,
      sectorType: req.query.sectorType,
      memberCategoryId: req.query.memberCategoryId
    });

    const defaulters = await sequelize.query(`
      SELECT m.*, su.name AS sectorUnitName
      FROM members m
      LEFT JOIN payments p
        ON m.id = p.memberDbId AND p.periodMonth = ? AND p.periodYear = ? AND p.status = 'Paid'
      LEFT JOIN sector_units su ON m.sectorUnitId = su.id
      WHERE p.id IS NULL AND m.status = 'Active' ${mWhere}
      ORDER BY m.contributionMonthlyFee DESC
    `, { replacements: [currentMonth, currentYear], type: Q });

    const totalOutstanding = defaulters.reduce((s, m) => s + (Number(m.contributionMonthlyFee) || 0), 0);

    res.json({
      success: true,
      data: {
        totalDefaulters: defaulters.length,
        totalOutstanding,
        defaulters: defaulters.map(m => ({ ...m, branch: m.sectorUnitName || m.sector || m.branch }))
      }
    });
  } catch (error) {
    console.error('defaulterReport error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Export all data ───────────────────────────────────────────────────────────
exports.exportAllData = async (req, res) => {
  try {
    const { sectorId, sectorType, memberCategoryId } = req.query;
    const where = {};
    if (memberCategoryId) where.memberCategoryId = memberCategoryId;
    if (sectorType) {
      const { sequelize } = require('../config/db');
      const units = await sequelize.query(
        `SELECT id FROM sector_units WHERE sectorTypeId = (SELECT id FROM sector_types WHERE name = ?)`,
        { replacements: [sectorType], type: sequelize.QueryTypes.SELECT }
      );
      where.sectorUnitId = { [require('sequelize').Op.in]: units.map(u => u.id) };
    }
    if (sectorId) where.sectorUnitId = sectorId;

    const rawMembers = await Member.findAll({
      where,
      include: [
        { model: require('../models/SectorUnit'), as: 'sectorUnit', attributes: ['name'] },
        { model: require('../models/MemberCategory'), as: 'memberCategory', attributes: ['name'] }
      ]
    });

    const members = rawMembers.map(m => {
      const data = m.toJSON();
      return {
        'Member ID': data.memberId,
        'Full Name': data.fullName,
        'Gender': data.gender,
        'Phone': data.phone,
        'Sector Unit': data.sectorUnit?.name || data.branch || '-',
        'Member Category': data.memberCategory?.name || '-',
        'Type': data.membershipType,
        'Sub Type': data.subType || '-',
        'Monthly Fee': data.contributionMonthlyFee,
        'Status': data.status,
        'Registration Date': data.registrationDate
      };
    });

    const rawPayments = await Payment.findAll({
      include: [{
        model: Member,
        as: 'memberInfo',
        attributes: ['fullName', 'memberId'],
        include: [{ model: require('../models/SectorUnit'), as: 'sectorUnit', attributes: ['name'] }]
      }]
    });

    const payments = rawPayments.map(p => {
      const data = p.toJSON();
      return {
        'Receipt ID': data.receiptId,
        'Member Name': data.member?.fullName || '-',
        'Member ID': data.memberId,
        'Sector Unit': data.member?.sectorUnit?.name || '-',
        'Amount': data.amount,
        'Method': data.method,
        'Period': `${data.periodMonth}/${data.periodYear}`,
        'Payment Date': data.paymentDate,
        'Status': data.status
      };
    });

    const receipts = await Receipt.findAll();

    res.json({
      success: true,
      data: { members, payments, receipts, exportedAt: new Date() }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
