const { sequelize } = require('../config/db');
const { getEthiopianYear, getEthiopianMonth } = require('../utils/ethiopianCalendar');

const QUERY_TYPES = {
  PAYMENT_ANALYSIS: 'payment_analysis',
  MEMBER_ANALYSIS: 'member_analysis',
  SECTOR_ANALYSIS: 'sector_analysis',
  COMPARISON_ANALYSIS: 'comparison_analysis',
  ADMIN_REPORT: 'admin_report',
  UNKNOWN: 'unknown'
};

function classifyIntent(text) {
  const lower = text.toLowerCase();

  // Amharic payment keywords
  const amPay = /ክፍል|ክፍያ|ከፍለ|ክፍያዎች|ገቢ|መዋጮ|ወርሃዊ|አመታዊ|አጠቃላይ|ድምር|ክፍያ.*ወር|ክፍል.*ወር/i;
  // Oromo payment keywords
  const omPay = /kaffal|gumaacha|galii|ji'a|baay'ina|walii|gala|baasii|bayii|maallaqa|qarxii/i;
  // Amharic member keywords
  const amMem = /አባል|አባላት|ንቁ|እንቅስቃሴ|ያልከፈሉ|አዲስ|ተመዝግበ|ዝርዝር|አሳይ|ማን/i;
  // Oromo member keywords
  const omMem = /miseens|hojiirra|haaraa|galmaa'e|argisiisi|duubatee|hin kaffal|eessa/i;
  // Amharic sector keywords
  const amSec = /ዘርፍ|ምርጥ|ከፍተኛ|ዝቅተኛ|አፈጻጸም|ደረጃ|ቅርንጫፍ|ክፍል|ቢሮ/i;
  // Oromo sector keywords
  const omSec = /sektar|sektor|olee|gadi|hojii|hojiirra|sadarkaa|baay'ina/i;
  // Amharic report keywords
  const amRep = /ሪፖርት|ማጠቃለያ|አጠቃላይ እይታ|ፍጠር|ላክ|ወርሃዊ|ሩብ|አመታዊ/i;
  // Oromo report keywords
  const omRep = /gabatee|gabaas|guduunfaa|uumi|ergi|ji'a|kurmaana|bara/i;
  // Amharic comparison keywords
  const amComp = /ንጽጽር|አወዳድር|ለውጥ|ዕድገት|መቀነስ|ጨምሯል|ቀንሷል|ካለፈው|ከበፊቱ/i;
  // Oromo comparison keywords
  const omComp = /wal bira|fakkeessi|jijjiirama|guddina|xiqqaacha|dabalaa|xiqqaatee|ji'a darbe|bara darbe|waliin/i;

  if (amComp.test(lower) || omComp.test(lower) || /compare|vs|versus|difference|change|growth|decline|increased|decreased|last month|last year|previous/i.test(lower)) {
    return QUERY_TYPES.COMPARISON_ANALYSIS;
  }
  if (amRep.test(lower) || omRep.test(lower) || /(report|summary|overview|generate|export|pdf|management report|quarterly|annual)/i.test(lower)) {
    return QUERY_TYPES.ADMIN_REPORT;
  }
  if (amMem.test(lower) || omMem.test(lower) || /(member|active|inactive|unpaid|overdue|defaulter|registered|new|never|list|show|find|who)/i.test(lower)) {
    return QUERY_TYPES.MEMBER_ANALYSIS;
  }
  if (amPay.test(lower) || omPay.test(lower) || /(total|sum|collection|revenue|amount|paid|payment|monthly|yearly|income|contribution|fee|completion|trend)/i.test(lower)) {
    return QUERY_TYPES.PAYMENT_ANALYSIS;
  }
  if (amSec.test(lower) || omSec.test(lower) || /(sector|branch|unit|department|office|best|worst|top|lowest|performance|rate|ranking|rank)/i.test(lower)) {
    return QUERY_TYPES.SECTOR_ANALYSIS;
  }
  return QUERY_TYPES.UNKNOWN;
}

function buildSectorScope(sequelize, user) {
  if (user && user.role === 'sector_officer' && user.sectorUnitId) {
    return ` AND m.sectorUnitId = ${sequelize.escape(user.sectorUnitId)} `;
  }
  return '';
}

