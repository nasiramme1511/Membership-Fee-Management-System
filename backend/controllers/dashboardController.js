// controllers/dashboardController.js - Dashboard Controller (MySQL / Sequelize)
const Member  = require('../models/Member');
const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');
const SectorPayment = require('../models/SectorPayment');
const { getEthiopianYear, getEthiopianMonth } = require('../utils/ethiopianCalendar');

exports.getDashboardStats = async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const Q = sequelize.QueryTypes.SELECT;

    const currentYear  = getEthiopianYear();
    const currentMonth = getEthiopianMonth();

    // ── Sector scoping ─────────────────────────────────────────────────────────
    // scopeSector middleware injects req.query.sectorId for sector_officer role
    const sectorId = req.query.sectorId;
    const esc      = sectorId ? sequelize.escape(sectorId) : null;

    // For queries on 'members' table directly (no alias)
    const memberWhere  = sectorId ? ` AND sectorUnitId = ${esc} ` : '';
    // For queries where members is aliased as 'm'
    const mWhere       = sectorId ? ` AND m.sectorUnitId = ${esc} ` : '';
    // For queries where payments is unaliased — scope via subquery
    const payWhere     = sectorId
      ? ` AND memberDbId IN (SELECT id FROM members WHERE sectorUnitId = ${esc}) `
      : '';
    // For queries where payments is aliased as 'p'
    const pWhere       = sectorId
      ? ` AND p.memberDbId IN (SELECT id FROM members WHERE sectorUnitId = ${esc}) `
      : '';

    // ── Counts ─────────────────────────────────────────────────────────────────
    const [totalRow] = await sequelize.query(
      `SELECT COUNT(*) AS cnt FROM members WHERE 1=1 ${memberWhere}`, { type: Q }
    );
    const totalMembers = Number(totalRow?.cnt) || 0;

    const [activeRow] = await sequelize.query(
      `SELECT COUNT(*) AS cnt FROM members WHERE status = 'Active' ${memberWhere}`, { type: Q }
    );
    const activeMembers = Number(activeRow?.cnt) || 0;

    // payments table has no alias here
    const [paidThisMonthRaw] = await sequelize.query(
      `SELECT COUNT(DISTINCT memberDbId) AS count FROM payments
       WHERE periodYear = ? AND periodMonth = ? ${payWhere}`,
      { replacements: [currentYear, currentMonth], type: Q }
    );
    const paidThisMonth   = Number(paidThisMonthRaw?.count) || 0;
    const pendingPayments = totalMembers - paidThisMonth;

    const [defaulterRaw] = await sequelize.query(`
      SELECT COUNT(*) AS count 
      FROM members m
      LEFT JOIN payments p
        ON m.id = p.memberDbId AND p.periodMonth = ? AND p.periodYear = ? AND p.status = 'Paid'
      WHERE p.id IS NULL AND m.status = 'Active' ${mWhere}
    `, { replacements: [currentMonth, currentYear], type: Q });
    const defaultedMembers = Number(defaulterRaw?.count) || 0;

    // ── Revenue ────────────────────────────────────────────────────────────────
    const [yearlyRow] = await sequelize.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE periodYear = ? ${payWhere}`,
      { replacements: [currentYear], type: Q }
    );
    const [monthlyRow] = await sequelize.query(
      `SELECT COALESCE(SUM(amount),0) AS total FROM payments
       WHERE periodYear = ? AND periodMonth = ? ${payWhere}`,
      { replacements: [currentYear, currentMonth], type: Q }
    );

    // ── Members by type ────────────────────────────────────────────────────────
    const membersByType = await sequelize.query(
      `SELECT membershipType AS _id, COUNT(*) AS count
       FROM members WHERE 1=1 ${memberWhere}
       GROUP BY membershipType`,
      { type: Q }
    );

    // ── Members by Sector Unit ────────────────────────────────────────────────
    const membersByBranch = await sequelize.query(
      `SELECT su.name AS _id, COUNT(*) AS count 
       FROM members m
       LEFT JOIN sector_units su ON m.sectorUnitId = su.id
       WHERE 1=1 ${mWhere}
       GROUP BY su.name`,
      { type: Q }
    );

    // ── Members by Sector Type ────────────────────────────────────────────────
    const membersByCluster = await sequelize.query(
      `SELECT st.name AS _id, COUNT(*) AS count 
       FROM members m
       LEFT JOIN sector_units su ON m.sectorUnitId = su.id
       LEFT JOIN sector_types st ON su.sectorTypeId = st.id
       WHERE 1=1 ${mWhere}
       GROUP BY st.name`,
      { type: Q }
    );

    // ── Members by Sector (ranked) ────────────────────────────────────────────
    const membersBySector = await sequelize.query(
      `SELECT su.name AS _id, COUNT(*) AS count 
       FROM members m
       LEFT JOIN sector_units su ON m.sectorUnitId = su.id
       WHERE m.sectorUnitId IS NOT NULL ${mWhere}
       GROUP BY su.name ORDER BY count DESC`,
      { type: Q }
    );

    // ── Payment trend (last 12 months) ─────────────────────────────────────────
    const paymentTrend = await sequelize.query(
      `SELECT YEAR(paymentDate) AS year, MONTH(paymentDate) AS month,
              SUM(amount) AS revenue, COUNT(*) AS count
       FROM payments
       WHERE paymentDate >= DATE_SUB(NOW(), INTERVAL 12 MONTH) ${payWhere}
       GROUP BY YEAR(paymentDate), MONTH(paymentDate)
       ORDER BY year ASC, month ASC`,
      { type: Q }
    );

    // ── Top contributors (by actual payment amount) ───────────────────────────
    let topContributors;
    if (sectorId) {
      const topRaw = await sequelize.query(
        `SELECT m.fullName, m.memberId, COALESCE(SUM(p.amount),0) AS totalPaid
         FROM members m
         JOIN payments p ON m.id = p.memberDbId AND p.status = 'Paid'
         WHERE m.sectorUnitId = ${esc}
         GROUP BY m.id, m.fullName, m.memberId
         ORDER BY totalPaid DESC
         LIMIT 10`,
        { type: Q }
      );
      topContributors = topRaw.map(r => ({
        fullName: r.fullName,
        memberId: r.memberId,
        branch:   '',
        contribution: { monthlyFee: Number(r.totalPaid) || 0 }
      }));
    } else {
      const topRaw = await sequelize.query(
        `SELECT m.fullName, m.memberId, m.sector AS branch,
                COALESCE(SUM(p.amount),0) AS totalPaid
         FROM members m
         JOIN payments p ON m.id = p.memberDbId AND p.status = 'Paid'
         GROUP BY m.id, m.fullName, m.memberId, m.sector
         ORDER BY totalPaid DESC
         LIMIT 10`,
        { type: Q }
      );
      topContributors = topRaw.map(r => ({
        fullName: r.fullName,
        memberId: r.memberId,
        branch:   r.branch || '-',
        contribution: { monthlyFee: Number(r.totalPaid) || 0 }
      }));
    }

    // ── Revenue by member type ─────────────────────────────────────────────────
    const revenueByType = await sequelize.query(
      `SELECT m.membershipType AS _id, SUM(p.amount) AS totalRevenue
       FROM payments p
       JOIN members m ON p.memberDbId = m.id
       WHERE 1=1 ${pWhere}
       GROUP BY m.membershipType`,
      { type: Q }
    );

    // ── Sector Payment Metrics ──────────────────────────────────────────────────
    // TEMPORARY: Deposit dashboard metrics disabled until reconciliation module is finalized
    // All deposit values are hardcoded to 0. Sector payments records remain untouched.
    const pendingDepositsAmount  = 0;
    const approvedDepositsAmount = 0;
    const rejectedDepositsAmount  = 0;
    const pendingDepositsCount   = 0;
    const approvedDepositsCount  = 0;
    const rejectedDepositsCount  = 0;
    const totalDepositedSector   = 0;

    // ── Sector-specific metrics (always computed for scoped view) ──────────────
    const [sectorExpectedRow] = await sequelize.query(
      `SELECT COALESCE(SUM(contributionMonthlyFee), 0) AS expectedAmount
       FROM members WHERE status = 'Active' ${memberWhere}`,
      { type: Q }
    );
    const sectorExpectedRevenue = Number(sectorExpectedRow?.expectedAmount) || 0;

    const [sectorCollectedRow] = await sequelize.query(
      `SELECT COALESCE(SUM(p.amount), 0) AS collectedAmount
       FROM payments p
       JOIN members m ON p.memberDbId = m.id
       WHERE p.status = 'Paid' ${mWhere}`,
      { type: Q }
    );
    const sectorCollectedAmount = Number(sectorCollectedRow?.collectedAmount) || 0;

    const [sectorMembersRow] = await sequelize.query(
      `SELECT COUNT(*) AS cnt FROM members WHERE status = 'Active' ${memberWhere}`,
      { type: Q }
    );
    const sectorTotalMembers = Number(sectorMembersRow?.cnt) || 0;

    const [sectorPaidRow] = await sequelize.query(
      `SELECT COUNT(DISTINCT p.memberDbId) AS cnt
       FROM payments p
       JOIN members m ON p.memberDbId = m.id
       WHERE p.status = 'Paid' AND m.status = 'Active' ${mWhere}`,
      { type: Q }
    );
    const sectorPaidMembers = Number(sectorPaidRow?.cnt) || 0;
    const sectorUnpaidMembers = sectorTotalMembers - sectorPaidMembers;

    const remainingBalanceSector = 0; // TEMPORARY: disabled until reconciliation is finalized
    const sectorCollectionRate = sectorTotalMembers > 0 ? Math.round((sectorPaidMembers / sectorTotalMembers) * 100) : 0;

    // ── Members by Category (for sector officer view) ──────────────────────────
    const membersByCategory = await sequelize.query(
      `SELECT COALESCE(mc.name, m.membershipType) AS _id, COUNT(*) AS count
       FROM members m
       LEFT JOIN member_categories mc ON m.memberCategoryId = mc.id
       WHERE 1=1 ${mWhere}
       GROUP BY COALESCE(mc.name, m.membershipType)
       ORDER BY count DESC`,
      { type: Q }
    );

    res.json({
      success: true,
      data: {
        summary: {
          totalMembers,
          activeMembers,
          yearlyRevenue:   Number(yearlyRow?.total)  || 0,
          monthlyRevenue:  Number(monthlyRow?.total) || 0,
          pendingPayments,
          defaultedMembers
        },
        membersByType,
        membersByBranch,
        membersByCluster,
        membersBySector,
        membersByCategory,
        paymentTrend: paymentTrend.map(r => ({
          _id: { year: r.year, month: r.month },
          revenue: Number(r.revenue) || 0,
          count: Number(r.count) || 0
        })),
        topContributors,
        revenueByType,
        sectorPaymentMetrics: {
          pendingDeposits:     pendingDepositsAmount,
          approvedDeposits:    approvedDepositsAmount,
          rejectedDeposits:    rejectedDepositsAmount,
          pendingDepositsCount,
          approvedDepositsCount,
          rejectedDepositsCount,
          totalDeposited:      totalDepositedSector,
          remainingBalance:    remainingBalanceSector,
          collectionRate:      sectorCollectionRate,
          expectedRevenue:     sectorExpectedRevenue,
          collectedAmount:     sectorCollectedAmount,
          totalMembers:        sectorTotalMembers,
          paidMembers:         sectorPaidMembers,
          unpaidMembers:       sectorUnpaidMembers
        },
        scopedToSector: !!sectorId
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGrowthRate = async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const Q = sequelize.QueryTypes.SELECT;
    const currentYear = getEthiopianYear();
    const lastYear    = currentYear - 1;

    const sectorId  = req.query.sectorId;
    const memberWhere = sectorId ? ` AND sectorUnitId = ${sequelize.escape(sectorId)} ` : '';

    const [curr] = await sequelize.query(
      `SELECT COUNT(*) AS cnt FROM members WHERE YEAR(registrationDate) = ? ${memberWhere}`,
      { replacements: [currentYear], type: Q }
    );
    const [last] = await sequelize.query(
      `SELECT COUNT(*) AS cnt FROM members WHERE YEAR(registrationDate) = ? ${memberWhere}`,
      { replacements: [lastYear], type: Q }
    );

    const currentYearMembers = Number(curr?.cnt) || 0;
    const lastYearMembers    = Number(last?.cnt)  || 0;
    const growthRate = lastYearMembers > 0
      ? ((currentYearMembers - lastYearMembers) / lastYearMembers * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: { currentYear, currentYearMembers, lastYearMembers, growthRate: `${growthRate}%` }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
