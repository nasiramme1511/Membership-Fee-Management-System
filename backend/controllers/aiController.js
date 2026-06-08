const { sequelize } = require('../config/db');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const ConversationMetadata = require('../models/ConversationMetadata');
const Notification = require('../models/Notification');
const AIActivityLog = require('../models/AIActivityLog');
const UserDashboardPreference = require('../models/UserDashboardPreference');
const AgentManager = require('../services/agents/agentManager');
const XLSX = require('xlsx');

// Import Agents for synchronous legacyChat processing
const FinancialAgent = require('../services/agents/FinancialAgent');
const MembershipAgent = require('../services/agents/MembershipAgent');
const AuditAgent = require('../services/agents/AuditAgent');
const ReportingAgent = require('../services/agents/ReportingAgent');
const ExecutiveAgent = require('../services/agents/ExecutiveAgent');
const ActionAgent = require('../services/agents/ActionAgent');
const AIActionExecutor = require('../services/aiActionExecutor');

// ─── CONVERSATIONS CRUD ──────────────────────────────────────────────

exports.createConversation = async (req, res) => {
  try {
    const { title } = req.body;

    console.log({
      route: req.originalUrl,
      params: req.params,
      body: req.body,
      userId: req.userId,
      user: req.user
    });
    const conv = await Conversation.create({
      userId: req.userId,
      title: title || 'New Chat'
    });

    console.log({
      route: req.originalUrl,
      params: req.params,
      body: req.body,
      userId: req.userId,
      user: req.user
    });
    await ConversationMetadata.create({
      conversationId: conv.id,
      summary: '',
      totalMessages: 0
    });

    res.json({ success: true, data: conv });
  } catch (err) {
    console.error('Create conversation error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.listConversations = async (req, res) => {
  try {
    const search = req.query.search || '';
    const { Op } = require('sequelize');

    const whereClause = { userId: req.userId };
    if (search) {
      whereClause.title = { [Op.like]: `%${search}%` };
    }

    console.log({
      route: req.originalUrl,
      params: req.params,
      body: req.body,
      userId: req.userId,
      user: req.user
    });
    const conversations = await Conversation.findAll({
      where: whereClause,
      order: [
        ['pinned', 'DESC'],
        ['updatedAt', 'DESC']
      ]
    });

    res.json({ success: true, data: conversations });
  } catch (err) {
    console.error('List conversations error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateConversation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Conversation ID is required' });
    }
    const { title, pinned, favorite } = req.body;

    console.log({
      route: req.originalUrl,
      params: req.params,
      body: req.body,
      userId: req.userId,
      user: req.user
    });
    const conv = await Conversation.findOne({ where: { id, userId: req.userId } });
    if (!conv) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    if (title !== undefined) conv.title = title;
    if (pinned !== undefined) conv.pinned = pinned ? 1 : 0;
    if (favorite !== undefined) conv.favorite = favorite ? 1 : 0;

    await conv.save();
    res.json({ success: true, data: conv });
  } catch (err) {
    console.error('Update conversation error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Conversation ID is required' });
    }
    console.log({
      route: req.originalUrl,
      params: req.params,
      body: req.body,
      userId: req.userId,
      user: req.user
    });
    const conv = await Conversation.findOne({ where: { id, userId: req.userId } });
    if (!conv) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    await conv.destroy();
    res.json({ success: true, message: 'Conversation deleted successfully.' });
  } catch (err) {
    console.error('Delete conversation error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── MESSAGES ────────────────────────────────────────────────────────

exports.listMessages = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    if (!conversationId || conversationId === 'undefined') {
      return res.status(400).json({ success: false, message: 'Conversation ID is required' });
    }
    console.log({
      route: req.originalUrl,
      params: req.params,
      body: req.body,
      userId: req.userId,
      user: req.user
    });
    const conv = await Conversation.findOne({ where: { id: conversationId, userId: req.userId } });
    if (!conv && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    console.log({
      route: req.originalUrl,
      params: req.params,
      body: req.body,
      userId: req.userId,
      user: req.user
    });
    const messages = await Message.findAll({
      where: { conversationId },
      order: [['id', 'ASC']]
    });

    res.json({ success: true, data: messages });
  } catch (err) {
    console.error('List messages error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.reactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Message ID is required' });
    }
    const { reaction } = req.body; // e.g. "thumbs_up", "thumbs_down", null

    console.log({
      route: req.originalUrl,
      params: req.params,
      body: req.body,
      userId: req.userId,
      user: req.user
    });
    const msg = await Message.findByPk(id);
    if (!msg) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    msg.reaction = reaction;
    await msg.save();

    res.json({ success: true, data: msg });
  } catch (err) {
    console.error('React message error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── SERVER-SENT EVENTS (SSE) CHAT STREAMING ─────────────────────────

exports.legacyChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    console.log({
      route: req.originalUrl,
      params: req.params,
      body: req.body,
      userId: req.userId,
      user: req.user
    });
    // Find or create the user's "default" conversation
    let [conv] = await Conversation.findOrCreate({
      where: { userId: req.userId, title: 'Default Chat' },
      defaults: { title: 'Default Chat' }
    });

    console.log({
      route: req.originalUrl,
      params: req.params,
      body: req.body,
      userId: req.userId,
      user: req.user
    });
    // Ensure metadata row exists
    await ConversationMetadata.findOrCreate({
      where: { conversationId: conv.id },
      defaults: { summary: '', totalMessages: 0 }
    });

    const conversationId = conv.id;
    const startTime = Date.now();
    let agentName = 'financial';

    // Step 1: Classify request intent
    agentName = await AgentManager.routeQuery(message);

    // Step 2: Fetch Context Memory
    const context = await AgentManager.getContext(conversationId);

    // Step 3: Dispatch to correct agent (synchronous run via dummy sseCallback)
    let response = null;
    const dummySseCallback = () => {};

    switch (agentName) {
      case 'action':
        response = await ActionAgent.process(message, req.user, context, dummySseCallback);
        break;
      case 'financial':
        response = await FinancialAgent.process(message, req.user, context, dummySseCallback);
        break;
      case 'membership':
        response = await MembershipAgent.process(message, req.user, context, dummySseCallback);
        break;
      case 'audit':
        response = await AuditAgent.process(message, req.user, context, dummySseCallback);
        break;
      case 'reporting':
        response = await ReportingAgent.process(message, req.user, context, dummySseCallback);
        break;
      case 'executive':
        response = await ExecutiveAgent.process(message, req.user, context, dummySseCallback);
        break;
      default:
        response = await FinancialAgent.process(message, req.user, context, dummySseCallback);
    }

    console.log({
      route: req.originalUrl,
      params: req.params,
      body: req.body,
      userId: req.userId,
      user: req.user
    });
    // Store User Message in DB
    await Message.create({
      conversationId,
      role: 'user',
      content: message
    });

    console.log({
      route: req.originalUrl,
      params: req.params,
      body: req.body,
      userId: req.userId,
      user: req.user
    });
    // Store Assistant message in DB
    await Message.create({
      conversationId,
      role: 'assistant',
      content: response.summary,
      metadata: response
    });

    // Update metadata summary every N messages
    await AgentManager.updateSummary(conversationId);

    // Log AI Activity
    const responseTime = Date.now() - startTime;
    console.log({
      route: req.originalUrl,
      params: req.params,
      body: req.body,
      userId: req.userId,
      user: req.user
    });
    await AIActivityLog.create({
      userId: req.user.id,
      conversationId,
      agent: agentName,
      query: message,
      responseTime,
      tokenUsage: 0
    });

    // Return the final JSON payload expected by the current frontend
    return res.json({
      success: true,
      data: response
    });

  } catch (err) {
    console.error('legacyChat error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.streamMessage = async (req, res) => {
  const { id: conversationId } = req.params;
  if (!conversationId || conversationId === 'undefined' || isNaN(Number(conversationId))) {
    return res.status(400).json({ success: false, message: 'Conversation ID is required' });
  }
  const { message } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Message content is required.' });
  }

  console.log({
    route: req.originalUrl,
    params: req.params,
    body: req.body,
    userId: req.userId,
    user: req.user
  });
  const conv = await Conversation.findOne({ where: { id: Number(conversationId), userId: req.userId } });
  if (!conv) {
    return res.status(404).json({ success: false, message: 'Conversation not found.' });
  }

  // Update conversation title from first user message if it's default
  if (conv.title === 'New Chat' || conv.title === 'Untitled Chat') {
    const firstWords = message.split(' ').slice(0, 5).join(' ');
    conv.title = firstWords + (message.split(' ').length > 5 ? '...' : '');
    await conv.save();
  }

  console.log({
    route: req.originalUrl,
    params: req.params,
    body: req.body,
    userId: req.userId,
    user: req.user
  });
  // Store User Message in DB
  await Message.create({
    conversationId,
    role: 'user',
    content: message
  });

  // Setup SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sseCallback = ({ event, data }) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${typeof data === 'object' ? JSON.stringify(data) : data}\n\n`);
  };

  try {
    await AgentManager.handleMessage(conversationId, message, req.user, sseCallback);
  } catch (err) {
    console.error('SSE execution error:', err.message);
    res.write(`event: error\ndata: ${err.message}\n\n`);
  } finally {
    res.end();
  }
};

