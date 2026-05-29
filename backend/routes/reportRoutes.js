// routes/reportRoutes.js - Report Routes
const express = require('express');
const router = express.Router();
const {
  monthlyRevenue,
  yearlyRevenue,
  quarterlyRevenue,
  hqBranchDistribution,
  defaulterReport,
  sectorReport,
  exportAllData
} = require('../controllers/reportController');
const { auth, authorize, scopeSector } = require('../middleware/auth');

router.use(auth);
router.use(scopeSector);
router.use(authorize('admin', 'sector_officer', 'expert'));

router.get('/monthly-revenue', monthlyRevenue);
router.get('/yearly-revenue', yearlyRevenue);
router.get('/quarterly-revenue', quarterlyRevenue);
router.get('/hq-branch', hqBranchDistribution);
router.get('/defaulters', defaulterReport);
router.get('/sectors', sectorReport);
router.get('/export', exportAllData);

module.exports = router;