async function executeQuery(intent, userQuery, user) {
  const Q = sequelize.QueryTypes.SELECT;
  const currentYear = getEthiopianYear();
  const currentMonth = getEthiopianMonth();
  const esc = (val) => sequelize.escape(val);
  const secScope = buildSectorScope(sequelize, user);

  if (intent === QUERY_TYPES.PAYMENT_ANALYSIS) {
    const lower = userQuery.toLowerCase();

    if (/completion.*rate|collection.*rate|payment.*rate|percentage/i.test(lower)) {
      const [totalRow] = await sequelize.query(
        `SELECT COUNT(*) AS count FROM members m WHERE m.status = 'Active' ${secScope}`, { type: Q }
      );
      const [paidRow] = await sequelize.query(
        `SELECT COUNT(DISTINCT p.memberDbId) AS count, COALESCE(SUM(p.amount),0) AS total
         FROM payments p JOIN members m ON p.memberDbId = m.id
         WHERE p.periodMonth = ${esc(currentMonth)} AND p.periodYear = ${esc(currentYear)} AND p.status = 'Paid'${secScope.replace(/m\./g, 'm.')}`,
        { type: Q }
      );
      const totalMembers = Number(totalRow.count);
      const paidMembers = Number(paidRow.count);
      const rate = totalMembers > 0 ? Math.round((paidMembers / totalMembers) * 100) : 0;
      return {
        type: 'completion_rate',
        data: { totalMembers, paidMembers, unpaidMembers: totalMembers - paidMembers, rate, totalCollection: Number(paidRow.total) },
        summary: `Payment completion rate: ${rate}% (${paidMembers} paid out of ${totalMembers} active members, ETB ${Number(paidRow.total).toLocaleString()} collected).`
      };
    }

    if (/trend|over time|history|progress/i.test(lower)) {
      const rows = await sequelize.query(
        `SELECT p.periodMonth AS month, p.periodYear AS year,
                COUNT(DISTINCT p.memberDbId) AS payers,
                COALESCE(SUM(p.amount),0) AS amount
         FROM payments p JOIN members m ON p.memberDbId = m.id
         WHERE p.status = 'Paid' AND p.periodYear = ${esc(currentYear)}${secScope.replace(/m\./g, 'm.')}
         GROUP BY p.periodYear, p.periodMonth
         ORDER BY p.periodYear ASC, p.periodMonth ASC`,
        { type: Q }
      );
      return {
        type: 'payment_trend',
        data: rows,
        summary: `Payment trend for ${currentYear}: ${rows.map(r => `Month ${r.month}: ETB ${Number(r.amount).toLocaleString()}`).join(', ')}.`
      };
    }

    if (/statistics|stats|overview|summary/i.test(lower)) {
      const [totalRow] = await sequelize.query(
        `SELECT COUNT(*) AS count FROM members m WHERE m.status = 'Active' ${secScope}`, { type: Q }
      );
      const [paidRow] = await sequelize.query(
        `SELECT COUNT(DISTINCT p.memberDbId) AS count, COALESCE(SUM(p.amount),0) AS total
         FROM payments p JOIN members m ON p.memberDbId = m.id
         WHERE p.periodMonth = ${esc(currentMonth)} AND p.periodYear = ${esc(currentYear)} AND p.status = 'Paid'${secScope.replace(/m\./g, 'm.')}`,
        { type: Q }
      );
      const [yearlyRow] = await sequelize.query(
        `SELECT COUNT(DISTINCT p.memberDbId) AS count, COALESCE(SUM(p.amount),0) AS total
         FROM payments p JOIN members m ON p.memberDbId = m.id
         WHERE p.periodYear = ${esc(currentYear)} AND p.status = 'Paid'${secScope.replace(/m\./g, 'm.')}`,
        { type: Q }
      );
      const totalMembers = Number(totalRow.count);
      const paidMembers = Number(paidRow.count);
      const rate = totalMembers > 0 ? Math.round((paidMembers / totalMembers) * 100) : 0;
      return {
        type: 'payment_statistics',
        data: {
          totalActiveMembers: totalMembers,
          paidThisMonth: paidMembers,
          unpaidThisMonth: totalMembers - paidMembers,
          monthlyCollection: Number(paidRow.total),
          yearlyPayers: Number(yearlyRow.count),
          yearlyCollection: Number(yearlyRow.total),
          completionRate: rate
        },
        summary: `Payment Statistics — Active Members: ${totalMembers} | Paid This Month: ${paidMembers} | Unpaid This Month: ${totalMembers - paidMembers} | Monthly Collection: ETB ${Number(paidRow.total).toLocaleString()} | Yearly Collection: ETB ${Number(yearlyRow.total).toLocaleString()} | Completion Rate: ${rate}%`
      };
    }

    if (/this month|monthly/.test(lower)) {
      const [row] = await sequelize.query(
        `SELECT COUNT(DISTINCT p.memberDbId) AS count, COALESCE(SUM(p.amount),0) AS total
         FROM payments p JOIN members m ON p.memberDbId = m.id
         WHERE p.periodMonth = ${esc(currentMonth)} AND p.periodYear = ${esc(currentYear)} AND p.status = 'Paid'${secScope.replace(/m\./g, 'm.')}`,
        { type: Q }
      );
      return {
        type: 'monthly_summary',
        data: { month: currentMonth, year: currentYear, paid: Number(row.count), total: Number(row.total) },
        summary: `${row.count} members paid a total of ETB ${Number(row.total).toLocaleString()} this month (${currentMonth}/${currentYear}).`
      };
    }

    if (/this year|yearly|annual|year to date/.test(lower)) {
      const [row] = await sequelize.query(
        `SELECT COUNT(DISTINCT p.memberDbId) AS count, COALESCE(SUM(p.amount),0) AS total
         FROM payments p JOIN members m ON p.memberDbId = m.id
         WHERE p.periodYear = ${esc(currentYear)} AND p.status = 'Paid'${secScope.replace(/m\./g, 'm.')}`,
        { type: Q }
      );
      return {
        type: 'yearly_summary',
        data: { year: currentYear, paid: Number(row.count), total: Number(row.total) },
        summary: `${row.count} members paid a total of ETB ${Number(row.total).toLocaleString()} this year (${currentYear}).`
      };
    }

    const [row] = await sequelize.query(
      `SELECT COUNT(DISTINCT p.memberDbId) AS count, COALESCE(SUM(p.amount),0) AS total
       FROM payments p JOIN members m ON p.memberDbId = m.id
       WHERE p.status = 'Paid'${secScope.replace(/m\./g, 'm.')}`,
      { type: Q }
    );
    return {
      type: 'total_payments',
      data: { count: Number(row.count), total: Number(row.total) },
      summary: `Total payments: ${row.count} payments totaling ETB ${Number(row.total).toLocaleString()}.`
    };
  }

  if (intent === QUERY_TYPES.MEMBER_ANALYSIS) {
    const lower = userQuery.toLowerCase();

    if (/overdue|defaulter|not paid.*(3|three|quarter)/.test(lower) || /3 months/i.test(lower)) {
      const rows = await sequelize.query(
        `SELECT m.fullName, m.memberId, m.phone, su.name AS sectorUnitName
         FROM members m
         LEFT JOIN sector_units su ON m.sectorUnitId = su.id
         WHERE m.status = 'Active' AND m.id NOT IN (
           SELECT p.memberDbId FROM payments p
           WHERE p.status = 'Paid' AND p.periodYear = ${esc(currentYear)}
           AND (p.periodMonth >= ${esc(currentMonth - 3)} OR p.periodMonth > ${esc(currentMonth)})
         ) ${secScope}`,
        { type: Q }
      );
      return {
        type: 'overdue_members',
        data: { count: rows.length, members: rows.map(r => r.fullName).slice(0, 10), membersList: rows },
        summary: `${rows.length} members are overdue (not paid for 3+ months).`
      };
    }

    if (/unpaid|not paid|pending|defaulter/.test(lower)) {
      const rows = await sequelize.query(
        `SELECT m.fullName, m.memberId, m.phone, su.name AS sectorUnitName
         FROM members m
         LEFT JOIN sector_units su ON m.sectorUnitId = su.id
         LEFT JOIN payments p ON m.id = p.memberDbId AND p.periodMonth = ${esc(currentMonth)}
           AND p.periodYear = ${esc(currentYear)} AND p.status = 'Paid'
         WHERE p.id IS NULL AND m.status = 'Active' ${secScope}`,
        { type: Q }
      );
      return {
        type: 'unpaid_members',
        data: { count: rows.length, members: rows.map(r => r.fullName).slice(0, 10), membersList: rows },
        summary: `${rows.length} active members have not paid for this month (${currentMonth}/${currentYear}).`
      };
    }

    if (/never.*paid|never.*pay|new.*member|newly.*registered|recently.*registered/.test(lower)) {
      const rows = await sequelize.query(
        `SELECT m.fullName, m.memberId, m.phone, su.name AS sectorUnitName, m.registrationDate
         FROM members m
         LEFT JOIN sector_units su ON m.sectorUnitId = su.id
         WHERE m.status = 'Active' AND m.id NOT IN (
           SELECT DISTINCT p.memberDbId FROM payments p WHERE p.status = 'Paid'
         ) ${secScope}
         ORDER BY m.registrationDate DESC
         LIMIT 20`,
        { type: Q }
      );
      return {
        type: 'never_paid',
        data: { count: rows.length, members: rows.map(r => r.fullName).slice(0, 10), membersList: rows },
        summary: `${rows.length} active members have never made any payment.`
      };
    }

    if (/newly|recently.*regist|new regist|just joined/.test(lower)) {
      const rows = await sequelize.query(
        `SELECT m.fullName, m.memberId, m.phone, su.name AS sectorUnitName, m.registrationDate
         FROM members m
         LEFT JOIN sector_units su ON m.sectorUnitId = su.id
         WHERE 1=1 ${secScope}
         ORDER BY m.registrationDate DESC
         LIMIT 10`,
        { type: Q }
      );
      return {
        type: 'new_members',
        data: { count: rows.length, members: rows.map(r => ({ name: r.fullName, date: r.registrationDate })), membersList: rows },
        summary: `Recently registered members: ${rows.map(r => r.fullName).join(', ')}.`
      };
    }

    if (/by sector|in each sector|per sector|sector.*member/i.test(lower)) {
      const rows = await sequelize.query(
        `SELECT su.name AS sectorName, COUNT(*) AS count
         FROM members m
         JOIN sector_units su ON m.sectorUnitId = su.id
         WHERE m.status = 'Active' ${secScope}
         GROUP BY su.id, su.name
         ORDER BY count DESC`,
        { type: Q }
      );
      return {
        type: 'members_by_sector',
        data: rows,
        summary: rows.map(r => `${r.sectorName}: ${r.count}`).join(', ') + '.'
      };
    }

    if (/active/i.test(lower)) {
      const [row] = await sequelize.query(
        `SELECT COUNT(*) AS count FROM members m WHERE m.status = 'Active' ${secScope}`,
        { type: Q }
      );
      return {
        type: 'active_members',
        data: { count: Number(row.count) },
        summary: `${row.count} active members.`
      };
    }

    if (/inactive/i.test(lower)) {
      const [row] = await sequelize.query(
        `SELECT COUNT(*) AS count FROM members m WHERE m.status != 'Active' ${secScope}`,
        { type: Q }
      );
      return {
        type: 'inactive_members',
        data: { count: Number(row.count) },
        summary: `${row.count} inactive members.`
      };
    }

    const [row] = await sequelize.query(
      `SELECT COUNT(*) AS count FROM members m WHERE 1=1 ${secScope}`,
      { type: Q }
    );
    return {
      type: 'total_members',
      data: { count: Number(row.count) },
      summary: `Total members: ${row.count}.`
    };
  }

  if (intent === QUERY_TYPES.COMPARISON_ANALYSIS) {
    const lower = userQuery.toLowerCase();

    if (/this month.*last month|compare.*month|month.*vs|month.*versus/.test(lower)) {
      const prevMonth = currentMonth === 1 ? 13 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      const [currRow] = await sequelize.query(
        `SELECT COUNT(DISTINCT p.memberDbId) AS count, COALESCE(SUM(p.amount),0) AS total
         FROM payments p JOIN members m ON p.memberDbId = m.id
         WHERE p.periodMonth = ${esc(currentMonth)} AND p.periodYear = ${esc(currentYear)} AND p.status = 'Paid'${secScope.replace(/m\./g, 'm.')}`,
        { type: Q }
      );

      const [prevRow] = await sequelize.query(
        `SELECT COUNT(DISTINCT p.memberDbId) AS count, COALESCE(SUM(p.amount),0) AS total
         FROM payments p JOIN members m ON p.memberDbId = m.id
         WHERE p.periodMonth = ${esc(prevMonth)} AND p.periodYear = ${esc(prevYear)} AND p.status = 'Paid'${secScope.replace(/m\./g, 'm.')}`,
        { type: Q }
      );

      const currPaid = Number(currRow.count);
      const prevPaid = Number(prevRow.count);
      const currTotal = Number(currRow.total);
      const prevTotal = Number(prevRow.total);
      const change = prevPaid > 0 ? Math.round(((currPaid - prevPaid) / prevPaid) * 100) : 0;
      const revenueChange = prevTotal > 0 ? Math.round(((currTotal - prevTotal) / prevTotal) * 100) : 0;

      return {
        type: 'monthly_comparison',
        data: {
          current: { month: currentMonth, paid: currPaid, total: currTotal },
          previous: { month: prevMonth, paid: prevPaid, total: prevTotal },
          change: { paid: change, revenue: revenueChange }
        },
        summary: `This month (${currentMonth}): ${currPaid} members paid ETB ${currTotal.toLocaleString()}. Last month (${prevMonth}): ${prevPaid} members paid ETB ${prevTotal.toLocaleString()}. Change: ${change > 0 ? '+' : ''}${change}% members, ${revenueChange > 0 ? '+' : ''}${revenueChange}% revenue.`
      };
    }

    if (/this year.*last year|compare.*year|year.*vs|year.*versus/.test(lower)) {
      const prevYear = currentYear - 1;

      const [currRow] = await sequelize.query(
        `SELECT COUNT(DISTINCT p.memberDbId) AS count, COALESCE(SUM(p.amount),0) AS total
         FROM payments p JOIN members m ON p.memberDbId = m.id
         WHERE p.periodYear = ${esc(currentYear)} AND p.status = 'Paid'${secScope.replace(/m\./g, 'm.')}`,
        { type: Q }
      );

      const [prevRow] = await sequelize.query(
        `SELECT COUNT(DISTINCT p.memberDbId) AS count, COALESCE(SUM(p.amount),0) AS total
         FROM payments p JOIN members m ON p.memberDbId = m.id
         WHERE p.periodYear = ${esc(prevYear)} AND p.status = 'Paid'${secScope.replace(/m\./g, 'm.')}`,
        { type: Q }
      );

      const currPaid = Number(currRow.count);
      const prevPaid = Number(prevRow.count);
      const currTotal = Number(currRow.total);
      const prevTotal = Number(prevRow.total);
      const change = prevPaid > 0 ? Math.round(((currPaid - prevPaid) / prevPaid) * 100) : 0;
      const revenueChange = prevTotal > 0 ? Math.round(((currTotal - prevTotal) / prevTotal) * 100) : 0;

      return {
        type: 'yearly_comparison',
        data: {
          current: { year: currentYear, paid: currPaid, total: currTotal },
          previous: { year: prevYear, paid: prevPaid, total: prevTotal },
          change: { paid: change, revenue: revenueChange }
        },
        summary: `This year (${currentYear}): ${currPaid} members paid ETB ${currTotal.toLocaleString()}. Last year (${prevYear}): ${prevPaid} members paid ETB ${prevTotal.toLocaleString()}. Change: ${change > 0 ? '+' : ''}${change}% members, ${revenueChange > 0 ? '+' : ''}${revenueChange}% revenue.`
      };
    }

    if (/compare.*sector|sector.*compare|sector.*vs/i.test(lower)) {
      const rows = await sequelize.query(
        `SELECT su.name AS sectorName,
                COUNT(DISTINCT paid_p.memberDbId) AS paid,
                COALESCE(SUM(paid_p.amount),0) AS revenue
         FROM members m
         JOIN sector_units su ON m.sectorUnitId = su.id
         LEFT JOIN (
           SELECT memberDbId, SUM(amount) AS amount
           FROM payments WHERE status = 'Paid'
           AND periodMonth = ${esc(currentMonth)} AND periodYear = ${esc(currentYear)}
           GROUP BY memberDbId
         ) paid_p ON m.id = paid_p.memberDbId
         WHERE m.status = 'Active' ${secScope.replace(/m\./g, 'm.')}
         GROUP BY su.id, su.name
         ORDER BY revenue DESC`,
        { type: Q }
      );
      return {
        type: 'sector_comparison',
        data: rows,
        summary: `Sector comparison: ${rows.map(r => `${r.sectorName} (${r.paid} paid, ETB ${Number(r.revenue).toLocaleString()})`).join(' | ')}`
      };
    }

    return {
      type: 'comparison',
      data: null,
      summary: 'Comparison data is available for monthly, yearly, and sector comparisons. Please specify what you would like to compare.'
    };
  }

  if (intent === QUERY_TYPES.SECTOR_ANALYSIS) {
    const Q = sequelize.QueryTypes.SELECT;

    if (/highest|best|top|most/.test(userQuery.toLowerCase())) {
      const rows = await sequelize.query(
        `SELECT su.name AS sectorName,
                COUNT(DISTINCT m.id) AS totalMembers,
                COUNT(DISTINCT paid_p.memberDbId) AS paidMembers,
                CASE WHEN COUNT(DISTINCT m.id) > 0
                  THEN ROUND((COUNT(DISTINCT paid_p.memberDbId) / COUNT(DISTINCT m.id)) * 100)
                  ELSE 0 END AS collectionRate,
                COALESCE(SUM(paid_p.amount),0) AS totalRevenue
         FROM members m
         JOIN sector_units su ON m.sectorUnitId = su.id
         LEFT JOIN (
           SELECT memberDbId, SUM(amount) AS amount
           FROM payments WHERE status = 'Paid'
           AND periodMonth = ${esc(currentMonth)} AND periodYear = ${esc(currentYear)}
           GROUP BY memberDbId
         ) paid_p ON m.id = paid_p.memberDbId
         WHERE m.status = 'Active'
         GROUP BY su.id, su.name
         ORDER BY collectionRate DESC
         LIMIT 5`,
        { type: Q }
      );
      return {
        type: 'top_sectors',
        data: rows,
        summary: rows.length > 0
          ? `Top sector: ${rows[0].sectorName} with ${rows[0].collectionRate}% collection rate (ETB ${Number(rows[0].totalRevenue).toLocaleString()}).`
          : 'No sector data available.'
      };
    }

    if (/lowest|worst|least|bottom/.test(userQuery.toLowerCase())) {
      const rows = await sequelize.query(
        `SELECT su.name AS sectorName,
                COUNT(DISTINCT m.id) AS totalMembers,
                COUNT(DISTINCT paid_p.memberDbId) AS paidMembers,
                CASE WHEN COUNT(DISTINCT m.id) > 0
                  THEN ROUND((COUNT(DISTINCT paid_p.memberDbId) / COUNT(DISTINCT m.id)) * 100)
                  ELSE 0 END AS collectionRate,
                COALESCE(SUM(paid_p.amount),0) AS totalRevenue
         FROM members m
         JOIN sector_units su ON m.sectorUnitId = su.id
         LEFT JOIN (
           SELECT memberDbId, SUM(amount) AS amount
           FROM payments WHERE status = 'Paid'
           AND periodMonth = ${esc(currentMonth)} AND periodYear = ${esc(currentYear)}
           GROUP BY memberDbId
         ) paid_p ON m.id = paid_p.memberDbId
         WHERE m.status = 'Active'
         GROUP BY su.id, su.name
         ORDER BY collectionRate ASC
         LIMIT 5`,
        { type: Q }
      );
      return {
        type: 'lowest_sectors',
        data: rows,
        summary: rows.length > 0
          ? `Sector needing attention: ${rows[0].sectorName} with ${rows[0].collectionRate}% collection rate.`
          : 'No sector data available.'
      };
    }

    let secFilter = '';
    if (user && user.role === 'sector_officer' && user.sectorUnitId) {
      secFilter = ` AND su.id = ${sequelize.escape(user.sectorUnitId)} `;
    }

    const rows = await sequelize.query(
      `SELECT su.name AS sectorName,
              COUNT(DISTINCT m.id) AS totalMembers,
              COUNT(DISTINCT paid_p.memberDbId) AS paidMembers,
              CASE WHEN COUNT(DISTINCT m.id) > 0
                THEN ROUND((COUNT(DISTINCT paid_p.memberDbId) / COUNT(DISTINCT m.id)) * 100)
                ELSE 0 END AS collectionRate,
              COALESCE(SUM(paid_p.amount),0) AS totalRevenue
       FROM members m
       JOIN sector_units su ON m.sectorUnitId = su.id
       LEFT JOIN (
         SELECT memberDbId, SUM(amount) AS amount
         FROM payments WHERE status = 'Paid'
         AND periodMonth = ${esc(currentMonth)} AND periodYear = ${esc(currentYear)}
         GROUP BY memberDbId
       ) paid_p ON m.id = paid_p.memberDbId
       WHERE m.status = 'Active' ${secFilter}
       GROUP BY su.id, su.name
       ORDER BY su.name`,
      { type: Q }
    );
    return {
      type: 'sector_performance',
      data: rows,
      summary: `Found ${rows.length} sectors. Average collection rate: ${rows.length > 0 ? Math.round(rows.reduce((s, r) => s + Number(r.collectionRate), 0) / rows.length) : 0}%.`
    };
  }

  if (intent === QUERY_TYPES.ADMIN_REPORT) {
    const month = Number(currentMonth);
    const year = Number(currentYear);
    const lower = userQuery.toLowerCase();

    if (/quarterly|quarter/i.test(lower)) {
      const quarters = [
        { name: 'Q1', minM: 1, maxM: 4 },
        { name: 'Q2', minM: 4, maxM: 7 },
        { name: 'Q3', minM: 7, maxM: 10 },
        { name: 'Q4', minM: 10, maxM: 14 }
      ];
      const qData = [];
      for (const q of quarters) {
        const [qr] = await sequelize.query(
          `SELECT COALESCE(SUM(p.amount),0) AS revenue, COUNT(DISTINCT p.memberDbId) AS payers
           FROM payments p JOIN members m ON p.memberDbId = m.id
           WHERE p.status = 'Paid' AND p.periodYear = ${esc(year)}
           AND p.periodMonth >= ${esc(q.minM)} AND p.periodMonth < ${esc(q.maxM)}${secScope.replace(/m\./g, 'm.')}`,
          { type: Q }
        );
        qData.push({ quarter: q.name, revenue: Number(qr.revenue), payers: Number(qr.payers) });
      }
      return {
        type: 'quarterly_report',
        data: { year, quarters: qData },
        summary: `Quarterly report for ${year}: ${qData.map(q => `${q.quarter}: ETB ${q.revenue.toLocaleString()} (${q.payers} payers)`).join(' | ')}.`
      };
    }

    if (/annual|yearly.*report|year.*summary/i.test(lower)) {
      const [yr] = await sequelize.query(
        `SELECT COALESCE(SUM(p.amount),0) AS revenue, COUNT(DISTINCT p.memberDbId) AS payers, COUNT(*) AS payments
         FROM payments p JOIN members m ON p.memberDbId = m.id
         WHERE p.status = 'Paid' AND p.periodYear = ${esc(year)}${secScope.replace(/m\./g, 'm.')}`,
        { type: Q }
      );
      const [totalRow] = await sequelize.query(
        `SELECT COUNT(*) AS count FROM members m WHERE m.status = 'Active' ${secScope}`, { type: Q }
      );
      return {
        type: 'annual_report',
        data: {
          year,
          totalRevenue: Number(yr.revenue),
          totalPayers: Number(yr.payers),
          totalPayments: Number(yr.payments),
          totalActiveMembers: Number(totalRow.count),
          collectionRate: Number(totalRow.count) > 0
            ? Math.round((Number(yr.payers) / Number(totalRow.count)) * 100) : 0
        },
        summary: `Annual report for ${year}: ETB ${Number(yr.revenue).toLocaleString()} collected from ${yr.payers} members (${yr.payments} transactions). Collection rate: ${Number(totalRow.count) > 0 ? Math.round((Number(yr.payers) / Number(totalRow.count)) * 100) : 0}%.`
      };
    }

    if (/management/i.test(lower)) {
      const [summary] = await sequelize.query(
        `SELECT COALESCE(SUM(p.amount),0) AS totalRevenue,
                COUNT(*) AS totalPayments,
                COUNT(DISTINCT p.memberDbId) AS payingMembers
         FROM payments p JOIN members m ON p.memberDbId = m.id
         WHERE p.status = 'Paid' AND p.periodMonth = ${esc(month)} AND p.periodYear = ${esc(year)}${secScope.replace(/m\./g, 'm.')}`,
        { type: Q }
      );

      const [totalMembersRow] = await sequelize.query(
        `SELECT COUNT(*) AS count FROM members m WHERE m.status = 'Active' ${secScope}`, { type: Q }
      );

      const bySector = await sequelize.query(
        `SELECT su.name,
                COUNT(DISTINCT paid_p.memberDbId) AS paid,
                COALESCE(SUM(paid_p.amount),0) AS revenue,
                CASE WHEN COUNT(DISTINCT m.id) > 0
                  THEN ROUND((COUNT(DISTINCT paid_p.memberDbId) / COUNT(DISTINCT m.id)) * 100)
                  ELSE 0 END AS rate
         FROM members m
         JOIN sector_units su ON m.sectorUnitId = su.id
         LEFT JOIN (
           SELECT memberDbId, SUM(amount) AS amount
           FROM payments WHERE status = 'Paid' AND periodMonth = ${esc(month)} AND periodYear = ${esc(year)}
           GROUP BY memberDbId
         ) paid_p ON m.id = paid_p.memberDbId
         WHERE m.status = 'Active' ${secScope.replace(/m\./g, 'm.')}
         GROUP BY su.name
         ORDER BY rate DESC`,
        { type: Q }
      );

      const totalActive = Number(totalMembersRow.count);
      const payingMembers = Number(summary.payingMembers);
      const unpaidMembers = totalActive - payingMembers;
      const rate = totalActive > 0 ? Math.round((payingMembers / totalActive) * 100) : 0;

      const topSector = bySector.length > 0 ? bySector[0] : null;
      const bottomSector = bySector.length > 0 ? bySector[bySector.length - 1] : null;

      return {
        type: 'management_report',
        data: {
          period: { month, year },
          totalMembers: totalActive,
          paidMembers: payingMembers,
          unpaidMembers,
          totalRevenue: Number(summary.totalRevenue),
          completionRate: rate,
          topSector: topSector ? { name: topSector.name, rate: topSector.rate } : null,
          bottomSector: bottomSector && bottomSector.name !== topSector?.name
            ? { name: bottomSector.name, rate: bottomSector.rate } : null,
          sectors: bySector
        },
        summary: `Management Report for ${month}/${year} — Total Members: ${totalActive} | Paid: ${payingMembers} | Unpaid: ${unpaidMembers} | Collection: ETB ${Number(summary.totalRevenue).toLocaleString()} | Completion Rate: ${rate}% | Top Sector: ${topSector ? topSector.name + ' (' + topSector.rate + '%)' : 'N/A'} | Needs Attention: ${bottomSector && bottomSector.name !== topSector?.name ? bottomSector.name + ' (' + bottomSector.rate + '%)' : 'N/A'}.`
      };
    }

    const [summary] = await sequelize.query(
      `SELECT COALESCE(SUM(p.amount),0) AS totalRevenue,
              COUNT(*) AS totalPayments,
              COUNT(DISTINCT p.memberDbId) AS payingMembers
       FROM payments p JOIN members m ON p.memberDbId = m.id
       WHERE p.status = 'Paid' AND p.periodMonth = ${esc(month)} AND p.periodYear = ${esc(year)}${secScope.replace(/m\./g, 'm.')}`,
      { type: Q }
    );

    const [totalMembersRow] = await sequelize.query(
      `SELECT COUNT(*) AS count FROM members m WHERE m.status = 'Active' ${secScope}`,
      { type: Q }
    );

    const bySector = await sequelize.query(
      `SELECT su.name,
              COUNT(DISTINCT paid_p.memberDbId) AS paid,
              COALESCE(SUM(paid_p.amount),0) AS revenue
       FROM members m
       JOIN sector_units su ON m.sectorUnitId = su.id
       LEFT JOIN (
         SELECT memberDbId, SUM(amount) AS amount
         FROM payments WHERE status = 'Paid' AND periodMonth = ${esc(month)} AND periodYear = ${esc(year)}
         GROUP BY memberDbId
       ) paid_p ON m.id = paid_p.memberDbId
       WHERE m.status = 'Active' ${secScope.replace(/m\./g, 'm.')}
       GROUP BY su.name
       ORDER BY revenue DESC`,
      { type: Q }
    );

    return {
      type: 'monthly_report',
      data: {
        period: { month, year },
        totalRevenue: Number(summary.totalRevenue),
        totalPayments: Number(summary.totalPayments),
        payingMembers: Number(summary.payingMembers),
        totalActiveMembers: Number(totalMembersRow.count),
        collectionRate: Number(totalMembersRow.count) > 0
          ? Math.round((Number(summary.payingMembers) / Number(totalMembersRow.count)) * 100)
          : 0,
        bySector
      },
      summary: `Monthly report for ${month}/${year}: ETB ${Number(summary.totalRevenue).toLocaleString()} collected from ${summary.payingMembers} members. Collection rate: ${Number(totalMembersRow.count) > 0 ? Math.round((Number(summary.payingMembers) / Number(totalMembersRow.count)) * 100) : 0}%.`
    };
  }

  return { type: 'unknown', data: null, summary: 'I could not understand your query. Please try asking about payments, members, or sectors.' };
}

exports.QUERY_TYPES = QUERY_TYPES;
exports.classifyIntent = classifyIntent;
exports.executeQuery = executeQuery;
