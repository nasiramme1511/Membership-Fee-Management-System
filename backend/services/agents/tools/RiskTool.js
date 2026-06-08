const { sequelize } = require('../../../config/db');
const { getEthiopianYear, getEthiopianMonth } = require('../../../utils/ethiopianCalendar');

class RiskTool {
  /**
   * Evaluates all sectors and returns risk metrics.
   * Scopes response to a single sector if user is sector_officer.
   */
  static async getSectorRiskScores(user, customYear = null, customMonth = null) {
    const Q = sequelize.QueryTypes.SELECT;
    const year = customYear || getEthiopianYear();
    const month = customMonth || getEthiopianMonth();
    const esc = (val) => sequelize.escape(val);

    let secFilter = '';
    if (user && user.role === 'sector_officer' && user.sectorUnitId) {
      secFilter = ` AND su.id = ${esc(user.sectorUnitId)} `;
    }

    const rows = await sequelize.query(`
      SELECT 
        su.id AS sectorId,
        su.name AS sectorName,
        COUNT(DISTINCT m.id) AS totalMembers,
        COUNT(DISTINCT paid_p.memberDbId) AS paidMembers,
        COALESCE(SUM(paid_p.amount), 0) AS totalRevenue,
        CASE 
          WHEN COUNT(DISTINCT m.id) > 0 
          THEN ROUND((COUNT(DISTINCT paid_p.memberDbId) / COUNT(DISTINCT m.id)) * 100)
          ELSE 0 
        END AS collectionRate
      FROM members m
      JOIN sector_units su ON m.sectorUnitId = su.id
      LEFT JOIN (
        SELECT memberDbId, SUM(amount) AS amount
        FROM payments 
        WHERE status = 'Paid' AND periodMonth = ${esc(month)} AND periodYear = ${esc(year)}
        GROUP BY memberDbId
      ) paid_p ON m.id = paid_p.memberDbId
      WHERE m.status = 'Active' ${secFilter}
      GROUP BY su.id, su.name
    `, { type: Q });

    const riskReport = rows.map(r => {
      const collectionRate = Number(r.collectionRate);
      const riskScore = 100 - collectionRate;
      let riskLevel = 'Low';
      if (riskScore > 40) riskLevel = 'High';
      else if (riskScore > 15) riskLevel = 'Medium';

      return {
        sectorId: r.sectorId,
        sectorName: r.sectorName,
        totalMembers: r.totalMembers,
        paidMembers: r.paidMembers,
        collectionRate,
        riskScore,
        riskLevel
      };
    }).sort((a, b) => b.riskScore - a.riskScore); // descending risk

    return riskReport;
  }
}

module.exports = RiskTool;
