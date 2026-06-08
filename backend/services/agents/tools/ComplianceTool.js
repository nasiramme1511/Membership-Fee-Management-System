const { sequelize } = require('../../../config/db');
const { getEthiopianYear, getEthiopianMonth } = require('../../../utils/ethiopianCalendar');

class ComplianceTool {
  /**
   * Retrieves members who haven't paid for the current month.
   */
  static async getUnpaidMembers(user, customYear = null, customMonth = null) {
    const Q = sequelize.QueryTypes.SELECT;
    const year = customYear || getEthiopianYear();
    const month = customMonth || getEthiopianMonth();
    const esc = (val) => sequelize.escape(val);

    let scopeClause = '';
    if (user && user.role === 'sector_officer' && user.sectorUnitId) {
      scopeClause = ` AND m.sectorUnitId = ${esc(user.sectorUnitId)} `;
    }

    const rows = await sequelize.query(`
      SELECT m.id, m.fullName, m.memberId, m.phone, su.name AS sectorUnitName, m.contributionMonthlyFee
      FROM members m
      LEFT JOIN sector_units su ON m.sectorUnitId = su.id
      LEFT JOIN payments p ON m.id = p.memberDbId AND p.periodMonth = ${esc(month)} AND p.periodYear = ${esc(year)} AND p.status = 'Paid'
      WHERE p.id IS NULL AND m.status = 'Active' ${scopeClause}
      ORDER BY m.fullName ASC
      LIMIT 100
    `, { type: Q });

    return rows;
  }

  /**
   * Retrieves members who are overdue by 3+ months.
   */
  static async getOverdueMembers(user, customYear = null, customMonth = null) {
    const Q = sequelize.QueryTypes.SELECT;
    const year = customYear || getEthiopianYear();
    const month = customMonth || getEthiopianMonth();
    const esc = (val) => sequelize.escape(val);

    let scopeClause = '';
    if (user && user.role === 'sector_officer' && user.sectorUnitId) {
      scopeClause = ` AND m.sectorUnitId = ${esc(user.sectorUnitId)} `;
    }

    // Limit lookback to past 3 months in the current year
    const minMonth = Math.max(1, month - 3);

    const rows = await sequelize.query(`
      SELECT m.id, m.fullName, m.memberId, m.phone, m.contributionMonthlyFee, su.name AS sectorUnitName
      FROM members m
      LEFT JOIN sector_units su ON m.sectorUnitId = su.id
      WHERE m.status = 'Active' AND m.id NOT IN (
        SELECT DISTINCT p.memberDbId 
        FROM payments p
        WHERE p.status = 'Paid' AND p.periodYear = ${esc(year)} AND p.periodMonth >= ${esc(minMonth)}
      ) ${scopeClause}
      ORDER BY m.contributionMonthlyFee DESC
      LIMIT 100
    `, { type: Q });

    const totalOutstanding = rows.reduce((s, r) => s + (Number(r.contributionMonthlyFee) || 0), 0);

    return {
      overdueList: rows,
      count: rows.length,
      totalOutstanding
    };
  }
}

module.exports = ComplianceTool;
