const groq = require('../../config/groq');
const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const ConversationMetadata = require('../../models/ConversationMetadata');
const AIActivityLog = require('../../models/AIActivityLog');

// Import Agents
const FinancialAgent = require('./FinancialAgent');
const MembershipAgent = require('./MembershipAgent');
const AuditAgent = require('./AuditAgent');
const ReportingAgent = require('./ReportingAgent');
const ExecutiveAgent = require('./ExecutiveAgent');
const ActionAgent = require('./ActionAgent');

class AgentManager {
  /**
   * Classifies the query using Groq to route to the appropriate agent.
   */
  static async routeQuery(query) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an AI Operations Router. Classify the user query into one of these 6 agent types:
- "action": Commands to CREATE, UPDATE, DELETE, TRANSFER, ACTIVATE, DEACTIVATE, APPROVE, REJECT, IMPORT, EXPORT data. Keywords: add, create, edit, update, delete, remove, transfer, move, activate, deactivate, approve, reject, import, export, record, generate, reset, lock, unlock, assign, merge, send, remind.
- "financial": Queries regarding revenue, payments, forecasts, distributions, sector comparisons.
- "membership": Queries regarding active, inactive, new members, retention rates, member stats.
- "audit": Queries regarding duplicates, suspicious payments, compliance, risks, anomaly detection.
- "reporting": Requests to compile official reports (monthly, annual, quarterly) or tabular exports.
- "executive": Strategic insights, decision-making, management summaries.

If the query asks to DO something (add/create/edit/delete/approve/reject/transfer/reset), classify as "action".
If the query asks to SHOW/ANALYZE/COMPARE/PREDICT/FORECAST data, classify as one of the analytics types.
Respond with exactly one word from this list: "action", "financial", "membership", "audit", "reporting", "executive". Do not write anything else.`
          },
          { role: 'user', content: query }
        ],
        max_tokens: 10,
        temperature: 0.1
      });

      const routed = completion.choices[0].message.content.trim().toLowerCase();
      const validAgents = ['action', 'financial', 'membership', 'audit', 'reporting', 'executive'];
      if (validAgents.includes(routed)) {
        return routed;
      }
      return 'financial'; // default fallback
    } catch (err) {
      console.error('Routing error:', err.message);
      return 'financial'; // fallback on API error
    }
  }

  /**
   * Retrieves conversation history and context memory.
   * Leverages cached metadata summary to keep context compact and token-efficient.
   */
  static async getContext(conversationId) {
    if (!conversationId || conversationId === 'undefined') {
      console.warn('[AgentManager] getContext called with invalid conversationId:', conversationId);
      return { cachedSummary: '', recentMessages: [] };
    }
    // 1. Fetch cached summary from metadata
    const metadata = await ConversationMetadata.findOne({ where: { conversationId } });
    const cachedSummary = metadata ? metadata.summary : '';

    // 2. Fetch last 4 messages for active thread memory
    const messages = await Message.findAll({
      where: { conversationId },
      order: [['id', 'DESC']],
      limit: 4
    });
    
    // Reverse to chronological
    const recentMessages = messages.reverse();

    return {
      cachedSummary,
      recentMessages
    };
  }

  /**
   * Checks if thread needs a new summary and updates cached summary.
   * Triggers after every N messages (default N = 6).
   */
  static async updateSummary(conversationId) {
    if (!conversationId || conversationId === 'undefined') {
      console.warn('[AgentManager] updateSummary called with invalid conversationId:', conversationId);
      return;
    }
    try {
      const messagesCount = await Message.count({ where: { conversationId } });
      if (messagesCount > 0 && messagesCount % 6 === 0) {
        // Load all messages
        const allMessages = await Message.findAll({
          where: { conversationId },
          order: [['id', 'ASC']]
        });

        const conversationText = allMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a database summarization agent. Write a 2-3 sentence summary capturing key topics, analysis requested, and decisions discussed in this conversation history. Keep it extremely compact.'
            },
            { role: 'user', content: conversationText }
          ],
          max_tokens: 150,
          temperature: 0.3
        });

        const summary = completion.choices[0].message.content.trim();

        // Save to metadata
        const [meta, created] = await ConversationMetadata.findOrCreate({
          where: { conversationId },
          defaults: { summary, totalMessages: messagesCount }
        });

        if (!created) {
          meta.summary = summary;
          meta.totalMessages = messagesCount;
          await meta.save();
        }
      } else {
        // Increment message count in metadata
        const meta = await ConversationMetadata.findOne({ where: { conversationId } });
        if (meta) {
          meta.totalMessages = messagesCount;
          await meta.save();
        }
      }
    } catch (e) {
      console.error('Failed to update metadata summary:', e.message);
    }
  }

  /**
   * Core execution handler that routes the message to the proper agent
   * and handles Server-Sent Events streaming to the client.
   */
  static async handleMessage(conversationId, userMessage, user, sseCallback) {
    const startTime = Date.now();
    let agentName = 'financial';

    try {
      // Step 1: Status Update
      sseCallback({ event: 'status', data: 'Classifying request intent...' });
      agentName = await this.routeQuery(userMessage);

      // Step 2: Fetch Context Memory
      const context = await this.getContext(conversationId);

      // Step 3: Dispatch to correct agent
      let response = null;
      switch (agentName) {
        case 'action':
          response = await ActionAgent.process(userMessage, user, context, sseCallback);
          break;
        case 'financial':
          response = await FinancialAgent.process(userMessage, user, context, sseCallback);
          break;
        case 'membership':
          response = await MembershipAgent.process(userMessage, user, context, sseCallback);
          break;
        case 'audit':
          response = await AuditAgent.process(userMessage, user, context, sseCallback);
          break;
        case 'reporting':
          response = await ReportingAgent.process(userMessage, user, context, sseCallback);
          break;
        case 'executive':
          response = await ExecutiveAgent.process(userMessage, user, context, sseCallback);
          break;
        default:
          response = await FinancialAgent.process(userMessage, user, context, sseCallback);
      }

      // Step 4: Save Assistant message to Database
      const finalMsg = await Message.create({
        conversationId,
        role: 'assistant',
        content: response.summary,
        metadata: response
      });

      // Update metadata summary every N messages
      await this.updateSummary(conversationId);

      // Log AI Activity
      const responseTime = Date.now() - startTime;
      await AIActivityLog.create({
        userId: user.id,
        conversationId,
        agent: agentName,
        query: userMessage,
        responseTime,
        tokenUsage: 0 // Mock counter, or we can parse from LLM usage stats
      });

      // Final SSE done event with message metadata
      sseCallback({
        event: 'done',
        data: JSON.stringify({
          messageId: finalMsg.id,
          ...response
        })
      });

    } catch (err) {
      console.error('Agent processing failed:', err);
      sseCallback({
        event: 'error',
        data: err.message || 'An error occurred during agent processing.'
      });
    }
  }
  /**
   * Executes a previously confirmed action directly (no further LLM routing needed).
   * Used when the user confirms a pending action.
   */
  static async executeConfirmedAction(conversationId, action, parameters, user, sseCallback) {
    const startTime = Date.now();

    try {
      const response = await ActionAgent.executeConfirmed(action, parameters, user, sseCallback);

      const finalMsg = await Message.create({
        conversationId,
        role: 'assistant',
        content: response.summary,
        metadata: response
      });

      await this.updateSummary(conversationId);

      const responseTime = Date.now() - startTime;
      await AIActivityLog.create({
        userId: user.id,
        conversationId,
        agent: 'action_confirmed',
        query: `CONFIRMED: ${action}`,
        responseTime,
        tokenUsage: 0
      });

      sseCallback({
        event: 'done',
        data: JSON.stringify({
          messageId: finalMsg.id,
          ...response
        })
      });
    } catch (err) {
      console.error('[AgentManager] Confirmed action execution failed:', err);
      sseCallback({
        event: 'error',
        data: err.message || 'Failed to execute confirmed action.'
      });
    }
  }
}

module.exports = AgentManager;
