const groq = require('../config/groq');
const aiService = require('../services/aiService');
const ReportService = require('../services/reportService');
const { sequelize } = require('../config/db');
const { getLanguagePrompt, detectLanguage } = require('../services/languageService');

// ─── STRICT JSON ENGINE SYSTEM PROMPT ────────────────────────────────
const SYSTEM_PROMPT_JSON = `You are a Financial Analytics JSON Engine for a Membership Fee Management System.

CRITICAL RULES (NON-NEGOTIABLE):
1. ALWAYS return ONLY valid JSON. No markdown, no explanations, no extra text.
2. NEVER wrap JSON in code fences or backticks.
3. NEVER include any text before or after the JSON object.
4. If output is not valid JSON, it is a FAILURE.

LANGUAGE RULES:
- If instructed to use Amharic → ALL text fields (title, summary, recommendations) must be in natural, fluent Amharic. Not translated or robotic.
- If instructed to use Afaan Oromo → ALL text fields must be in natural, fluent Afaan Oromo.
- If instructed to use English → ALL text fields must be in professional English.
- NEVER mix languages in one response.

You MUST return EXACTLY this JSON structure:
{
  "title": "short professional title in the user's language",
  "summary": "detailed professional summary explaining key metrics and insights, in the user's language",
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3"]
}

RULES FOR RECOMMENDATIONS:
- Must be actionable and short
- Must relate to financial improvement, collections, or member management
- Minimum 3, maximum 5 recommendations

FORBIDDEN:
- No greetings or pleasantries
- No chatbot behavior
- No explanations outside the JSON
- No storytelling
- No markdown formatting`;

// ─── INTENT MAPPING ──────────────────────────────────────────────────
// Maps backend query types to the 5-intent taxonomy
function mapIntent(backendIntent, queryType) {
  // Query-type-specific overrides first
  const queryMap = {
    'payment_trend': 'trend_analysis',
    'payment_trend_yearly': 'trend_analysis',
    'completion_rate': 'payment_status',
    'payment_statistics': 'payment_status',
    'monthly_summary': 'payment_status',
    'yearly_summary': 'payment_status',
    'total_payments': 'payment_status',
    'sector_comparison': 'comparison_analysis',
    'top_sectors': 'sector_performance',
    'lowest_sectors': 'sector_performance',
    'sector_performance': 'sector_performance',
    'members_by_sector': 'sector_performance',
    'quarterly_report': 'comparison_analysis',
    'annual_report': 'comparison_analysis',
    'management_report': 'comparison_analysis',
    'monthly_report': 'comparison_analysis',
    'monthly_comparison': 'comparison_analysis',
    'yearly_comparison': 'comparison_analysis',
    'overdue_members': 'member_lookup',
    'unpaid_members': 'member_lookup',
    'never_paid': 'member_lookup',
    'new_members': 'member_lookup',
    'active_members': 'member_lookup',
    'inactive_members': 'member_lookup',
    'total_members': 'member_lookup'
  };

  if (queryMap[queryType]) return queryMap[queryType];

  // Fallback by backend intent category
  const intentMap = {
    'payment_analysis': 'trend_analysis',
    'member_analysis': 'member_lookup',
    'sector_analysis': 'sector_performance',
    'comparison_analysis': 'comparison_analysis',
    'admin_report': 'comparison_analysis'
  };
  return intentMap[backendIntent] || 'payment_status';
}

// ─── CHART TYPE MAPPING ──────────────────────────────────────────────
function getChartType(queryType) {
  const map = {
    'payment_trend': 'line',
    'payment_trend_yearly': 'line',
    'completion_rate': 'pie',
    'payment_statistics': 'pie',
    'sector_comparison': 'bar',
    'top_sectors': 'bar',
    'lowest_sectors': 'bar',
    'sector_performance': 'bar',
    'members_by_sector': 'bar',
    'quarterly_report': 'bar',
    'annual_report': 'bar',
    'management_report': 'bar',
    'monthly_report': 'bar',
    'monthly_comparison': 'bar',
    'yearly_comparison': 'bar',
    'overdue_members': 'table',
    'unpaid_members': 'table',
    'never_paid': 'table',
    'new_members': 'table'
  };
  return map[queryType] || 'table';
}

