exports.validateVerifyRequest = (req, res, next) => {
  const { bank, referenceNumber, accountSuffix } = req.body;

  if (!bank || !referenceNumber) {
    return res.status(400).json({ success: false, message: 'bank and referenceNumber are required' });
  }

  const validBanks = ['telebirr', 'cbe', 'ebirr'];
  if (!validBanks.includes(bank.toLowerCase())) {
    return res.status(400).json({ success: false, message: `bank must be one of: ${validBanks.join(', ')}` });
  }

  if (bank.toLowerCase() === 'cbe' && !accountSuffix) {
    return res.status(400).json({ success: false, message: 'accountSuffix is required for CBE' });
  }

  if (bank.toLowerCase() === 'cbe' && accountSuffix && accountSuffix.length !== 8) {
    return res.status(400).json({ success: false, message: 'accountSuffix must be the last 8 digits of the account number' });
  }

  if (!/^[A-Za-z0-9\-_]+$/.test(referenceNumber)) {
    return res.status(400).json({ success: false, message: 'referenceNumber contains invalid characters' });
  }

  req.body.bank = bank.toLowerCase();
  next();
};

exports.validateStatusRequest = (req, res, next) => {
  const { requestId } = req.params;
  if (!requestId || !/^[A-Za-z0-9\-_]+$/.test(requestId)) {
    return res.status(400).json({ success: false, message: 'Invalid requestId' });
  }
  next();
};
