const express = require('express');
const router = express.Router();
const { verify, getStatus, webhook } = require('../controllers/verifyetController');
const { validateVerifyRequest, validateStatusRequest } = require('../middleware/verifyet');
const { auth } = require('../middleware/auth');

router.post('/verify', auth, validateVerifyRequest, verify);
router.get('/status/:requestId', auth, validateStatusRequest, getStatus);
router.post('/webhook', webhook);

module.exports = router;
