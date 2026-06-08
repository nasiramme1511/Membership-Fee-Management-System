const { sequelize } = require('../../../config/db');
const { getEthiopianYear, getEthiopianMonth } = require('../../../utils/ethiopianCalendar');

class MemberTool {
  /**
   * Aggregates member counts and statuses.
   */
  static async getMemberCounts(user) {
    const Q = sequelize.QueryTypes.SELECT;
    const esc = (val) => sequelize.escape(val);

    let scopeClause = '';
    if (user && user.role === 'sector_officer' && user.sectorUnitId) {
      scopeClause = ` AND m.sectorUnitId = ${esc(user.sectorUnitId)} `;
    }

    const [activeRow] = await sequelize.query(`
      SELECT COUNT(*) AS count FROM members m WHERE m.status = 'Active' ${scopeClause}
    `, { type: Q });

    const [inactiveRow] = await sequelize.query(`
      SELECT COUNT(*) AS count FROM members m WHERE m.status != 'Active' ${scopeClause}
    `, { type: Q });

    const [totalRow] = await sequelize.query(`
      SELECT COUNT(*) AS count FROM members m WHERE 1=1 ${scopeClause}
    `, { type: Q });

    // New members registered in the current Ethiopian month
    const month = getEthiopianMonth();
    const year = getEthiopianYear();
    // Assuming registrationDate is standard date, we can filter by current year/month
    const [newRow] = await sequelize.query(`
      SELECT COUNT(*) AS count FROM members m 
      WHERE MONTH(m.registrationDate) = MONTH(NOW()) AND YEAR(m.registrationDate) = YEAR(NOW()) ${scopeClause}
    `, { type: Q });

    return {
      active: Number(activeRow.count),
      inactive: Number(inactiveRow.count),
      total: Number(totalRow.count),
      newRegistrationsThisMonth: Number(newRow.count)
    };
  }

  /**
   * Retrieves list of recently registered members.
   */
  static async getRecentMembersList(user, limit = 10) {
    const Q = sequelize.QueryTypes.SELECT;
    const esc = (val) => sequelize.escape(val);

    let scopeClause = '';
    if (user && user.role === 'sector_officer' && user.sectorUnitId) {
      scopeClause = ` AND m.sectorUnitId = ${esc(user.sectorUnitId)} `;
    }

    const rows = await sequelize.query(`
      SELECT m.id, m.fullName, m.memberId, m.phone, m.membershipType, su.name AS sectorUnitName, m.registrationDate
      FROM members m
      LEFT JOIN sector_units su ON m.sectorUnitId = su.id
      WHERE 1=1 ${scopeClause}
      ORDER BY m.registrationDate DESC, m.id DESC
      LIMIT ${Number(limit)}
    `, { type: Q });

    return rows;
  }
}

module.exports = MemberTool;
