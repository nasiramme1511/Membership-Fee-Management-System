const groq = require('../../config/groq');
const MemberTool = require('./tools/MemberTool');
const RetentionTool = require('./tools/RetentionTool');
const SectorMembershipTool = require('./tools/SectorMembershipTool');

class MembershipAgent {
  /**
   * Processes membership-related queries.
   */
  static async process(query, user, context, sseCallback) {
    sseCallback({ event: 'status', data: 'Fetching member counts...' });
    const counts = await MemberTool.getMemberCounts(user);

    sseCallback({ event: 'status', data: 'Calculating member retention & growth indices...' });
    const retention = await RetentionTool.getRetentionRate(user);
    const growth = await RetentionTool.getGrowthHistory(user);

    sseCallback({ event: 'status', data: 'Analyzing sector distributions...' });
    const sectorDist = await SectorMembershipTool.getSectorMemberDistribution(user);

    sseCallback({ event: 'status', data: 'Loading recent registrants...' });
    const recentMembers = await MemberTool.getRecentMembersList(user);

    // Prepare system instructions for Groq
    const systemPrompt = `You are the Membership Analytics Agent for the Prosperity Party Dire Dawa Branch Office Membership Fee Management System.
Your style is analytical, focused, and member-centric.

Translate your final summary and recommendations into the language requested by the query (default to English, natural Amharic if Amharic is used, natural Afaan Oromo if Afaan Oromo is used).

Database Metrics context:
- Total Active Members: ${counts.active}
- Total Inactive Members: ${counts.inactive}
- Total Registered Members: ${counts.total}
- New Registrations This Month: ${counts.newRegistrationsThisMonth}
- Retention Index: ${retention.retentionRate}% (${retention.retainedMembers} paid in past 6 months, ${retention.riskLevel})
- Sector Member Count Breakdown: ${sectorDist.map(s => `${s.name}: ${s.value}`).join(', ')}

Active Chat Context Summary:
${context.cachedSummary}

Write a comprehensive membership summary (about 2 paragraphs) analyzing registration trends, retention rates, and sector distribution. Stream your narrative response chunk-by-chunk. Then provide exactly 3-5 short actionable recommendations to increase member engagement or retention.
Follow this format strictly:
[SUMMARY]
Write narrative analysis here.
[RECOMMENDATIONS]
- Recommendation 1
- Recommendation 2
- Recommendation 3`;

    // Construct history messages array
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    if (context.recentMessages && context.recentMessages.length > 0) {
      context.recentMessages.forEach(m => {
        messages.push({ role: m.role, content: m.content });
      });
    }

    messages.push({ role: 'user', content: query });

    sseCallback({ event: 'status', data: 'Generating member engagement recommendations...' });

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
        'Run targeted outreach campaigns for members at high risk of becoming inactive.',
        'Simplify membership registration to speed up recruitment.',
        'Train sector officers on member retention best practices.'
      ];
    }

    // Setup Recharts chart payload
    let chartType = 'pie';
    let chartData = [
      { name: 'Active', value: counts.active },
      { name: 'Inactive', value: counts.inactive }
    ];

    if (query.toLowerCase().includes('sector') || query.toLowerCase().includes('distribution')) {
      chartType = 'bar';
      chartData = sectorDist;
    } else if (query.toLowerCase().includes('growth') || query.toLowerCase().includes('history')) {
      chartType = 'line';
      chartData = growth.map(g => ({ name: g.period, count: g.count }));
    }

    return {
      intent: 'member_lookup',
      title: 'Membership & Engagement Report',
      summary,
      metrics: {
        totalMembers: counts.total,
        activeMembers: counts.active,
        inactiveMembers: counts.inactive,
        retentionRate: retention.retentionRate
      },
      chartType,
      chartData,
      tableData: recentMembers,
      recommendations
    };
  }
}

module.exports = MembershipAgent;
