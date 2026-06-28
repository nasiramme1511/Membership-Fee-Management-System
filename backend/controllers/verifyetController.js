const { Op } = require('sequelize');
const verifyetService = require('../services/verifyetService');
const VerifyEtPayment = require('../models/VerifyEtPayment');

exports.verify = async (req, res) => {
  try {
    const { bank, referenceNumber, accountSuffix } = req.body;

    const response = await verifyetService.verifyTransaction(bank, referenceNumber, accountSuffix);

    if (response.statusCode >= 500) {
      return res.status(502).json({ success: false, message: 'Verification service temporarily unavailable' });
    }

    const body = response.data;

    if (!body || !body.success) {
      return res.status(400).json({ success: false, message: body?.message || 'Verification failed' });
    }

    const verification = body.verification || {};
    const txData = Array.isArray(body.data) && body.data.length > 0 ? body.data[0] : {};

    if (verification.processingStatus === 'queued' || verification.processingStatus === 'running') {
      return res.status(202).json({
        success: true,
        message: 'Verification is still processing. Please check status later.',
        requestId: body.requestId,
        statusUrl: body.links?.statusUrl,
        pollAfterMs: body.links?.pollAfterMs || 3000,
      });
    }

    try {
      await VerifyEtPayment.create({
        paymentMethod: bank,
        referenceNumber,
        accountSuffix: accountSuffix || null,
        amount: txData.amount || null,
        senderName: txData.senderName || null,
        receiverName: txData.receiverName || null,
        verificationStatus: verification.verified ? 'VERIFIED' : 'FAILED',
        requestId: body.requestId || null,
      });
    } catch (dbErr) {
      console.error('VerifyEtPayment log error:', dbErr.message);
    }

    if (!verification.verified) {
      if (verification.status === 'failed' || verification.processingStatus === 'failed') {
        return res.status(502).json({ success: false, message: verification.errorMessage || 'Bank is not responding right now. Please try again later.' });
      }
      return res.status(400).json({ success: false, message: body.message || 'Verification failed' });
    }

    return res.json({
      success: true,
      verified: true,
      data: {
        bank,
        referenceNumber,
        transactionId: txData.transactionId || txData.reference || referenceNumber,
        amount: txData.amount,
        currency: txData.currency || 'ETB',
        status: txData.status || 'success',
        senderName: txData.senderName,
        receiverName: txData.receiverName,
        date: txData.timestamp,
        requestId: body.requestId,
      },
    });
  } catch (error) {
    const msg = error.message;
    if (msg === 'VERIFY_ET_API_KEY is not configured') {
      return res.status(500).json({ success: false, message: 'Verification service is not configured. Please set VERIFY_ET_API_KEY.' });
    }
    if (msg === 'Timeout' || msg.startsWith('Network error')) {
      return res.status(502).json({ success: false, message: 'Verification service unreachable. Please try again later.' });
    }
    return res.status(500).json({ success: false, message: `Verification failed: ${msg}` });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const { requestId } = req.params;

    const response = await verifyetService.getVerificationStatus(requestId);

    if (response.statusCode >= 500) {
      return res.status(502).json({ success: false, message: 'Verification service temporarily unavailable' });
    }

    const body = response.data;

    if (!body || !body.success) {
      return res.status(404).json({ success: false, message: body?.message || 'Verification request not found' });
    }

    const data = body.data || {};

    return res.json({
      success: true,
      data: {
        requestId,
        processingStatus: data.processingStatus || body.verification?.processingStatus,
        status: data.status || body.verification?.status,
        verified: data.verified === true || body.verification?.verified === true,
        completedAt: data.completedAt,
      },
    });
  } catch (error) {
    const msg = error.message;
    if (msg === 'VERIFY_ET_API_KEY is not configured') {
      return res.status(500).json({ success: false, message: 'Verification service is not configured.' });
    }
    return res.status(500).json({ success: false, message: `Status check failed: ${msg}` });
  }
};

exports.webhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const payload = req.body;

    if (signature && process.env.VERIFY_ET_WEBHOOK_SECRET) {
      const isValid = verifyetService.verifyWebhookSignature(
        payload,
        signature,
        process.env.VERIFY_ET_WEBHOOK_SECRET
      );
      if (!isValid) {
        return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    const event = payload.event || payload.type;
    const txData = payload.data || payload;
    const requestId = payload.requestId || txData.requestId;

    if (requestId) {
      const record = await VerifyEtPayment.findOne({ where: { requestId } });
      if (record) {
        const newStatus = txData.verified || txData.status === 'success' ? 'VERIFIED' : 'FAILED';
        await record.update({ verificationStatus: newStatus });
      }
    }

    return res.json({ success: true, received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return res.json({ success: true, received: true });
  }
};
