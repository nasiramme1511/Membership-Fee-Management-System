// routes/authRoutes.js - Authentication Routes
const express = require('express');
const router = express.Router();
const { register, login, getMe, getAllUsers, verifyEmail, resendOtp } = require('../controllers/authController');
const { auth, authorize } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOtp);
router.get('/me', auth, getMe);
router.get('/users', auth, authorize('admin'), getAllUsers);

module.exports = router;
