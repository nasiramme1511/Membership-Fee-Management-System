const cbeProvider = require('./providers/cbe');
const telebirrProvider = require('./providers/telebirr');
const ebirrProvider = require('./providers/ebirr');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const RECEIPT_URLS = {
  cbe:      (tid) => `https://apps.cbe.com.et:100/?id=${tid}`,
  telebirr: (tid) => `https://transactioninfo.ethiotelecom.et/receipt/${tid}`,
  ebirr:    (tid) => `https://receipt.ebirr.com/kaafimf/${tid}`,
};

function normalizeProvider(provider) {
  const p = provider.toLowerCase().replace('_birr', '').replace('cbe birr', 'cbe');
  if (p.includes('telebirr')) return 'telebirr';
  if (p.includes('ebirr') || p.includes('e-birr')) return 'ebirr';
  return 'cbe';
}

function getReceiptsDir() {
  const dir = path.join(__dirname, '..', 'uploads', 'receipts');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const MERCHANTS = {
  cbe:      { account: '1000476051111', name: 'Muaz Amin Shebo' },
  telebirr: { account: '0964358567', name: 'Muaz Amin Shebo' },
  ebirr:    { account: '0964358567', name: 'Muaz Amin Shebo' }
};

exports.verifyTransaction = async (provider, transactionId, expectedAmount, receiptUrl) => {
  const cleanProvider = normalizeProvider(provider);

  const merchant = MERCHANTS[cleanProvider] || MERCHANTS.cbe;
  const { account: merchantAccount, name: merchantName } = merchant;

  let result;
  switch (cleanProvider) {
    case 'cbe':
      result = await cbeProvider.verify(transactionId, expectedAmount, merchantAccount, merchantName, receiptUrl);
      break;
    case 'telebirr':
      result = await telebirrProvider.verify(transactionId, expectedAmount, merchantAccount, merchantName, receiptUrl);
      break;
    case 'ebirr':
      result = await ebirrProvider.verify(transactionId, expectedAmount, merchantAccount, merchantName, receiptUrl);
      break;
    default:
      return { verified: false, error: 'Unsupported payment provider' };
  }

  if (result.verified) {
    if (result.status !== 'SUCCESS') {
      result.verified = false;
      result.error = 'Transaction status is not SUCCESS';
    } else if (result.amount !== Number(expectedAmount)) {
      result.verified = false;
      result.error = `Amount mismatch: Expected ${expectedAmount}, found ${result.amount}`;
    }
  }

  return result;
};

function fetchUrl(targetUrl) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    };
    const req = client.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({ buffer: Buffer.concat(chunks), contentType: (res.headers['content-type'] || '').toLowerCase(), statusCode: res.statusCode });
      });
    });
    req.on('error', (err) => reject(new Error(`Network error: ${err.message}`)));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

exports.generateReceiptFromVerification = (provider, transactionId, amount, payer, receiver, date) => {
  const receiptsDir = getReceiptsDir();
  const filename = `bank-receipt-${transactionId}-${Date.now()}.pdf`;
  const filePath = path.join(receiptsDir, filename);
  const cleanProvider = normalizeProvider(provider);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const orgName = 'Prosperity Party Dire Dawa Branch Office';
      const systemName = 'Membership Fee Management System';
      const currency = 'ETB';

      doc.fontSize(18).font('Helvetica-Bold').text(orgName, { align: 'center' }).moveDown(0.3);
      doc.fontSize(11).font('Helvetica').text(systemName, { align: 'center' }).moveDown(0.3);
      doc.fontSize(9).font('Helvetica-Oblique').text('Bank Payment Receipt – Auto-Verified', { align: 'center' }).moveDown(0.8);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#0ea5e9').moveDown(0.8);

      doc.roundedRectangle(50, doc.y, 495, 50, 4).strokeColor('#0ea5e9').lineWidth(1.5).stroke();
      const boxY = doc.y;
      doc.fontSize(11).font('Helvetica');
      doc.text(`Bank: ${cleanProvider.charAt(0).toUpperCase() + cleanProvider.slice(1)}`, 65, boxY + 8);
      doc.text(`Transaction ID: ${transactionId}`, 65, boxY + 26);
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#059669');
      doc.text(`${currency} ${Number(amount).toLocaleString()}`, 310, boxY + 12);
      doc.fillColor('#000');
      doc.moveDown(2.5);

      doc.fontSize(10).font('Helvetica');
      doc.text(`Payer / Sender:`, 50, doc.y, { width: 120 });
      doc.font('Helvetica-Bold').text(payer || 'N/A', 170, doc.y - doc.currentLineHeight(), { width: 320 });
      doc.moveDown(0.3);
      doc.font('Helvetica').text(`Receiver / Merchant:`, 50, doc.y, { width: 120 });
      doc.font('Helvetica-Bold').text(receiver || 'N/A', 170, doc.y - doc.currentLineHeight(), { width: 320 });
      doc.moveDown(0.3);
      doc.font('Helvetica').text(`Transaction Date:`, 50, doc.y, { width: 120 });
      doc.text(date ? new Date(date).toISOString().split('T')[0] : 'N/A', 170, doc.y - doc.currentLineHeight(), { width: 320 });
      doc.moveDown(0.3);

      doc.font('Helvetica').text(`Verified At:`, 50, doc.y, { width: 120 });
      doc.text(new Date().toISOString(), 170, doc.y - doc.currentLineHeight(), { width: 320 });
      doc.moveDown(1.5);

      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#ccc').moveDown(0.8);

      doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666');
      doc.text('This receipt was automatically generated from bank verification data via Verify.ET.', { align: 'center' });
      doc.text('It serves as proof of payment verified against the bank\'s transaction records.', { align: 'center' });
      doc.fillColor('#000');

      doc.end();
      stream.on('finish', () => resolve(filename));
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};

exports.downloadBankReceipt = async (provider, transactionId) => {
  const cleanProvider = normalizeProvider(provider);
  const url = RECEIPT_URLS[cleanProvider]?.(transactionId);
  if (!url) return null;

  const extMap = { cbe: '.pdf', telebirr: '.html', ebirr: '.html' };
  const ext = extMap[cleanProvider] || '.pdf';

  try {
    const { buffer, statusCode, contentType } = await fetchUrl(url);
    if (statusCode >= 400) {
      console.error(`Receipt download failed HTTP ${statusCode} for ${url}`);
      return null;
    }

    const receiptsDir = getReceiptsDir();
    const filename = `bank-receipt-${transactionId}-${Date.now()}${ext}`;
    fs.writeFileSync(path.join(receiptsDir, filename), buffer);
    return filename;
  } catch (err) {
    console.error(`Receipt download error for ${url}:`, err.message);
    return null;
  }
};
