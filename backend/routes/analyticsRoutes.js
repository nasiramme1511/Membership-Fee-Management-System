const express = require('express');
const router = express.Router();
const { summary, sectors, monthly, unpaidMembers, overdueMembers } = require('../controllers/analyticsController');
const { auth, authorize, scopeSector } = require('../middleware/auth');

router.use(auth);
router.use(scopeSector);
router.use(authorize('admin', 'sector_officer', 'expert'));

router.get('/summary', summary);
router.get('/sectors', sectors);
router.get('/monthly', monthly);
router.get('/unpaid-members', unpaidMembers);
router.get('/overdue-members', overdueMembers);

module.exports = router;
