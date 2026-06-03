const express = require('express');
const router = express.Router();
const uploadReceipt = require('../config/uploadReceipt');
const {
  uploadSlip,
  getSectorPayments,
  getSectorPayment,
  approvePayment,
  rejectPayment,
  updateSectorPayment,
  requestCorrection,
  reopenPayment,
  revokePayment,
  getSectorPaymentAuditLogs,
  validateDeposit,
  getClosingStatus,
  closePeriod,
  openPeriod
} = require('../controllers/sectorPaymentController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

// Validate deposit amount against expected revenue
router.get('/validate', authorize('admin', 'sector_officer', 'expert'), validateDeposit);

// Upload slip (POST must be before /:id)
router.post('/upload-slip', authorize('admin', 'sector_officer'), uploadReceipt.single('receipt'), uploadSlip);

// Closing management
router.get('/closing-status', authorize('admin', 'sector_officer'), getClosingStatus);
router.post('/close-period', authorize('admin'), closePeriod);
router.post('/open-period', authorize('admin'), openPeriod);

// List + detail
router.get('/', authorize('admin', 'sector_officer', 'expert'), getSectorPayments);
router.get('/:id', authorize('admin', 'sector_officer', 'expert'), getSectorPayment);

// Audit logs
router.get('/:id/audit-logs', authorize('admin', 'sector_officer', 'expert'), getSectorPaymentAuditLogs);

// Approve / reject / reopen / revoke
router.put('/:id/approve', authorize('admin'), approvePayment);
router.put('/:id/reject', authorize('admin'), rejectPayment);
router.put('/:id/reopen', authorize('admin'), reopenPayment);
router.put('/:id/revoke', authorize('admin'), revokePayment);

// Edit and correction request
router.put('/:id', authorize('admin', 'sector_officer'), uploadReceipt.single('receipt'), updateSectorPayment);
router.put('/:id/request-correction', authorize('sector_officer'), uploadReceipt.single('receipt'), requestCorrection);

module.exports = router;