// ─── METRICS EXTRACTION (always includes totalMembers) ───────────────
async function extractMetrics(queryType, data, user) {
  let totalMembers = 0;
  let totalCollected = 0;
  let totalExpected = 0;
  let completionRate = 0;

  // Always try to fetch total active members for the metrics card
  try {
    const secScope = (user && user.role === 'sector_officer' && user.sectorUnitId)
      ? ` AND m.sectorUnitId = ${sequelize.escape(user.sectorUnitId)} `
      : '';
    const [row] = await sequelize.query(
      `SELECT COUNT(*) AS count FROM members m WHERE m.status = 'Active' ${secScope}`,
      { type: sequelize.QueryTypes.SELECT }
    );
    totalMembers = Number(row.count) || 0;
  } catch (e) {
    console.error('Error fetching totalMembers for metrics:', e.message);
  }

  if (!data) return { totalMembers, totalCollected, totalExpected, completionRate };

  if (queryType === 'completion_rate') {
    totalMembers = Number(data.totalMembers) || totalMembers;
    totalCollected = Number(data.totalCollection) || 0;
    completionRate = Number(data.rate) || 0;
    totalExpected = completionRate > 0 ? Math.round((totalCollected / completionRate) * 100) : totalCollected;
  } else if (queryType === 'payment_statistics') {
    totalMembers = Number(data.totalActiveMembers) || totalMembers;
    totalCollected = Number(data.monthlyCollection) || 0;
    completionRate = Number(data.completionRate) || 0;
    totalExpected = completionRate > 0 ? Math.round((totalCollected / completionRate) * 100) : totalCollected;
  } else if (queryType === 'monthly_summary') {
    totalCollected = Number(data.total) || 0;
    totalExpected = totalCollected;
    completionRate = totalMembers > 0 ? Math.round((Number(data.paid) / totalMembers) * 100) : 0;
  } else if (queryType === 'yearly_summary' || queryType === 'total_payments') {
    totalCollected = Number(data.total) || 0;
    totalExpected = totalCollected;
    completionRate = totalMembers > 0 ? Math.round((Number(data.count || data.paid) / totalMembers) * 100) : 0;
  } else if (queryType === 'management_report' || queryType === 'monthly_report' || queryType === 'annual_report') {
    totalMembers = Number(data.totalMembers || data.totalActiveMembers) || totalMembers;
    totalCollected = Number(data.totalRevenue) || 0;
    completionRate = Number(data.collectionRate || data.completionRate) || 0;
    totalExpected = completionRate > 0 ? Math.round((totalCollected / completionRate) * 100) : totalCollected;
  } else if (queryType === 'monthly_comparison' || queryType === 'yearly_comparison') {
    totalCollected = Number(data.current?.total) || 0;
    const prevTotal = Number(data.previous?.total) || 0;
    totalExpected = Math.max(totalCollected, prevTotal);
    completionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;
  } else if (queryType === 'quarterly_report') {
    if (data.quarters && Array.isArray(data.quarters)) {
      totalCollected = data.quarters.reduce((s, q) => s + (Number(q.revenue) || 0), 0);
    }
    totalExpected = totalCollected;
    completionRate = 100;
  } else if (['active_members', 'inactive_members', 'total_members'].includes(queryType)) {
    totalMembers = Number(data.count) || totalMembers;
  } else if (['unpaid_members', 'overdue_members', 'never_paid'].includes(queryType)) {
    // totalMembers already fetched above
  }

  return { totalMembers, totalCollected, totalExpected, completionRate };
}

