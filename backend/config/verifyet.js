const config = {
  baseUrl: 'https://verify.et',
  apiKey: process.env.VERIFY_ET_API_KEY || '',
  timeout: 30000,
  retry: {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
  },
  endpoints: {
    verify: '/api/verify',
  },
  bankMapping: {
    telebirr: 'telebirr',
    cbe: 'cbe',
    ebirr: 'kaafiebirr',
  },
};

module.exports = config;
