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

// ─── Build member filter conditions (for queries starting FROM members) ─────
function buildMemberConditions(sequelize, filters = {}) {
  const { sectorId, sectorType, memberCategoryId } = filters;
  const conds = [];

  if (sectorId) {
    conds.push(`m.sectorUnitId = ${sequelize.escape(sectorId)}`);
  }
  if (memberCategoryId) {
    conds.push(`m.memberCategoryId = ${sequelize.escape(memberCategoryId)}`);
  }
  if (sectorType) {
    conds.push(`m.sectorUnitId IN (SELECT id FROM sector_units WHERE sectorTypeId = (SELECT id FROM sector_types WHERE name = ${sequelize.escape(sectorType)}))`);
  }

  return conds.length > 0 ? ' AND ' + conds.join(' AND ') : '';
}

// ─── Monthly Revenue Report ────────────────────────────────────────────────────
exports.monthlyRevenue = async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const Q = sequelize.QueryTypes.SELECT;
    const currentMonth = Number(req.query.month) || getEthiopianMonth();
    const currentYear  = Number(req.query.year)  || getEthiopianYear();
    const filters = {
      sectorId: req.query.sectorId,
      sectorType: req.query.sectorType,
      memberCategoryId: req.query.memberCategoryId
    };
    const { pWhere } = buildScope(sequelize, filters);
    const memberConds = buildMemberConditions(sequelize, filters);

    const [summary] = await sequelize.query(
      `SELECT COALESCE(SUM(p.amount),0) AS totalRevenue,
              COUNT(*)                  AS totalPayments,
              COALESCE(AVG(p.amount),0) AS avgPayment
       FROM payments p 
       JOIN members m ON p.memberDbId = m.id
       WHERE p.status = 'Paid' AND p.periodMonth = ? AND p.periodYear = ? ${pWhere}`,
      { replacements: [currentMonth, currentYear], type: Q }
    );

    const byType = await sequelize.query(
      `SELECT m.membershipType AS _id,
              SUM(p.amount)    AS totalRevenue,
              COUNT(*)         AS count
       FROM payments p
       JOIN members m ON p.memberDbId = m.id
       WHERE p.status = 'Paid' AND p.periodMonth = ? AND p.periodYear = ? ${pWhere}
       GROUP BY m.membershipType`,
      { replacements: [currentMonth, currentYear], type: Q }
    );

    // Show ALL sector units with members matching the filter, with 0 for unpaid
    const byBranch = await sequelize.query(
      `SELECT COALESCE(su.name, m.sector, m.branch) AS _id,
              COALESCE(SUM(p.amount), 0) AS totalRevenue,
              COUNT(p.id) AS count
       FROM members m
       LEFT JOIN sector_units su ON m.sectorUnitId = su.id
       LEFT JOIN payments p ON p.memberDbId = m.id AND p.periodMonth = ? AND p.periodYear = ? AND p.status = 'Paid'
       WHERE m.status = 'Active' ${memberConds}
       GROUP BY COALESCE(su.name, m.sector, m.branch)
       ORDER BY totalRevenue DESC`,
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
       WHERE p.status = 'Paid' AND p.periodMonth = ? AND p.periodYear = ? ${pWhere}
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
       WHERE p.status = 'Paid' AND p.periodYear = ? ${pWhere}
       GROUP BY p.periodMonth
       ORDER BY p.periodMonth ASC`,
      { replacements: [currentYear], type: Q }
    );

    // Fill in all 13 Ethiopian months, defaulting to 0 for unpaid months
    const fullYearlyData = [];
    for (let m = 1; m <= 13; m++) {
      const existing = yearlyData.find(d => Number(d._id) === m);
      fullYearlyData.push({
        _id: m,
        monthlyRevenue: existing ? Number(existing.monthlyRevenue) : 0,
        payments: existing ? Number(existing.payments) : 0
      });
    }

    const totalRevenue  = fullYearlyData.reduce((s, d) => s + d.monthlyRevenue, 0);
    const totalPayments = fullYearlyData.reduce((s, d) => s + d.payments, 0);

    res.json({
      success: true,
      data: { year: currentYear, totalRevenue, totalPayments, monthlyBreakdown: fullYearlyData }
    });
  } catch (error) {
    console.error('yearlyRevenue error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Quarterly Revenue Report ──────────────────────────────────────────────────
exports.quarterlyRevenue = async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const Q = sequelize.QueryTypes.SELECT;
    const currentYear = Number(req.query.year) || getEthiopianYear();
    const { pWhere } = buildScope(sequelize, {
      sectorId: req.query.sectorId,
      sectorType: req.query.sectorType,
      memberCategoryId: req.query.memberCategoryId
    });

    const quarterlyData = await sequelize.query(
      `SELECT
          CASE
            WHEN p.periodMonth BETWEEN 1 AND 3 THEN 'Q1'
            WHEN p.periodMonth BETWEEN 4 AND 6 THEN 'Q2'
            WHEN p.periodMonth BETWEEN 7 AND 9 THEN 'Q3'
            WHEN p.periodMonth BETWEEN 10 AND 13 THEN 'Q4'
          END AS _id,
          SUM(p.amount) AS totalRevenue,
          COUNT(*)      AS totalPayments
       FROM payments p
       JOIN members m ON p.memberDbId = m.id
       WHERE p.status = 'Paid' AND p.periodYear = ? ${pWhere}
       GROUP BY _id
       ORDER BY _id`,
      { replacements: [currentYear], type: Q }
    );

    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const fullData = quarters.map(q => {
      const found = quarterlyData.find(d => d._id === q);
      return {
        _id: q,
        totalRevenue: found ? Number(found.totalRevenue) : 0,
        totalPayments: found ? Number(found.totalPayments) : 0
      };
    });

    const totalRevenue  = fullData.reduce((s, d) => s + d.totalRevenue, 0);
    const totalPayments = fullData.reduce((s, d) => s + d.totalPayments, 0);

    res.json({
      success: true,
      data: { year: currentYear, totalRevenue, totalPayments, quarterlyBreakdown: fullData }
    });
  } catch (error) {
    console.error('quarterlyRevenue error:', error.message);
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

// ─── Sector-Based Payment Report ────────────────────────────────────────────────
exports.sectorReport = async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const Q = sequelize.QueryTypes.SELECT;

    const month = Number(req.query.month) || getEthiopianMonth();
    const year  = Number(req.query.year)  || getEthiopianYear();
    const { unitId, categoryId, paymentStatus } = req.query;

    // Role-based access: sector_officer can only see their own sector
    let effectiveSectorId = req.query.sectorId;
    if (req.user.role === 'sector_officer') {
      if (!req.user.sectorUnitId) {
        return res.status(403).json({ success: false, message: 'No assigned sector.' });
      }
      effectiveSectorId = req.user.sectorUnitId;
    }

    // Build member filter conditions
    const mConds = [`m.status = 'Active'`];
    const replacements = [month, year];

    if (effectiveSectorId) {
      mConds.push(`m.sectorUnitId = ${sequelize.escape(effectiveSectorId)}`);
    }
    if (unitId) {
      mConds.push(`(m.sectorUnitId = ${sequelize.escape(unitId)} OR m.sectorUnitId IN (SELECT id FROM sector_units WHERE parentId = ${sequelize.escape(unitId)}))`);
    }
    if (categoryId) {
      mConds.push(`m.memberCategoryId = ${sequelize.escape(categoryId)}`);
    }

    const memberWhere = mConds.join(' AND ');

    const rows = await sequelize.query(`
      SELECT
        su.id AS sectorId,
        su.name AS sectorName,
        COUNT(DISTINCT m.id) AS totalMembers,
        COUNT(DISTINCT paid_p.memberDbId) AS paidMembers,
        COUNT(DISTINCT m.id) - COUNT(DISTINCT paid_p.memberDbId) AS unpaidMembers,
        COALESCE(SUM(paid_p.amount), 0) AS totalRevenue
      FROM members m
      JOIN sector_units su ON m.sectorUnitId = su.id
      LEFT JOIN (
        SELECT memberDbId, SUM(amount) AS amount
        FROM payments
        WHERE status = 'Paid' AND periodMonth = ? AND periodYear = ?
        GROUP BY memberDbId
      ) paid_p ON m.id = paid_p.memberDbId
      WHERE ${memberWhere}
      GROUP BY su.id, su.name
      ORDER BY su.name
    `, { replacements, type: Q });

    let sectors = rows.map(row => ({
      sectorId: row.sectorId,
      sectorName: row.sectorName,
      totalMembers: Number(row.totalMembers),
      paidMembers: Number(row.paidMembers),
      unpaidMembers: Number(row.unpaidMembers),
      totalRevenue: Number(row.totalRevenue),
      paymentPercentage: row.totalMembers > 0
        ? Math.round((Number(row.paidMembers) / Number(row.totalMembers)) * 100)
        : 0
    }));

    // Apply payment status filter at the sector level
    if (paymentStatus === 'paid') {
      sectors = sectors.filter(s => s.paidMembers > 0);
    } else if (paymentStatus === 'unpaid') {
      sectors = sectors.filter(s => s.unpaidMembers > 0);
    }

    // Overall summary
    const totals = sectors.reduce((acc, s) => ({
      totalMembers: acc.totalMembers + s.totalMembers,
      totalPaidMembers: acc.totalPaidMembers + s.paidMembers,
      totalUnpaidMembers: acc.totalUnpaidMembers + s.unpaidMembers,
      totalRevenue: acc.totalRevenue + s.totalRevenue
    }), { totalMembers: 0, totalPaidMembers: 0, totalUnpaidMembers: 0, totalRevenue: 0 });

    const summary = {
      ...totals,
      overallCollectionRate: totals.totalMembers > 0
        ? Math.round((totals.totalPaidMembers / totals.totalMembers) * 100)
        : 0
    };

    res.json({
      success: true,
      data: {
        period: { month, year },
        sectors,
        summary
      }
    });
  } catch (error) {
    console.error('sectorReport error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Export all data ───────────────────────────────────────────────────────────
exports.exportAllData = async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const Op = require('sequelize').Op;
    const { sectorId, sectorType, memberCategoryId, paymentStatus } = req.query;
    const currentMonth = Number(req.query.month) || getEthiopianMonth();
    const currentYear  = Number(req.query.year)  || getEthiopianYear();
    const where = {};
    if (memberCategoryId) where.memberCategoryId = memberCategoryId;
    if (sectorType) {
      const units = await sequelize.query(
        `SELECT id FROM sector_units WHERE sectorTypeId = (SELECT id FROM sector_types WHERE name = ?)`,
        { replacements: [sectorType], type: sequelize.QueryTypes.SELECT }
      );
      where.sectorUnitId = { [Op.in]: units.map(u => u.id) };
    }
    if (sectorId) where.sectorUnitId = sectorId;

    // paymentStatus filter: restrict members who have/haven't paid for the current period
    if (paymentStatus === 'paid') {
      const paidMemberIds = await Payment.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('memberDbId')), 'memberDbId']],
        where: { status: 'Paid', periodMonth: currentMonth, periodYear: currentYear },
        raw: true
      });
      const paidIds = paidMemberIds.map(p => p.memberDbId);
      if (paidIds.length === 0) {
        return res.json({ success: true, data: { members: [], payments: [], receipts: [], exportedAt: new Date() } });
      }
      where.id = { [Op.in]: paidIds };
    } else if (paymentStatus === 'unpaid') {
      const paidMemberIds = await Payment.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('memberDbId')), 'memberDbId']],
        where: { status: 'Paid', periodMonth: currentMonth, periodYear: currentYear },
        raw: true
      });
      const paidIds = paidMemberIds.map(p => p.memberDbId);
      if (paidIds.length > 0) {
        where.id = { [Op.notIn]: paidIds };
      }
      // also exclude inactive members
      where.status = 'Active';
    }

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
    console.error('exportAllData error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