// ─── CHART DATA EXTRACTION ──────────────────────────────────────────
function getChartData(queryType, data) {
  if (!data) return [];
  try {
    switch (queryType) {
      case 'payment_trend':
        if (Array.isArray(data)) {
          return data.map(r => ({
            name: `Month ${r.month}`,
            amount: Number(r.amount) || 0,
            payers: Number(r.payers) || 0
          }));
        }
        break;
      case 'completion_rate':
        return [
          { name: 'Paid', value: Number(data.paidMembers) || 0 },
          { name: 'Unpaid', value: Number(data.unpaidMembers) || 0 }
        ];
      case 'payment_statistics':
        return [
          { name: 'Paid This Month', value: Number(data.paidThisMonth) || 0 },
          { name: 'Unpaid This Month', value: Number(data.unpaidThisMonth) || 0 }
        ];
      case 'top_sectors':
      case 'lowest_sectors':
      case 'sector_performance':
        if (Array.isArray(data)) {
          return data.map(r => ({
            name: r.sectorName,
            rate: Number(r.collectionRate) || 0,
            revenue: Number(r.totalRevenue) || 0
          }));
        }
        break;
      case 'members_by_sector':
        if (Array.isArray(data)) {
          return data.map(r => ({
            name: r.sectorName,
            value: Number(r.count) || 0
          }));
        }
        break;
      case 'monthly_comparison':
      case 'yearly_comparison':
        return [
          { name: 'Previous', amount: Number(data.previous?.total) || 0, paidCount: Number(data.previous?.paid) || 0 },
          { name: 'Current', amount: Number(data.current?.total) || 0, paidCount: Number(data.current?.paid) || 0 }
        ];
      case 'sector_comparison':
        if (Array.isArray(data)) {
          return data.map(r => ({
            name: r.sectorName,
            revenue: Number(r.revenue) || 0,
            paid: Number(r.paid) || 0
          }));
        }
        break;
      case 'quarterly_report':
        if (data.quarters && Array.isArray(data.quarters)) {
          return data.quarters.map(q => ({
            name: q.quarter,
            revenue: Number(q.revenue) || 0,
            payers: Number(q.payers) || 0
          }));
        }
        break;
      case 'annual_report':
      case 'management_report':
      case 'monthly_report':
        if (data.sectors && Array.isArray(data.sectors)) {
          return data.sectors.map(s => ({
            name: s.name,
            revenue: Number(s.revenue) || 0,
            rate: Number(s.rate) || 0
          }));
        } else if (data.bySector && Array.isArray(data.bySector)) {
          return data.bySector.map(s => ({
            name: s.name,
            revenue: Number(s.revenue) || 0
          }));
        }
        break;
    }
  } catch (e) {
    console.error('Error generating chartData:', e);
  }
  return [];
}

// ─── TABLE DATA EXTRACTION ──────────────────────────────────────────
function getTableData(queryType, data) {
  if (!data) return [];
  if (['overdue_members', 'unpaid_members', 'never_paid', 'new_members'].includes(queryType)) {
    return (data.membersList || []).slice(0, 50);
  }
  if (Array.isArray(data)) {
    return data.slice(0, 50);
  }
  return [];
}

// ─── MAP LANGUAGE CODE ──────────────────────────────────────────────
function mapLanguageCode(lang) {
  if (lang === 'am') return 'am';
  if (lang === 'om') return 'or';
  return 'en';
}

