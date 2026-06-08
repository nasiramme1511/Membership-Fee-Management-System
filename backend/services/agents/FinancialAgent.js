const groq = require('../../config/groq');
const RevenueTool = require('./tools/RevenueTool');
const SectorTool = require('./tools/SectorTool');
const ForecastTool = require('./tools/ForecastTool');
const PaymentAnalyticsTool = require('./tools/PaymentAnalyticsTool');

class FinancialAgent {
  /**
   * Processes financial queries.
   */
  static async process(query, user, context, sseCallback) {
    sseCallback({ event: 'status', data: 'Analyzing payment records...' });
    const revSummary = await RevenueTool.getSummary(user);

    sseCallback({ event: 'status', data: 'Calculating payment trends & collection rates...' });
    const payAnalytics = await PaymentAnalyticsTool.getPaymentAnalytics(user);

    sseCallback({ event: 'status', data: 'Running forecast models...' });
    const forecast = await ForecastTool.forecastRevenue(user);

    sseCallback({ event: 'status', data: 'Calculating sector performance...' });
    const sectorCompare = await SectorTool.compareSectors(user);

    // Prepare system instructions for Groq
    const systemPrompt = `You are the Financial Analytics Agent for the Prosperity Party Dire Dawa Branch Office Membership Fee Management System.
Your style is professional, data-driven, and strategic.

Translate your final summary and recommendations into the language requested by the query (default to English, natural Amharic if Amharic is used, natural Afaan Oromo if Afaan Oromo is used).

Database Metrics context:
- Monthly Revenue Collected: ETB ${revSummary.monthlyRevenue.toLocaleString()}
- Monthly Payers: ${revSummary.monthlyPayers}
- Yearly Revenue: ETB ${revSummary.yearlyRevenue.toLocaleString()}
- Monthly Expected: ETB ${payAnalytics.monthlyMetrics.expected.toLocaleString()}
- Current Collection Rate: ${payAnalytics.monthlyMetrics.collectionRate}%
- Predicted Next Month Revenue: ETB ${forecast.predictedRevenue.toLocaleString()} (Confidence: ${forecast.confidence}%, Trend: ${forecast.trend}, Model: ${forecast.modelUsed})

Active Chat Context Summary:
${context.cachedSummary}

Write a comprehensive financial summary (about 2 paragraphs) analyzing the overall financial status, collection velocity, sectors needing collection attention, and revenue projections. Stream your narrative response chunk-by-chunk. Then provide exactly 3-5 short actionable financial recommendations.
Follow this format strictly:
[SUMMARY]
Write narrative analysis here.
[RECOMMENDATIONS]
- Recommendation 1
- Recommendation 2
- Recommendation 3`;

    // Construct history messages array for conversation memory
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Inject chronological thread memory
    if (context.recentMessages && context.recentMessages.length > 0) {
      context.recentMessages.forEach(m => {
        messages.push({ role: m.role, content: m.content });
      });
    }

    messages.push({ role: 'user', content: query });

    sseCallback({ event: 'status', data: 'Generating strategic financial insights...' });

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
        // progressive character sending
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
        'Establish automated SMS reminders for sector officers and members.',
        'Prioritize low-performing sectors to bridge the collection gap.',
        'Review payment reconciliation systems to prevent accounting delays.'
      ];
    }

    // Determine intent and chart types
    let intent = 'trend_analysis';
    let chartType = 'line';
    let chartData = payAnalytics.trends.map(t => ({
      name: `Month ${t.month}`,
      amount: Number(t.revenue),
      payers: Number(t.payersCount)
    }));

    if (query.toLowerCase().includes('sector') || query.toLowerCase().includes('compare')) {
      intent = 'sector_analysis';
      chartType = 'bar';
      chartData = sectorCompare.sectors.map(s => ({
        name: s.sectorName,
        rate: Number(s.collectionRate),
        revenue: Number(s.totalRevenue)
      }));
    } else if (query.toLowerCase().includes('forecast') || query.toLowerCase().includes('predict')) {
      intent = 'trend_analysis';
      chartType = 'bar';
      // chart forecast visual
      chartData = [
        ...revSummary.distribution.map(d => ({ name: d.label, amount: Number(d.value) })),
        { name: 'Forecasted Next', amount: forecast.predictedRevenue }
      ];
    }

    return {
      intent,
      title: 'Financial Analytics Summary',
      summary,
      metrics: {
        totalMembers: revSummary.yearlyPayers,
        totalCollected: revSummary.monthlyRevenue,
        totalExpected: payAnalytics.monthlyMetrics.expected,
        completionRate: payAnalytics.monthlyMetrics.collectionRate
      },
      chartType,
      chartData,
      tableData: sectorCompare.sectors,
      recommendations,
      forecast: {
        predictedRevenue: forecast.predictedRevenue,
        confidence: forecast.confidence,
        trend: forecast.trend,
        modelUsed: forecast.modelUsed
      }
    };
  }
}

module.exports = FinancialAgent;
