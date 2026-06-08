const express = require('express');
const router = express.Router();
const {
  createConversation,
  listConversations,
  updateConversation,
  deleteConversation,
  listMessages,
  reactMessage,
  streamMessage,
  legacyChat,
  getDashboardPreferences,
  updateDashboardPreferences,
  logActivity,
  listNotifications,
  markNotificationRead,
  exportConversation,
  dashboardInsights,
  generateReport,
  getHistory,
  confirmAction,
  executeAction,
  parseAction
} = require('../controllers/aiController');

const { auth, authorize, scopeSector } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/aiAuth');

router.use(auth);
router.use(scopeSector);
router.use(authorize('admin', 'sector_officer', 'expert', 'super_admin'));

// Conversations CRUD
router.post('/conversations', createConversation);
router.get('/conversations', listConversations);
router.put('/conversations/:id', updateConversation);
router.delete('/conversations/:id', deleteConversation);

// Messages & SSE Streaming
router.get('/conversations/:id/messages', listMessages);
router.post('/conversations/:id/messages', aiRateLimiter, streamMessage);
router.put('/messages/:id/react', reactMessage);
router.get('/conversations/:id/export', exportConversation);

// User Dashboard Preferences layout
router.get('/preferences', getDashboardPreferences);
router.put('/preferences', updateDashboardPreferences);

// Export Activity Logging
router.post('/activity/log', logActivity);

// Notification Feed Drawer
router.get('/notifications', listNotifications);
router.put('/notifications/:id/read', markNotificationRead);

// AI Action Endpoints
router.post('/action/parse', aiRateLimiter, parseAction);
router.post('/action/execute', aiRateLimiter, executeAction);
router.post('/action/confirm', aiRateLimiter, confirmAction);

// Legacy compat endpoints
router.post('/chat', aiRateLimiter, legacyChat); // Legacy chat: auto-creates conversation
router.get('/dashboard', dashboardInsights);
router.post('/report', authorize('admin'), generateReport);
router.get('/history', getHistory);

module.exports = router;
