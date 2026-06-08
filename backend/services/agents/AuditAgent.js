const groq = require('../../config/groq');
const AuditTool = require('./tools/AuditTool');
const ComplianceTool = require('./tools/ComplianceTool');
const RiskTool = require('./tools/RiskTool');

class AuditAgent {
  /**
   * Processes compliance and risk audit queries.
   */
  static async process(query, user, context, sseCallback) {
    sseCallback({ event: 'status', data: 'Scanning for duplicate period payments...' });
    const duplicates = await AuditTool.detectDuplicatePayments(user);

    sseCallback({ event: 'status', data: 'Scanning for weekend & high-value anomalies...' });
    const anomalies = await AuditTool.detectSuspiciousTransactions(user);

    sseCallback({ event: 'status', data: 'Fetching unpaid active members...' });
    const unpaid = await ComplianceTool.getUnpaidMembers(user);

    sseCallback({ event: 'status', data: 'Calculating overdue lists and outstanding balances...' });
    const overdue = await ComplianceTool.getOverdueMembers(user);

    sseCallback({ event: 'status', data: 'Evaluating sector risk profiles...' });
    const risks = await RiskTool.getSectorRiskScores(user);

    // Context analysis counts
    const duplicatesCount = duplicates.length;
    const weekendCount = anomalies.weekendPayments.length;
    const highValueCount = anomalies.highValueAnomalies.length;
    const totalAnomalies = duplicatesCount + weekendCount + highValueCount;

    // Prepare system instructions for Groq
    const systemPrompt = `You are the Audit and Compliance Agent for the Prosperity Party Dire Dawa Branch Office Membership Fee Management System.
Your style is rigorous, strict, and precise.

Translate your final summary and recommendations into the language requested by the query (default to English, natural Amharic if Amharic is used, natural Afaan Oromo if Afaan Oromo is used).

Database Audit context:
- Duplicate period transactions detected: ${duplicatesCount}
- Weekend transactions processed: ${weekendCount}
- High-value anomalies (amount > 5x average ETB ${anomalies.averageTxSize}): ${highValueCount}
- Total active members missing current month payments: ${unpaid.length}
- Long-term overdue members (>3 months): ${overdue.count} (Outstanding: ETB ${overdue.totalOutstanding.toLocaleString()})
- Sector Risk Rankings: ${risks.map(r => `${r.sectorName}: Risk Score ${r.riskScore}% (${r.riskLevel})`).join(', ')}

Active Chat Context Summary:
${context.cachedSummary}

Write a comprehensive compliance and risk audit summary (about 2 paragraphs) analyzing the database integrity, suspicious patterns, high-risk sectors, and compliance gaps. Stream your narrative response chunk-by-chunk. Then provide exactly 3-5 short actionable recommendations to mitigate audit risks.
Follow this format strictly:
[SUMMARY]
Write narrative analysis here.
[RECOMMENDATIONS]
- Recommendation 1
- Recommendation 2
- Recommendation 3`;

    // Construct messages array
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    if (context.recentMessages && context.recentMessages.length > 0) {
      context.recentMessages.forEach(m => {
        messages.push({ role: m.role, content: m.content });
      });
    }

    messages.push({ role: 'user', content: query });

    sseCallback({ event: 'status', data: 'Compiling risk assessment metrics...' });

    // Call Groq Streaming API
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      stream: true,
      temperature: 0.3
    });

    let fullText = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullText += content;
        sseCallback({ event: 'text', data: content });
      }
    }

    // Parse summary and recommendations
    let summary = fullText;
    let recommendations = [];
    if (fullText.includes('[SUMMARY]') || fullText.includes('[RECOMMENDATIONS]')) {
      const parts = fullText.split('[RECOMMENDATIONS]');
      summary = parts[0].replace('[SUMMARY]', '').trim();
      if (parts[1]) {
        recommendations = parts[1]
          .split('\n')
          .map(line => line.trim().replace(/^-\s*/, ''))
          .filter(line => line.length > 0);
      }
    }

    if (recommendations.length === 0) {
      recommendations = [
        'Establish double-entry checks for payments to block duplicate listings.',
        'Flag and review high-value transactions exceeding local averages.',
        'Implement automatic reminder alerts for overdue sector units.'
      ];
    }

    // Risk distribution chart
    const chartType = 'bar';
    const chartData = risks.map(r => ({
      name: r.sectorName,
      value: r.riskScore
    }));

    // Concat recent lists for tables
    const tableData = unpaid.slice(0, 15).map(u => ({
      id: u.memberId,
      name: u.fullName,
      phone: u.phone,
      sector: u.sectorUnitName,
      monthlyFee: u.contributionMonthlyFee,
      status: 'Unpaid'
    }));

    return {
      intent: 'audit',
      title: 'Compliance & Audit Scan',
      summary,
      metrics: {
        totalMembers: overdue.count,
        totalCollected: totalAnomalies, // using as anomaly counter
        totalExpected: overdue.totalOutstanding,
        completionRate: risks.length > 0 ? 100 - Math.round(risks.reduce((a, b) => a + b.riskScore, 0) / risks.length) : 100
      },
      chartType,
      chartData,
      tableData,
      recommendations,
      anomalies: {
        duplicatesCount,
        weekendCount,
        highValueCount,
        totalOutstanding: overdue.totalOutstanding
      }
    };
  }
}

module.exports = AuditAgent;
