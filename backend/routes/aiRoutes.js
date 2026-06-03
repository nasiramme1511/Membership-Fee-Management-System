const express = require('express');
const router = express.Router();
const { chat, dashboardInsights, generateReport, getHistory } = require('../controllers/aiController');
const { auth, authorize, scopeSector } = require('../middleware/auth');
const { aiRateLimiter, logAIRequest } = require('../middleware/aiAuth');

router.use(auth);
router.use(scopeSector);
router.use(authorize('admin', 'sector_officer', 'expert'));

router.post('/chat', aiRateLimiter, logAIRequest, chat);
router.get('/dashboard', dashboardInsights);
router.post('/report', authorize('admin'), generateReport);
router.get('/history', authorize('admin', 'sector_officer', 'expert'), getHistory);

module.exports = router;
