const { sequelize } = require('../../../config/db');
const { getEthiopianYear, getEthiopianMonth } = require('../../../utils/ethiopianCalendar');

class RetentionTool {
  /**
   * Calculates retention indices based on payment frequency.
   * A member is "retained" if they paid in the last 6 months.
   */
  static async getRetentionRate(user) {
    const Q = sequelize.QueryTypes.SELECT;
    const year = getEthiopianYear();
    const month = getEthiopianMonth();
    const esc = (val) => sequelize.escape(val);

    let scopeClause = '';
    if (user && user.role === 'sector_officer' && user.sectorUnitId) {
      scopeClause = ` AND m.sectorUnitId = ${esc(user.sectorUnitId)} `;
    }

    // 1. Total Active Members
    const [activeRow] = await sequelize.query(`
      SELECT COUNT(*) AS count FROM members m 
      WHERE m.status = 'Active' ${scopeClause}
    `, { type: Q });
    const totalActive = Number(activeRow.count);

    if (totalActive === 0) {
      return { retentionRate: 100, retainedMembers: 0, totalActiveMembers: 0, inactiveRiskCount: 0 };
    }

    // 2. Members who made a payment in the last 6 periods
    // We compute threshold (6 months ago)
    let thresholdMonth = month - 6;
    let thresholdYear = year;
    if (thresholdMonth <= 0) {
      thresholdMonth = 13 + thresholdMonth; // wrap to previous Ethiopian year
      thresholdYear = year - 1;
    }

    const [paidRow] = await sequelize.query(`
      SELECT COUNT(DISTINCT p.memberDbId) AS count
      FROM payments p
      JOIN members m ON p.memberDbId = m.id
      WHERE m.status = 'Active' AND p.status = 'Paid'
        AND (p.periodYear > ${esc(thresholdYear)} OR (p.periodYear = ${esc(thresholdYear)} AND p.periodMonth >= ${esc(thresholdMonth)}))
        ${scopeClause.replace(/m\./g, 'm.')}
    `, { type: Q });
    const retainedCount = Number(paidRow.count);
    const retentionRate = Math.round((retainedCount / totalActive) * 100);
    const riskCount = totalActive - retainedCount;

    return {
      retentionRate: Math.min(100, retentionRate),
      retainedMembers: retainedCount,
      totalActiveMembers: totalActive,
      inactiveRiskCount: riskCount,
      riskLevel: retentionRate >= 85 ? 'Low Risk' : retentionRate >= 60 ? 'Medium Risk' : 'High Risk'
    };
  }

  /**
   * Retrieves chronological user growth indices.
   */
  static async getGrowthHistory(user) {
    const Q = sequelize.QueryTypes.SELECT;
    const esc = (val) => sequelize.escape(val);

    let scopeClause = '';
    if (user && user.role === 'sector_officer' && user.sectorUnitId) {
      scopeClause = ` AND m.sectorUnitId = ${esc(user.sectorUnitId)} `;
    }

    // Chronological registration counts per month/year (grouped by standard calendar months of date)
    const rows = await sequelize.query(`
      SELECT YEAR(m.registrationDate) AS regYear, MONTH(m.registrationDate) AS regMonth, COUNT(*) AS count
      FROM members m
      WHERE m.registrationDate IS NOT NULL ${scopeClause}
      GROUP BY regYear, regMonth
      ORDER BY regYear ASC, regMonth ASC
      LIMIT 12
    `, { type: Q });

    return rows.map(r => ({
      period: `${r.regMonth}/${r.regYear}`,
      count: Number(r.count)
    }));
  }
}

module.exports = RetentionTool;
