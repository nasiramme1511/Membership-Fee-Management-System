
const { getEthiopianYear, getEthiopianMonth } = require('../utils/ethiopianCalendar');

function buildScope(table) {
  return function (user) {
    if (user && user.role === 'sector_officer' && user.sectorUnitId) {
      const esc = require('../config/db').sequelize.escape(user.sectorUnitId);
      const prefix = table ? table + '.' : '';
      return ` AND ${prefix}sectorUnitId = ${esc} `;
    }
    return '';
  };
}
const buildSectorScope = buildScope('m');
const buildMembersScope = buildScope('');
const buildPayScope = buildScope('m');


exports.summary = async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const Q = sequelize.QueryTypes.SELECT;
    const year = getEthiopianYear();
    const month = getEthiopianMonth();
    const membersScope = buildMembersScope(req.user);
    const payScope = buildPayScope(req.user);

    const sectorScope = buildSectorScope(req.user);
    console.log(`[analytics] user role=${req.user.role} sectorUnitId=${req.user.sectorUnitId} scope="${sectorScope.trim()}"`);

    const [totalRow] = await sequelize.query(
      `SELECT COUNT(*) AS count FROM members m WHERE m.status = 'Active' ${sectorScope}`, { type: Q }
    );
    const totalMembers = Number(totalRow.count);

    const [paidRow] = await sequelize.query(
      `SELECT COUNT(DISTINCT p.memberDbId) AS count, COALESCE(SUM(p.amount),0) AS total
       FROM payments p JOIN members m ON p.memberDbId = m.id
       WHERE p.periodMonth = ${sequelize.escape(month)} AND p.periodYear = ${sequelize.escape(year)} AND p.status = 'Paid'${payScope}`,
      { type: Q }
    );
    const paidMembers = Number(paidRow.count);
    const totalCollection = Number(paidRow.total);
    const unpaidMembers = totalMembers - paidMembers;
    const completionRate = totalMembers > 0 ? Math.round((paidMembers / totalMembers) * 100) : 0;

    res.json({
      success: true,
      data: { totalMembers, paidMembers, unpaidMembers, totalCollection, completionRate, period: { month, year } }
    });
  } catch (error) {
    console.error('Analytics summary error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sectors = async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const Q = sequelize.QueryTypes.SELECT;
    const year = getEthiopianYear();
    const month = getEthiopianMonth();

    let secFilter = '';
    if (req.user.role === 'sector_officer' && req.user.sectorUnitId) {
      secFilter = ` AND su.id = ${sequelize.escape(req.user.sectorUnitId)} `;
    }

    const rows = await sequelize.query(
      `SELECT su.name AS sector,
              COUNT(DISTINCT m.id) AS members,
              COUNT(DISTINCT paid_p.memberDbId) AS paid,
              COUNT(DISTINCT m.id) - COUNT(DISTINCT paid_p.memberDbId) AS unpaid,
              COALESCE(SUM(paid_p.amount),0) AS collectionAmount,
              CASE WHEN COUNT(DISTINCT m.id) > 0
                THEN ROUND((COUNT(DISTINCT paid_p.memberDbId) / COUNT(DISTINCT m.id)) * 100)
                ELSE 0 END AS collectionRate
       FROM members m
       JOIN sector_units su ON m.sectorUnitId = su.id
       LEFT JOIN (
         SELECT memberDbId, SUM(amount) AS amount
         FROM payments WHERE status = 'Paid'
         AND periodMonth = ${sequelize.escape(month)} AND periodYear = ${sequelize.escape(year)}
         GROUP BY memberDbId
       ) paid_p ON m.id = paid_p.memberDbId
       WHERE m.status = 'Active' ${secFilter}
       GROUP BY su.id, su.name
       ORDER BY collectionRate DESC`,
      { type: Q }
    );

    res.json({ success: true, data: rows, period: { month, year } });
  } catch (error) {
    console.error('Analytics sectors error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.monthly = async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const Q = sequelize.QueryTypes.SELECT;
    const year = Number(req.query.year) || getEthiopianYear();
    const payScope = buildPayScope(req.user);

    const rows = await sequelize.query(
      `SELECT p.periodMonth AS month, COALESCE(SUM(p.amount),0) AS amount, COUNT(DISTINCT p.memberDbId) AS payers
       FROM payments p JOIN members m ON p.memberDbId = m.id
       WHERE p.periodYear = ${sequelize.escape(year)} AND p.status = 'Paid'${payScope.replace(/p\./g, 'p.')}
       GROUP BY p.periodMonth
       ORDER BY p.periodMonth ASC`,
      { type: Q }
    );

    const months = [];
    for (let m = 1; m <= 13; m++) {
      const found = rows.find(r => Number(r.month) === m);
      months.push({
        month: m,
        amount: found ? Number(found.amount) : 0,
        payers: found ? Number(found.payers) : 0
      });
    }

    res.json({ success: true, data: months, year });
  } catch (error) {
    console.error('Analytics monthly error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.unpaidMembers = async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const Q = sequelize.QueryTypes.SELECT;
    const year = getEthiopianYear();
    const month = getEthiopianMonth();
    const memberAliasScope = buildSectorScope(req.user);

    const rows = await sequelize.query(
      `SELECT m.id, m.fullName, m.memberId, m.phone, m.sectorUnitId, su.name AS sectorUnitName
       FROM members m
       LEFT JOIN sector_units su ON m.sectorUnitId = su.id
       LEFT JOIN payments p ON m.id = p.memberDbId AND p.periodMonth = ${sequelize.escape(month)}
         AND p.periodYear = ${sequelize.escape(year)} AND p.status = 'Paid'
       WHERE p.id IS NULL AND m.status = 'Active' ${memberAliasScope}
       ORDER BY m.fullName ASC`,
      { type: Q }
    );

    res.json({ success: true, data: rows, total: rows.length });
  } catch (error) {
    console.error('Analytics unpaid error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.overdueMembers = async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const Q = sequelize.QueryTypes.SELECT;
    const year = getEthiopianYear();
    const month = getEthiopianMonth();
    const memberAliasScope = buildSectorScope(req.user);

    const rows = await sequelize.query(
      `SELECT m.id, m.fullName, m.memberId, m.phone, m.contributionMonthlyFee, m.sectorUnitId, su.name AS sectorUnitName
       FROM members m
       LEFT JOIN sector_units su ON m.sectorUnitId = su.id
       WHERE m.status = 'Active' AND m.id NOT IN (
         SELECT p.memberDbId FROM payments p
         WHERE p.status = 'Paid' AND p.periodYear = ${sequelize.escape(year)}
         AND p.periodMonth >= ${sequelize.escape(Math.max(1, month - 3))}
       ) ${memberAliasScope}
       ORDER BY m.contributionMonthlyFee DESC`,
      { type: Q }
    );

    const totalOutstanding = rows.reduce((s, r) => s + (Number(r.contributionMonthlyFee) || 0), 0);

    res.json({ success: true, data: rows, total: rows.length, totalOutstanding });
  } catch (error) {
    console.error('Analytics overdue error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
