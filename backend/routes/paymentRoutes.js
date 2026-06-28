// routes/paymentRoutes.js - Payment Routes
const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPayments,
  getPayment,
  getPaymentsByMember,
  bulkPayments,
  getMonthlyStatus,
  updatePayment,
  deletePayment,
  bulkDeletePayments,
  bulkDeleteAllPayments,
  bulkPaymentUpload
} = require('../controllers/paymentController');
const { auth, authorize, scopeSector } = require('../middleware/auth');
const upload = require('../config/uploadReceipt');

router.use(auth);
router.use(scopeSector);

router.post('/', authorize('admin', 'sector_officer'), createPayment);
router.get('/', authorize('admin', 'sector_officer', 'expert'), getPayments);
router.get('/monthly-status', authorize('admin', 'sector_officer', 'expert'), getMonthlyStatus);
router.get('/member/:memberId', authorize('admin', 'sector_officer', 'expert'), getPaymentsByMember);
router.post('/bulk', authorize('admin', 'sector_officer'), bulkPayments);
router.post('/bulk-upload', authorize('admin', 'sector_officer'), upload.single('receipt'), bulkPaymentUpload);
router.delete('/bulk-delete', authorize('admin'), bulkDeletePayments);
router.delete('/delete-all', authorize('admin'), bulkDeleteAllPayments);
router.get('/:id', authorize('admin', 'sector_officer', 'expert'), getPayment);
router.put('/:id', authorize('admin', 'sector_officer'), updatePayment);
router.delete('/:id', authorize('admin', 'sector_officer'), deletePayment);

module.exports = router;
