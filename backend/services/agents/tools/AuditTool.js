const { sequelize } = require('../../../config/db');
const { getEthiopianYear, getEthiopianMonth } = require('../../../utils/ethiopianCalendar');

class AuditTool {
  /**
   * Identifies potential duplicate period payments.
   */
  static async detectDuplicatePayments(user) {
    const Q = sequelize.QueryTypes.SELECT;
    const esc = (val) => sequelize.escape(val);

    let scopeClause = '';
    if (user && user.role === 'sector_officer' && user.sectorUnitId) {
      scopeClause = ` AND m.sectorUnitId = ${esc(user.sectorUnitId)} `;
    }

    // Identifies if a member paid multiple times for the exact same month/year period
    const duplicates = await sequelize.query(`
      SELECT 
        p.memberDbId, 
        m.fullName, 
        m.memberId,
        p.periodMonth, 
        p.periodYear, 
        COUNT(*) AS txCount, 
        COALESCE(SUM(p.amount), 0) AS totalPaid
      FROM payments p
      JOIN members m ON p.memberDbId = m.id
      WHERE p.status = 'Paid' ${scopeClause.replace(/m\./g, 'm.')}
      GROUP BY p.memberDbId, p.periodMonth, p.periodYear
      HAVING txCount > 1
      ORDER BY txCount DESC
      LIMIT 20
    `, { type: Q });

    return duplicates;
  }

  /**
   * Detects suspicious transaction properties (weekend tx, huge amounts, category anomalies).
   */
  static async detectSuspiciousTransactions(user) {
    const Q = sequelize.QueryTypes.SELECT;
    const esc = (val) => sequelize.escape(val);

    let scopeClause = '';
    if (user && user.role === 'sector_officer' && user.sectorUnitId) {
      scopeClause = ` AND m.sectorUnitId = ${esc(user.sectorUnitId)} `;
    }

    // 1. Weekend payments: Day of week 1 (Sunday) or 7 (Saturday)
    const weekendPayments = await sequelize.query(`
      SELECT p.id, m.fullName, m.memberId, p.amount, p.paymentDate, p.receiptId
      FROM payments p
      JOIN members m ON p.memberDbId = m.id
      WHERE p.status = 'Paid' AND DAYOFWEEK(p.paymentDate) IN (1, 7) ${scopeClause.replace(/m\./g, 'm.')}
      ORDER BY p.paymentDate DESC
      LIMIT 10
    `, { type: Q });

    // 2. High Value Anomalies (Amount > 5x Average Payment Size)
    const [avgRow] = await sequelize.query(`
      SELECT AVG(amount) AS avgAmount FROM payments WHERE status = 'Paid'
    `, { type: Q });
    const avgAmount = Number(avgRow.avgAmount) || 200;
    const threshold = avgAmount * 5;

    const highValueAnomalies = await sequelize.query(`
      SELECT p.id, m.fullName, m.memberId, p.amount, p.paymentDate, p.receiptId
      FROM payments p
      JOIN members m ON p.memberDbId = m.id
      WHERE p.status = 'Paid' AND p.amount > ${esc(threshold)} ${scopeClause.replace(/m\./g, 'm.')}
      ORDER BY p.amount DESC
      LIMIT 10
    `, { type: Q });

    return {
      weekendPayments,
      highValueAnomalies,
      averageTxSize: Math.round(avgAmount),
      anomalyThreshold: Math.round(threshold)
    };
  }
}

module.exports = AuditTool;
