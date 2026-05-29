const http = require('http');

const data = JSON.stringify({
  email: 'admin@mcms.ddu',
  password: 'admin123'
});

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`BODY: ${body}`);
    process.exit();
  });
});

req.on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
  process.exit();
});

req.write(data);
req.end();