// ═══════════════════════════════════════════════════════════════════
// MAIN CHAT ENDPOINT
// ═══════════════════════════════════════════════════════════════════
exports.chat = async (req, res) => {
  let language = 'en';
  try {
    const { message, language: reqLang } = req.body;
    language = reqLang || detectLanguage(message) || 'en';

    if (!message || message.trim().length === 0) {
      const errMsg = language === 'am' ? 'መልእክት ያስፈልጋል።' : language === 'om' ? 'Ergaan barbaachisa.' : 'Message is required.';
      return res.status(400).json({ success: false, message: errMsg });
    }

    if (message.length > 2000) {
      const errMsg = language === 'am' ? 'መልእክቱ በጣም ረጅም ነው (ከፍተኛ 2000 ቁምፊዎች)።' : language === 'om' ? 'Ergaan baay\'ee dheera (max 2000).' : 'Message too long (max 2000 characters).';
      return res.status(400).json({ success: false, message: errMsg });
    }

    // 1. Classify intent & execute database query
    const intent = aiService.classifyIntent(message);
    const queryResult = await aiService.executeQuery(intent, message, req.user);

    // 2. Build LLM payload with raw data
    const payload = `User Query: ${message}
Intent: ${intent}
Query Type: ${queryResult.type}

Data from system (JSON):
${JSON.stringify(queryResult.data, null, 2)}

Summary: ${queryResult.summary}

Generate the title, summary, and recommendations fields based on the raw metrics above. Follow the system prompt rules strictly. Return ONLY the JSON object, nothing else.`;

    // 3. Call Groq LLM for title/summary/recommendations
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: `${getLanguagePrompt(language)}\n\n${SYSTEM_PROMPT_JSON}` },
        { role: 'user', content: payload }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
      temperature: 0.3
    });

    // 4. Parse LLM response (strict sanitization)
    const rawResponse = completion.choices[0].message.content;
    let parsedResponse = {};
    try {
      let cleanResponse = rawResponse.trim();
      // Strip markdown code fences if the LLM wrapped them
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();
      }
      parsedResponse = JSON.parse(cleanResponse);
    } catch (e) {
      console.error('Groq response was not valid JSON, using fallback:', e.message);
      parsedResponse = {
        title: language === 'am' ? 'የፋይናንስ ትንተና ሪፖርት' : language === 'om' ? 'Gabaasa Xiinxala Faayinaansii' : 'Financial Analysis Report',
        summary: queryResult.summary,
        recommendations: [
          language === 'am' ? 'ያልከፈሉ አባላትን በፍጥነት ይከታተሉ' : language === 'om' ? 'Miseensota hin kaffalin hordofaa' : 'Follow up unpaid members immediately',
          language === 'am' ? 'ዝቅተኛ አፈጻጸም ያላቸውን ዘርፎች ያሻሽሉ' : language === 'om' ? 'Sektaroota hojiirra gadi aanaa fooyyessi' : 'Improve collection rate in low-performing sectors',
          language === 'am' ? 'ወርሃዊ ማስታወሻዎችን ያስተካክሉ' : language === 'om' ? 'Yaadachiisa ji\'aa qindeessi' : 'Automate monthly reminders'
        ]
      };
    }

    // 5. Build structured metrics (async because we query totalMembers)
    const metrics = await extractMetrics(queryType = queryResult.type, queryResult.data, req.user);

    // 6. Assemble final response matching the strict schema
    const finalResponse = {
      language: mapLanguageCode(language),
      intent: mapIntent(intent, queryResult.type),
      title: parsedResponse.title || 'Financial Analysis',
      summary: parsedResponse.summary || queryResult.summary,
      metrics: {
        totalMembers: metrics.totalMembers,
        totalCollected: metrics.totalCollected,
        totalExpected: metrics.totalExpected,
        completionRate: metrics.completionRate
      },
      chartType: getChartType(queryResult.type),
      chartData: getChartData(queryResult.type, queryResult.data),
      tableData: getTableData(queryResult.type, queryResult.data),
      recommendations: Array.isArray(parsedResponse.recommendations) ? parsedResponse.recommendations : []
    };

    res.json({
      success: true,
      data: {
        response: JSON.stringify(finalResponse),
        ...finalResponse
      }
    });
  } catch (error) {
    console.error('AI chat error:', error.message);
    const errMsg = error.message || 'AI service error.';
    res.status(500).json({ success: false, message: errMsg, language });
  }
};

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD INSIGHTS ENDPOINT
// ═══════════════════════════════════════════════════════════════════
exports.dashboardInsights = async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const Q = sequelize.QueryTypes.SELECT;
    const currentYear = require('../utils/ethiopianCalendar').getEthiopianYear();
    const currentMonth = require('../utils/ethiopianCalendar').getEthiopianMonth();

    const secScope = req.query.sectorId
      ? ` AND m.sectorUnitId = ${sequelize.escape(req.query.sectorId)} `
      : '';

    const [totalRow] = await sequelize.query(
      `SELECT COUNT(*) AS count FROM members m WHERE m.status = 'Active' ${secScope}`, { type: Q }
    );
    const totalActiveMembers = Number(totalRow.count);

    const [paidToday] = await sequelize.query(
      `SELECT COUNT(*) AS count FROM payments p
       JOIN members m ON p.memberDbId = m.id
       WHERE DATE(p.paymentDate) = CURDATE() AND p.status = 'Paid' ${secScope.replace(/m\./g, 'm.')}`,
      { type: Q }
    );

    const [todayRevenue] = await sequelize.query(
      `SELECT COALESCE(SUM(p.amount),0) AS total FROM payments p
       JOIN members m ON p.memberDbId = m.id
       WHERE DATE(p.paymentDate) = CURDATE() AND p.status = 'Paid' ${secScope.replace(/m\./g, 'm.')}`,
      { type: Q }
    );

    const [monthlyPaid] = await sequelize.query(
      `SELECT COUNT(DISTINCT p.memberDbId) AS count, COALESCE(SUM(p.amount),0) AS total
       FROM payments p JOIN members m ON p.memberDbId = m.id
       WHERE p.periodMonth = ${sequelize.escape(currentMonth)}
         AND p.periodYear = ${sequelize.escape(currentYear)} AND p.status = 'Paid' ${secScope.replace(/m\./g, 'm.')}`,
      { type: Q }
    );
    const paidThisMonth = Number(monthlyPaid.count);
    const monthlyRevenue = Number(monthlyPaid.total);

    const unpaidThisMonth = totalActiveMembers - paidThisMonth;
    const completionRate = totalActiveMembers > 0 ? Math.round((paidThisMonth / totalActiveMembers) * 100) : 0;

    const [yearlyPaid] = await sequelize.query(
      `SELECT COUNT(DISTINCT p.memberDbId) AS count, COALESCE(SUM(p.amount),0) AS total
       FROM payments p JOIN members m ON p.memberDbId = m.id
       WHERE p.periodYear = ${sequelize.escape(currentYear)} AND p.status = 'Paid' ${secScope.replace(/m\./g, 'm.')}`,
      { type: Q }
    );

    const topSector = await sequelize.query(
      `SELECT su.name, COUNT(DISTINCT paid_p.memberDbId) AS paidMembers,
              COALESCE(SUM(paid_p.amount),0) AS revenue
       FROM members m
       JOIN sector_units su ON m.sectorUnitId = su.id
       LEFT JOIN (
         SELECT memberDbId, SUM(amount) AS amount
         FROM payments WHERE status = 'Paid'
         AND periodMonth = ${sequelize.escape(currentMonth)} AND periodYear = ${sequelize.escape(currentYear)}
         GROUP BY memberDbId
       ) paid_p ON m.id = paid_p.memberDbId
       WHERE m.status = 'Active'
       GROUP BY su.name
       ORDER BY paidMembers DESC
       LIMIT 1`,
      { type: Q }
    );

    const insightPrompt = `Dashboard Data — Total Active Members: ${totalActiveMembers} | Paid Today: ${paidToday.count} | Today's Revenue: ETB ${Number(todayRevenue.total).toLocaleString()} | Paid This Month: ${paidThisMonth} | Unpaid This Month: ${unpaidThisMonth} | Monthly Revenue: ETB ${monthlyRevenue.toLocaleString()} | Yearly Payers: ${Number(yearlyPaid.count)} | Yearly Revenue: ETB ${Number(yearlyPaid.total).toLocaleString()} | Completion Rate: ${completionRate}% | Top Sector: ${topSector[0]?.name || 'N/A'}. Generate a one-line insight.`;

    const insightCompletion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Generate a single short insight line (max 15 words) about the data.' },
        { role: 'user', content: insightPrompt }
      ],
      max_tokens: 50,
      temperature: 0.3
    });

    res.json({
      success: true,
      data: {
        totalActiveMembers,
        paidToday: Number(paidToday.count),
        todayRevenue: Number(todayRevenue.total),
        paidThisMonth,
        unpaidThisMonth,
        monthlyRevenue,
        yearlyPayers: Number(yearlyPaid.count),
        yearlyRevenue: Number(yearlyPaid.total),
        completionRate,
        topSector: topSector[0]?.name || null,
        topSectorRevenue: topSector[0] ? Number(topSector[0].revenue) : 0,
        insight: insightCompletion.choices[0].message.content
      }
    });
  } catch (error) {
    console.error('AI dashboard insights error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// REPORT GENERATION ENDPOINT
// ═══════════════════════════════════════════════════════════════════
exports.generateReport = async (req, res) => {
  try {
    const { title, sections, table, totals } = req.body;

    const reportData = {
      title: title || 'AI-Generated Report',
      summary: req.body.summary || '',
      sections: sections || [],
      table: table || null,
      totals: totals || {}
    };

    const result = await ReportService.generateReport(reportData);
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    res.json({
      success: true,
      data: {
        fileName: result.fileName,
        url: `${baseUrl}/uploads/reports/${result.fileName}`
      }
    });
  } catch (error) {
    console.error('AI report generation error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════════════
// HISTORY ENDPOINT
// ═══════════════════════════════════════════════════════════════════
exports.getHistory = async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const Q = sequelize.QueryTypes.SELECT;
    const userRole = req.user.role;
    const userId = req.userId;
    const sectorUnitId = req.user.sectorUnitId;

    let query = '';
    const replacements = [];

    if (userRole === 'admin' || userRole === 'super_admin') {
      query = `
        SELECT l.id, l.userId, l.question, l.response, l.timestamp, u.fullName as userFullName, u.role as userRole
        FROM ai_logs l
        LEFT JOIN users u ON l.userId = u.id
        ORDER BY l.timestamp DESC
        LIMIT 100
      `;
    } else if (userRole === 'sector_officer') {
      query = `
        SELECT l.id, l.userId, l.question, l.response, l.timestamp, u.fullName as userFullName, u.role as userRole
        FROM ai_logs l
        LEFT JOIN users u ON l.userId = u.id
        WHERE l.userId = ? OR u.sectorUnitId = ?
        ORDER BY l.timestamp DESC
        LIMIT 100
      `;
      replacements.push(userId, sectorUnitId);
    } else {
      query = `
        SELECT l.id, l.userId, l.question, l.response, l.timestamp, u.fullName as userFullName, u.role as userRole
        FROM ai_logs l
        LEFT JOIN users u ON l.userId = u.id
        WHERE l.userId = ?
        ORDER BY l.timestamp DESC
        LIMIT 100
      `;
      replacements.push(userId);
    }

    const logs = await sequelize.query(query, { replacements, type: Q });

    const formattedLogs = logs.map(log => {
      let parsedResponse = log.response;
      try {
        parsedResponse = JSON.parse(log.response);
      } catch (e) {
        parsedResponse = {
          title: 'AI Response',
          summary: log.response,
          recommendations: []
        };
      }
      return {
        id: log.id,
        userId: log.userId,
        question: log.question,
        response: parsedResponse,
        timestamp: log.timestamp,
        userFullName: log.userFullName,
        userRole: log.userRole
      };
    });

    res.json({ success: true, data: formattedLogs });
  } catch (error) {
    console.error('AI history error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
