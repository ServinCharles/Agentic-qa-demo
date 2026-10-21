// Minimal JSON HTTP client for the API and events features (no browser needed).
const http = require('http');
const https = require('https');

const REQUEST_TIMEOUT_MS = 10000;

function request(baseUrl, method, urlPath, data = null) {
  return new Promise((resolve, reject) => {
    const target = new URL(baseUrl + urlPath);
    const req = (target.protocol === 'https:' ? https : http).request({
      hostname: target.hostname,
      port: target.port || (target.protocol === 'https:' ? 443 : 80),
      path: target.pathname + target.search,
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: REQUEST_TIMEOUT_MS
    }, res => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        let body = null;
        try { body = raw ? JSON.parse(raw) : null; } catch { body = null; }
        resolve({ status: res.statusCode, headers: res.headers, body, raw });
      });
    });
    req.on('timeout', () => req.destroy(new Error(`Timed out calling ${baseUrl}`)));
    req.on('error', error => {
      // A refused connection to "localhost" arrives as an AggregateError with an empty message
      const reason = error.message || error.code || error.errors?.[0]?.code || String(error);
      reject(new Error(`${reason} (${baseUrl})`));
    });
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

module.exports = { request };
