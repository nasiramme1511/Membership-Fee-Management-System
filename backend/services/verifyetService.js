const https = require('https');
const http = require('http');
const crypto = require('crypto');
const config = require('../config/verifyet');

function generateIdempotencyKey() {
  return crypto.randomUUID();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpsRequest(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method,
      timeout: config.timeout,
      headers,
    };
    const req = client.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const text = buffer.toString('utf8');
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = { raw: text };
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, data });
      });
    });
    req.on('error', (err) => reject(new Error(`Network error: ${err.message}`)));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

function getApiKey() {
  const key = config.apiKey;
  if (!key) throw new Error('VERIFY_ET_API_KEY is not configured');
  return key;
}

async function pollForStatus(requestId) {
  const pollTimeout = 25000;
  const pollInterval = 2000;
  const start = Date.now();

  while (Date.now() - start < pollTimeout) {
    await sleep(pollInterval);
    try {
      const statusResp = await exports.getVerificationStatus(requestId);
      if (statusResp.statusCode >= 500) continue;

      const body = statusResp.data;
      if (!body || !body.success) continue;

      const data = body.data || {};
      const procStatus = data.processingStatus || body.verification?.processingStatus;

      if (procStatus === 'completed' || procStatus === 'failed') {
        const normalized = {
          ...body,
          verification: {
            requestId: data.requestId || requestId,
            bank: data.bank || 'unknown',
            processingStatus: procStatus,
            status: data.status || body.verification?.status || procStatus,
            verified: data.verified === true,
            errorMessage: data.errorMessage || null,
          },
          data: Array.isArray(body.data) ? body.data : [],
        };
        return { statusCode: 200, headers: statusResp.headers, data: normalized };
      }
    } catch (e) {
      /* ignore network errors during polling */
    }
  }

  return null;
}

exports.verifyTransaction = async (bank, referenceNumber, accountSuffix, webhookUrl) => {
  const apiKey = getApiKey();
  const mappedBank = config.bankMapping[bank] || bank;

  const payload = { bank: mappedBank };

  if (bank === 'cbe') {
    payload.referenceNumber = referenceNumber;
    if (accountSuffix) payload.accountSuffix = accountSuffix;
  } else if (bank === 'telebirr') {
    payload.transactionNumber = referenceNumber;
  } else {
    payload.referenceNumber = referenceNumber;
  }

  if (webhookUrl) payload.webhookUrl = webhookUrl;

  const idempotencyKey = generateIdempotencyKey();
  const url = `${config.baseUrl}${config.endpoints.verify}?waitMs=20000`;
  const body = JSON.stringify(payload);
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'Idempotency-Key': idempotencyKey,
  };

  const { maxAttempts, baseDelayMs, maxDelayMs } = config.retry;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await httpsRequest(url, 'POST', headers, body);
      if (response.statusCode >= 500 && attempt < maxAttempts) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
        await sleep(delay);
        continue;
      }

      if (response.statusCode === 202 && response.data?.requestId) {
        const finalResponse = await pollForStatus(response.data.requestId);
        if (finalResponse) return finalResponse;
        return response;
      }

      return response;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
        await sleep(delay);
      }
    }
  }
  throw lastError || new Error('All retry attempts failed');
};

exports.getVerificationStatus = async (requestId) => {
  const apiKey = getApiKey();
  const url = `${config.baseUrl}/api/verify/${requestId}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
  };
  return httpsRequest(url, 'GET', headers);
};

exports.verifyWebhookSignature = (payload, signature, secret) => {
  if (!secret) return true;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(typeof payload === 'string' ? payload : JSON.stringify(payload));
  const digest = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
};

exports.generateIdempotencyKey = generateIdempotencyKey;
