const groq = require('../../config/groq');
const RevenueTool = require('./tools/RevenueTool');
const MemberTool = require('./tools/MemberTool');
const RetentionTool = require('./tools/RetentionTool');
const AuditTool = require('./tools/AuditTool');
const ComplianceTool = require('./tools/ComplianceTool');
const RiskTool = require('./tools/RiskTool');

class ExecutiveAgent {
  /**
   * Processes executive briefing and strategic decision support queries.
   */
  static async process(query, user, context, sseCallback) {
    sseCallback({ event: 'status', data: 'Scanning database health...' });
    const rev = await RevenueTool.getSummary(user);
    const mem = await MemberTool.getMemberCounts(user);
    const retention = await RetentionTool.getRetentionRate(user);
    const duplicates = await AuditTool.detectDuplicatePayments(user);
    const overdue = await ComplianceTool.getOverdueMembers(user);
    const risks = await RiskTool.getSectorRiskScores(user);

    // Context calculations
    const highRiskSectors = risks.filter(r => r.riskLevel === 'High').map(r => r.sectorName);
    const dupCount = duplicates.length;

    // Prepare system instructions for Groq
    const systemPrompt = `You are the Executive Summary Agent for the Prosperity Party Dire Dawa Branch Office Membership Fee Management System.
Your style is strategic, authoritative, concise, and focused on high-level decision support.

Translate your final summary and recommendations into the language requested by the query (default to English, natural Amharic if Amharic is used, natural Afaan Oromo if Afaan Oromo is used).

Database Health context:
- Monthly Collection: ETB ${rev.monthlyRevenue.toLocaleString()}
- Yearly Collection: ETB ${rev.yearlyRevenue.toLocaleString()}
- Active Member Count: ${mem.active}
- Member Retention Rate: ${retention.retentionRate}% (${retention.riskLevel})
- Overdue active members: ${overdue.count} (Outstanding Balance: ETB ${overdue.totalOutstanding.toLocaleString()})
- Duplicate Tx Anomaly Flag: ${dupCount} duplicates detected
- High-Risk Sector Units: ${highRiskSectors.length > 0 ? highRiskSectors.join(', ') : 'None'}

Active Chat Context Summary:
${context.cachedSummary}

Write a comprehensive executive briefing (about 2 paragraphs) summarizing the overall operational and financial health of the branch office, highlighting key vulnerabilities, and providing strategic direction. Stream your narrative response chunk-by-chunk. Then provide exactly 3-5 short actionable executive recommendations.
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

    sseCallback({ event: 'status', data: 'Synthesizing strategic options...' });

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
        'Deploy dedicated task forces to sectors with collection risk levels exceeding 40%.',
        'Standardize monthly reporting schedules to ensure executive visibility.',
        'Address critical compliance gaps to unlock outstanding fee balances.'
      ];
    }

    const chartType = 'pie';
    const chartData = [
      { name: 'Retained Members', value: retention.retainedMembers },
      { name: 'Risk Members', value: retention.inactiveRiskCount }
    ];

    return {
      intent: 'comparison',
      title: 'Strategic Executive Briefing',
      summary,
      metrics: {
        totalMembers: mem.total,
        totalCollected: rev.monthlyRevenue,
        totalExpected: overdue.totalOutstanding, // outstanding fees
        completionRate: retention.retentionRate
      },
      chartType,
      chartData,
      tableData: risks.slice(0, 10), // Sector risk rankings table
      recommendations
    };
  }
}

module.exports = ExecutiveAgent;
