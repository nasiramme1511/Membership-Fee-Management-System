const { sequelize } = require('../../../config/db');
const { getEthiopianYear, getEthiopianMonth } = require('../../../utils/ethiopianCalendar');

class RevenueTool {
  /**
   * Retrieves overall revenue statistics, top sources, and distributions.
   * Enforces role-based sector unit constraints.
   */
  static async getSummary(user, customYear = null) {
    const Q = sequelize.QueryTypes.SELECT;
    const year = customYear || getEthiopianYear();
    const month = getEthiopianMonth();
    const esc = (val) => sequelize.escape(val);

    // Role-based scoping
    let scopeClause = '';
    if (user && user.role === 'sector_officer' && user.sectorUnitId) {
      scopeClause = ` AND m.sectorUnitId = ${esc(user.sectorUnitId)} `;
    }

    // 1. Total collections (Month / Year)
    const [monthlyCollection] = await sequelize.query(`
      SELECT COALESCE(SUM(p.amount), 0) AS total, COUNT(DISTINCT p.memberDbId) AS payers
      FROM payments p
      JOIN members m ON p.memberDbId = m.id
      WHERE p.periodMonth = ${esc(month)} AND p.periodYear = ${esc(year)} AND p.status = 'Paid' ${scopeClause.replace(/m\./g, 'm.')}
    `, { type: Q });

    const [yearlyCollection] = await sequelize.query(`
      SELECT COALESCE(SUM(p.amount), 0) AS total, COUNT(DISTINCT p.memberDbId) AS payers
      FROM payments p
      JOIN members m ON p.memberDbId = m.id
      WHERE p.periodYear = ${esc(year)} AND p.status = 'Paid' ${scopeClause.replace(/m\./g, 'm.')}
    `, { type: Q });

    // 2. Top Revenue Sources (Sectors or Categories)
    let topSources = [];
    if (user && user.role === 'sector_officer' && user.sectorUnitId) {
      // For sector officer, top sources are member categories in their sector
      topSources = await sequelize.query(`
        SELECT mc.name AS sourceName, COALESCE(SUM(p.amount), 0) AS revenue
        FROM payments p
        JOIN members m ON p.memberDbId = m.id
        JOIN member_categories mc ON m.memberCategoryId = mc.id
        WHERE p.periodYear = ${esc(year)} AND p.status = 'Paid' ${scopeClause.replace(/m\./g, 'm.')}
        GROUP BY mc.id, mc.name
        ORDER BY revenue DESC
        LIMIT 5
      `, { type: Q });
    } else {
      // For admin/expert, top sources are sector units
      topSources = await sequelize.query(`
        SELECT su.name AS sourceName, COALESCE(SUM(p.amount), 0) AS revenue
        FROM payments p
        JOIN members m ON p.memberDbId = m.id
        JOIN sector_units su ON m.sectorUnitId = su.id
        WHERE p.periodYear = ${esc(year)} AND p.status = 'Paid'
        GROUP BY su.id, su.name
        ORDER BY revenue DESC
        LIMIT 5
      `, { type: Q });
    }

    // 3. Revenue Distribution by Membership Type
    const distribution = await sequelize.query(`
      SELECT m.membershipType AS label, COALESCE(SUM(p.amount), 0) AS value
      FROM payments p
      JOIN members m ON p.memberDbId = m.id
      WHERE p.periodYear = ${esc(year)} AND p.status = 'Paid' ${scopeClause.replace(/m\./g, 'm.')}
      GROUP BY m.membershipType
    `, { type: Q });

    // Calculate growth compared to previous month
    const prevMonth = month === 1 ? 13 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const [prevMonthlyCollection] = await sequelize.query(`
      SELECT COALESCE(SUM(p.amount), 0) AS total
      FROM payments p
      JOIN members m ON p.memberDbId = m.id
      WHERE p.periodMonth = ${esc(prevMonth)} AND p.periodYear = ${esc(prevYear)} AND p.status = 'Paid' ${scopeClause.replace(/m\./g, 'm.')}
    `, { type: Q });

    const currentMTotal = Number(monthlyCollection.total);
    const prevMTotal = Number(prevMonthlyCollection.total);
    let growthRate = 0;
    if (prevMTotal > 0) {
      growthRate = Number((((currentMTotal - prevMTotal) / prevMTotal) * 100).toFixed(2));
    }

    return {
      monthlyRevenue: currentMTotal,
      monthlyPayers: Number(monthlyCollection.payers),
      yearlyRevenue: Number(yearlyCollection.total),
      yearlyPayers: Number(yearlyCollection.payers),
      growthRate,
      topSources,
      distribution,
      period: { month, year }
    };
  }
}

module.exports = RevenueTool;
