const { sequelize } = require('../../../config/db');
const { getEthiopianYear, getEthiopianMonth } = require('../../../utils/ethiopianCalendar');

class PaymentAnalyticsTool {
  /**
   * Aggregates key payment metrics, rates, methods, and trends.
   */
  static async getPaymentAnalytics(user, customYear = null) {
    const Q = sequelize.QueryTypes.SELECT;
    const year = customYear || getEthiopianYear();
    const month = getEthiopianMonth();
    const esc = (val) => sequelize.escape(val);

    let scopeClause = '';
    if (user && user.role === 'sector_officer' && user.sectorUnitId) {
      scopeClause = ` AND m.sectorUnitId = ${esc(user.sectorUnitId)} `;
    }

    // 1. Expected vs Collected (Completion Rate)
    // To estimate expected fees, we sum active members' contribution fees.
    const [expectedRow] = await sequelize.query(`
      SELECT COALESCE(SUM(m.contributionMonthlyFee), 0) AS expected
      FROM members m
      WHERE m.status = 'Active' ${scopeClause}
    `, { type: Q });

    const [collectedRow] = await sequelize.query(`
      SELECT COALESCE(SUM(p.amount), 0) AS collected
      FROM payments p
      JOIN members m ON p.memberDbId = m.id
      WHERE p.periodMonth = ${esc(month)} AND p.periodYear = ${esc(year)} AND p.status = 'Paid' ${scopeClause.replace(/m\./g, 'm.')}
    `, { type: Q });

    const totalExpected = Number(expectedRow.expected);
    const totalCollected = Number(collectedRow.collected);
    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    // 2. Pending Payments Estimator
    // Members with status active who do not have a paid status for the current month/year.
    const [pendingRow] = await sequelize.query(`
      SELECT COALESCE(SUM(m.contributionMonthlyFee), 0) AS pendingTotal, COUNT(DISTINCT m.id) AS pendingCount
      FROM members m
      LEFT JOIN payments p ON m.id = p.memberDbId AND p.periodMonth = ${esc(month)} AND p.periodYear = ${esc(year)} AND p.status = 'Paid'
      WHERE m.status = 'Active' AND p.id IS NULL ${scopeClause}
    `, { type: Q });

    // 3. Payment Methods Distribution
    const methods = await sequelize.query(`
      SELECT p.method AS name, COUNT(*) AS count, COALESCE(SUM(p.amount), 0) AS amount
      FROM payments p
      JOIN members m ON p.memberDbId = m.id
      WHERE p.periodYear = ${esc(year)} AND p.status = 'Paid' ${scopeClause.replace(/m\./g, 'm.')}
      GROUP BY p.method
      ORDER BY count DESC
    `, { type: Q });

    // 4. Monthly Collection Trends
    const trends = await sequelize.query(`
      SELECT p.periodMonth AS month, COALESCE(SUM(p.amount), 0) AS revenue, COUNT(DISTINCT p.memberDbId) AS payersCount
      FROM payments p
      JOIN members m ON p.memberDbId = m.id
      WHERE p.periodYear = ${esc(year)} AND p.status = 'Paid' ${scopeClause.replace(/m\./g, 'm.')}
      GROUP BY p.periodMonth
      ORDER BY p.periodMonth ASC
    `, { type: Q });

    return {
      monthlyMetrics: {
        expected: totalExpected,
        collected: totalCollected,
        collectionRate: Math.min(100, collectionRate),
        pendingAmount: Number(pendingRow.pendingTotal),
        pendingPayers: Number(pendingRow.pendingCount)
      },
      methods,
      trends,
      period: { month, year }
    };
  }
}

module.exports = PaymentAnalyticsTool;
