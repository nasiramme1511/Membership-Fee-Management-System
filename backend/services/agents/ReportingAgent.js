const groq = require('../../config/groq');
const RevenueTool = require('./tools/RevenueTool');
const SectorTool = require('./tools/SectorTool');
const PaymentAnalyticsTool = require('./tools/PaymentAnalyticsTool');

class ReportingAgent {
  /**
   * Processes report generation queries.
   */
  static async process(query, user, context, sseCallback) {
    sseCallback({ event: 'status', data: 'Compiling revenue records...' });
    const revSummary = await RevenueTool.getSummary(user);

    sseCallback({ event: 'status', data: 'Compiling sector comparative studies...' });
    const sectorCompare = await SectorTool.compareSectors(user);

    sseCallback({ event: 'status', data: 'Assembling monthly transaction aggregates...' });
    const payAnalytics = await PaymentAnalyticsTool.getPaymentAnalytics(user);

    // Prepare system instructions for Groq
    const systemPrompt = `You are the Reporting Agent for the Prosperity Party Dire Dawa Branch Office Membership Fee Management System.
Your style is official, objective, and structured.

Translate your final summary and recommendations into the language requested by the query (default to English, natural Amharic if Amharic is used, natural Afaan Oromo if Afaan Oromo is used).

Database Report context:
- Monthly Collection: ETB ${revSummary.monthlyRevenue.toLocaleString()}
- Yearly Collection: ETB ${revSummary.yearlyRevenue.toLocaleString()}
- Average Collection Rate: ${payAnalytics.monthlyMetrics.collectionRate}%
- Sectors detailed: ${sectorCompare.totalSectorsCount}

Active Chat Context Summary:
${context.cachedSummary}

Write an official report overview (about 2 paragraphs) summarizing the monthly, quarterly, or annual collections, major sector contributors, and general collection efficiency. Stream your narrative response chunk-by-chunk. Then provide exactly 3-5 short actionable administrative recommendations.
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

    sseCallback({ event: 'status', data: 'Synthesizing final report summary...' });

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
        'Initiate monthly reconciliation audits across all sector units.',
        'Adopt standard digital receipting to eliminate manual entry errors.',
        'Distribute progress reports to sector leadership on a quarterly cycle.'
      ];
    }

    const chartType = 'bar';
    const chartData = sectorCompare.sectors.map(s => ({
      name: s.sectorName,
      revenue: s.totalRevenue
    }));

    return {
      intent: 'comparison',
      title: 'Official Report Compilation',
      summary,
      metrics: {
        totalMembers: sectorCompare.totalSectorsCount,
        totalCollected: revSummary.monthlyRevenue,
        totalExpected: payAnalytics.monthlyMetrics.expected,
        completionRate: payAnalytics.monthlyMetrics.collectionRate
      },
      chartType,
      chartData,
      tableData: sectorCompare.sectors,
      recommendations
    };
  }
}

module.exports = ReportingAgent;
