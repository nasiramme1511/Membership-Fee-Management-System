const { sequelize } = require('../../../config/db');

class SectorMembershipTool {
  /**
   * Retrieves active member counts per sector.
   * Scopes response to a single sector if user is sector_officer.
   */
  static async getSectorMemberDistribution(user) {
    const Q = sequelize.QueryTypes.SELECT;
    const esc = (val) => sequelize.escape(val);

    let secFilter = '';
    if (user && user.role === 'sector_officer' && user.sectorUnitId) {
      secFilter = ` AND su.id = ${esc(user.sectorUnitId)} `;
    }

    const rows = await sequelize.query(`
      SELECT su.name AS name, COUNT(m.id) AS value
      FROM members m
      JOIN sector_units su ON m.sectorUnitId = su.id
      WHERE m.status = 'Active' ${secFilter}
      GROUP BY su.id, su.name
      ORDER BY value DESC
    `, { type: Q });

    return rows;
  }
}

module.exports = SectorMembershipTool;
