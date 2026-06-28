const verifyet = require('../verifyetService');
const VerifyEtPayment = require('../../models/VerifyEtPayment');

exports.verify = async (transactionId, amount, receiverAccount, receiverName, receiptUrl) => {
  try {
    const response = await verifyet.verifyTransaction('telebirr', transactionId);

    if (response.statusCode >= 500) {
      return { verified: false, serverError: true, error: 'Telebirr verification server is temporarily unavailable. Please try again later or upload a receipt file instead.' };
    }

    const body = response.data;

    if (!body || !body.success) {
      return { verified: false, error: body?.message || 'Verification failed. Please check your transaction ID.' };
    }

    const verification = body.verification || {};
    const txData = Array.isArray(body.data) && body.data.length > 0 ? body.data[0] : {};

    if (verification.processingStatus === 'queued' || verification.processingStatus === 'running') {
      return { verified: false, serverError: true, error: 'Telebirr verification is taking longer than expected. The payment has been saved for manual review.' };
    }

    try {
      await VerifyEtPayment.create({
        paymentMethod: 'telebirr',
        referenceNumber: transactionId,
        amount: txData.amount || amount,
        senderName: txData.senderName || null,
        receiverName: txData.receiverName || receiverName || receiverAccount,
        verificationStatus: verification.verified ? 'VERIFIED' : 'FAILED',
        requestId: body.requestId || null,
      });
    } catch (dbErr) {
      console.error('VerifyEtPayment log error:', dbErr.message);
    }

    if (!verification.verified) {
      return { verified: false, error: verification.errorMessage || body.message || 'Transaction could not be verified. Please check your transaction ID.' };
    }

    if (txData.status && txData.status !== 'success' && txData.status !== 'completed') {
      return {
        verified: false,
        error: `Transaction status is "${txData.status}" — only SUCCESS transactions are accepted`,
        status: txData.status,
      };
    }

    const verifiedAmount = parseFloat(txData.amount);
    if (verifiedAmount && verifiedAmount !== Number(amount)) {
      return {
        verified: false,
        error: `Amount mismatch: you entered ETB ${amount} but the bank transaction is for ETB ${verifiedAmount}.`,
        extractedAmount: verifiedAmount,
        transactionId,
      };
    }

    if (txData.receiverName && receiverName && txData.receiverName.toLowerCase() !== receiverName.toLowerCase()) {
      return { verified: false, error: `Receiver name mismatch: the transaction was sent to "${txData.receiverName}" but our account holder name is "${receiverName}".` };
    }

    const txAccount = txData.receiverAccount || txData.receiverPhone || txData.receiverPhoneNumber;
    if (txAccount && receiverAccount) {
      const raw = String(txAccount);
      const ourDigits = String(receiverAccount).replace(/\D/g, '');
      if (raw.includes('*')) {
        const parts = raw.split('*');
        const prefix = parts[0].replace(/\D/g, '');
        const suffix = parts[parts.length - 1].replace(/\D/g, '');
        const matchSuffix = suffix && ourDigits.slice(-suffix.length) === suffix;
        const matchPrefix = !prefix || ourDigits.replace(/^0/, '').replace(/^251/, '').startsWith(prefix.replace(/^251/, '').replace(/^0/, ''));
        if (!matchSuffix || !matchPrefix) {
          return { verified: false, error: `Receiver account mismatch: the transaction was sent to "${txAccount}" but our account is "${receiverAccount}".` };
        }
      } else {
        const txDigits = raw.replace(/\D/g, '').replace(/^0/, '').replace(/^251/, '');
        const ourNorm = ourDigits.replace(/^0/, '').replace(/^251/, '');
        if (txDigits !== ourNorm) {
          return { verified: false, error: `Receiver account mismatch: the transaction was sent to "${txAccount}" but our account is "${receiverAccount}".` };
        }
      }
    }

    if (txData.timestamp) {
      const txDate = new Date(txData.timestamp);
      const today = new Date();
      const diffHours = Math.abs(today - txDate) / 36e5;
      if (diffHours > 72) {
        return { verified: false, error: `Transaction date mismatch: the bank shows this transaction occurred on ${txDate.toISOString().split('T')[0]} which is more than 3 days ago. Please verify the transaction ID is correct and recent.` };
      }
    }

    return {
      verified: true,
      provider: 'telebirr',
      transactionId,
      payer: txData.senderName || 'Customer',
      receiver: txData.receiverName || receiverName || receiverAccount,
      amount: verifiedAmount || Number(amount),
      status: 'SUCCESS',
      date: txData.timestamp || new Date().toISOString(),
      receiptUrl: '',
    };
  } catch (error) {
    const msg = error.message;
    if (msg === 'Timeout' || msg.startsWith('Network error') || msg === 'VERIFY_ET_API_KEY is not configured') {
      return { verified: false, serverError: true, error: `Telebirr verification unavailable: ${msg}` };
    }
    return { verified: false, error: `Telebirr verification failed: ${msg}` };
  }
};
