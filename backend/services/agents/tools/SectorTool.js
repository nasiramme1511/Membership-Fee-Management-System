const { sequelize } = require('../../../config/db');
const { getEthiopianYear, getEthiopianMonth } = require('../../../utils/ethiopianCalendar');

class SectorTool {
  /**
   * Compares all sector units based on members, collections, and rates.
   * Scopes response to a single sector if user is sector_officer.
   */
  static async compareSectors(user, customYear = null, customMonth = null) {
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
        COUNT(DISTINCT m.id) - COUNT(DISTINCT paid_p.memberDbId) AS unpaidMembers,
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
      ORDER BY collectionRate DESC
    `, { type: Q });

    return {
      period: { month, year },
      sectors: rows,
      totalSectorsCount: rows.length
    };
  }

  /**
   * Identifies top and bottom performing sectors.
   */
  static async getPerformanceRanking(user, customYear = null, customMonth = null) {
    const data = await this.compareSectors(user, customYear, customMonth);
    const sorted = [...data.sectors];
    
    return {
      topSectors: sorted.slice(0, 3),
      bottomSectors: sorted.reverse().slice(0, 3)
    };
  }
}

module.exports = SectorTool;