// ─── DASHBOARD PREFERENCES ───────────────────────────────────────────

exports.getDashboardPreferences = async (req, res) => {
  try {
    console.log({
      route: req.originalUrl,
      params: req.params,
      body: req.body,
      userId: req.userId,
      user: req.user
    });
    const prefs = await UserDashboardPreference.findAll({
      where: { userId: req.userId },
      order: [['position', 'ASC']]
    });

    // Provide default configurations if none exist
    if (prefs.length === 0) {
      const defaultWidgets = [
        { widgetName: 'total_revenue', position: 0, visible: 1 },
        { widgetName: 'collection_rate', position: 1, visible: 1 },
        { widgetName: 'active_members', position: 2, visible: 1 },
        { widgetName: 'inactive_members', position: 3, visible: 1 },
        { widgetName: 'pending_payments', position: 4, visible: 1 },
        { widgetName: 'growth_rate', position: 5, visible: 1 },
        { widgetName: 'forecast_revenue', position: 6, visible: 1 },
        { widgetName: 'risk_score', position: 7, visible: 1 },
        { widgetName: 'ai_confidence', position: 8, visible: 1 },
        { widgetName: 'system_health', position: 9, visible: 1 }
      ];

      for (const widget of defaultWidgets) {
        console.log({
          route: req.originalUrl,
          params: req.params,
          body: req.body,
          userId: req.userId,
          user: req.user
        });
        await UserDashboardPreference.create({
          userId: req.userId,
          ...widget
        });
      }

      console.log({
        route: req.originalUrl,
        params: req.params,
        body: req.body,
        userId: req.userId,
        user: req.user
      });
      const freshPrefs = await UserDashboardPreference.findAll({
        where: { userId: req.userId },
        order: [['position', 'ASC']]
      });
      return res.json({ success: true, data: freshPrefs });
    }

    res.json({ success: true, data: prefs });
  } catch (err) {
    console.error('Get preferences error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateDashboardPreferences = async (req, res) => {
  try {
    const { preferences } = req.body; // Array of { widgetName, position, visible }
    if (!Array.isArray(preferences)) {
      return res.status(400).json({ success: false, message: 'Preferences array is required.' });
    }

    for (const pref of preferences) {
      console.log({
        route: req.originalUrl,
        params: req.params,
        body: req.body,
        userId: req.userId,
        user: req.user
      });
      const [record, created] = await UserDashboardPreference.findOrCreate({
        where: { userId: req.userId, widgetName: pref.widgetName },
        defaults: { position: pref.position, visible: pref.visible }
      });
      if (!created) {
        record.position = pref.position;
        record.visible = pref.visible;
        await record.save();
      }
    }

    console.log({
      route: req.originalUrl,
      params: req.params,
      body: req.body,
      userId: req.userId,
      user: req.user
    });
    const updated = await UserDashboardPreference.findAll({
      where: { userId: req.userId },
      order: [['position', 'ASC']]
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update preferences error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── EXPORT ACTIVITY LOGGING ─────────────────────────────────────────

exports.logActivity = async (req, res) => {
  try {
    const { action, format, report } = req.body;
    await AIActivityLog.create({
      userId: req.user.id,
      conversationId: req.body.conversationId || null,
      agent: 'export',
      query: report || 'Export Report',
      action: action || 'EXPORT',
      exportFormat: format || null,
      reportTitle: report || null
    });
    res.json({ success: true, message: 'Activity logged.' });
  } catch (err) {
    console.error('Log activity error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── NOTIFICATIONS ───────────────────────────────────────────────────

exports.listNotifications = async (req, res) => {
  try {
    console.log({
      route: req.originalUrl,
      params: req.params,
      body: req.body,
      userId: req.userId,
      user: req.user
    });
    const list = await Notification.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    // Seed mock alert items if empty to display active notification panel
    if (list.length === 0) {
      const seedAlerts = [
        { title: 'System Growth Alert', description: 'Dire Dawa overall collection rate increased by 12% compared to last month.', type: 'growth' },
        { title: 'Audit Anomaly Detected', description: 'Biyyo Awwalle sector has detected 2 duplicate period payment references.', type: 'anomaly' },
        { title: 'Strategic Policy Alert', description: 'Collection efficiency of Trade Bureau sector dropped by 5%. Executive attention advised.', type: 'risk' }
      ];
      for (const sa of seedAlerts) {
        console.log({
          route: req.originalUrl,
          params: req.params,
          body: req.body,
          userId: req.userId,
          user: req.user
        });
        await Notification.create({
          userId: req.userId,
          title: sa.title,
          description: sa.description,
          type: sa.type,
          read: 0
        });
      }
      console.log({
        route: req.originalUrl,
        params: req.params,
        body: req.body,
        userId: req.userId,
        user: req.user
      });
      const freshList = await Notification.findAll({
        where: { userId: req.userId },
        order: [['createdAt', 'DESC']]
      });
      return res.json({ success: true, data: freshList });
    }

    res.json({ success: true, data: list });
  } catch (err) {
    console.error('List notifications error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined') {
      return res.status(400).json({ success: false, message: 'Notification ID is required' });
    }
    console.log({
      route: req.originalUrl,
      params: req.params,
      body: req.body,
      userId: req.userId,
      user: req.user
    });
    const notification = await Notification.findOne({
      where: { id, userId: req.userId }
    });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    notification.read = 1;
    await notification.save();
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Mark notification read error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── AI ACTION EXECUTION ──────────────────────────────────────────

exports.confirmAction = async (req, res) => {
  try {
    const { conversationId, action, parameters } = req.body;
    if (!conversationId || !action) {
      return res.status(400).json({ success: false, message: 'conversationId and action are required.' });
    }

    const hasPermission = AIActionExecutor.checkPermission(action, req.user);
    if (!hasPermission) {
      return res.status(403).json({ success: false, message: `Access denied: You do not have permission to perform '${action}'.` });
    }

    const conv = await Conversation.findOne({ where: { id: Number(conversationId), userId: req.userId } });
    if (!conv) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    await Message.create({
      conversationId,
      role: 'user',
      content: `[CONFIRMED] Execute ${action}`
    });

    const result = await AIActionExecutor.execute(action, parameters, req.user);

    const response = await ActionAgent._respondSuccess(action, result, null, req.user, null, () => {});

    await Message.create({
      conversationId,
      role: 'assistant',
      content: response.summary,
      metadata: response
    });

    await AgentManager.updateSummary(conversationId);

    res.json({ success: true, data: response });
  } catch (err) {
    console.error('Confirm action error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.executeAction = async (req, res) => {
  try {
    const { message: query } = req.body;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const parsed = await AIActionExecutor.parseIntent(query, req.user);

    if (!parsed.isAction) {
      return res.json({
        success: true,
        data: {
          intent: 'not_action',
          title: 'Not an action',
          summary: parsed.reason || 'This request does not appear to be an administrative action.',
          needsConfirmation: false,
          confirmed: false
        }
      });
    }

    const { action, parameters, requiresConfirmation, summary } = parsed;

    const hasPermission = AIActionExecutor.checkPermission(action, req.user);
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied: You do not have permission to perform '${action}'.`
      });
    }

    if (requiresConfirmation) {
      return res.json({
        success: true,
        data: {
          intent: 'action_confirmation',
          title: `Confirm: ${action.replace(/_/g, ' ')}`,
          summary: `You requested to ${summary}. This action requires confirmation.`,
          action,
          actionParams: parameters,
          needsConfirmation: true,
          confirmed: false
        }
      });
    }

    const result = await AIActionExecutor.execute(action, parameters, req.user);

    return res.json({
      success: true,
      data: {
        intent: 'action_completed',
        title: `${action.replace(/_/g, ' ')}`,
        summary: result.message,
        action,
        actionResult: result,
        needsConfirmation: false,
        confirmed: true
      }
    });
  } catch (err) {
    console.error('Execute action error:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message,
      data: {
        intent: 'action_error',
        title: 'Action Failed',
        summary: err.message,
        error: err.message,
        needsConfirmation: false,
        confirmed: false
      }
    });
  }
};

exports.parseAction = async (req, res) => {
  try {
    const { message: query } = req.body;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const parsed = await AIActionExecutor.parseIntent(query, req.user);

    if (!parsed.isAction) {
      return res.json({
        success: true,
        data: { isAction: false, reason: parsed.reason }
      });
    }

    const hasPermission = AIActionExecutor.checkPermission(parsed.action, req.user);

    return res.json({
      success: true,
      data: {
        isAction: true,
        action: parsed.action,
        parameters: parsed.parameters,
        requiresConfirmation: parsed.requiresConfirmation,
        summary: parsed.summary,
        hasPermission
      }
    });
  } catch (err) {
    console.error('Parse action error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PORT EXPORTS ────────────────────────────────────────────────────

exports.exportConversation = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    if (!conversationId || conversationId === 'undefined') {
      return res.status(400).json({ success: false, message: 'Conversation ID is required' });
    }
    console.log({
      route: req.originalUrl,
      params: req.params,
      body: req.body,
      userId: req.userId,
      user: req.user
    });
    const messages = await Message.findAll({
      where: { conversationId },
      order: [['id', 'ASC']]
    });

    // Generate Excel Sheet representation
    const wb = XLSX.utils.book_new();
    const rows = messages.map(m => ({
      Sender: m.role.toUpperCase(),
      Content: m.content,
      Timestamp: m.createdAt
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Dialogue History');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="chat-export-${conversationId}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    console.error('Export conversation error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Legacy Dashboard Insight Handler (for backwards compatibility)
exports.dashboardInsights = async (req, res) => {
  try {
    const { getSummary } = require('../services/agents/tools/RevenueTool');
    const summaryData = await getSummary(req.user);
    res.json({
      success: true,
      data: {
        totalActiveMembers: summaryData.yearlyPayers,
        paidThisMonth: summaryData.monthlyPayers,
        monthlyRevenue: summaryData.monthlyRevenue,
        yearlyRevenue: summaryData.yearlyRevenue,
        completionRate: summaryData.growthRate,
        insight: `Monthly growth is currently at ${summaryData.growthRate}%`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Legacy generateReport (backwards compatibility)
exports.generateReport = async (req, res) => {
  res.json({ success: true, message: 'Generate report endpoint bypassed.' });
};

// Legacy getHistory (backwards compatibility)
exports.getHistory = async (req, res) => {
  try {
    const { Op } = require('sequelize');

    // Fetch recent messages of type 'assistant' that have metadata
    const messages = await Message.findAll({
      where: { role: 'assistant' },
      order: [['id', 'DESC']],
      limit: 100
    });

    const formattedLogs = [];
    for (const msg of messages) {
      // Find the corresponding user query (the message right before the assistant message)
      const userMsg = await Message.findOne({
        where: {
          conversationId: msg.conversationId,
          role: 'user',
          id: { [Op.lt]: msg.id }
        },
        order: [['id', 'DESC']]
      });

      let parsedResponse = msg.metadata;
      if (typeof parsedResponse === 'string') {
        try {
          parsedResponse = JSON.parse(parsedResponse);
        } catch (e) {
          parsedResponse = {
            title: 'AI Response',
            summary: msg.content,
            recommendations: []
          };
        }
      }

      formattedLogs.push({
        id: msg.id,
        userId: req.userId,
        question: userMsg ? userMsg.content : 'Previous query',
        response: parsedResponse || { title: 'AI Response', summary: msg.content, recommendations: [] },
        timestamp: msg.createdAt || new Date(),
        userFullName: req.user.fullName,
        userRole: req.user.role
      });
    }

    res.json({ success: true, data: formattedLogs });
  } catch (error) {
    console.error('AI history error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
