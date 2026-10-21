const http = require('http');
const url = require('url');
const crypto = require('crypto');

// In-memory stand-ins for what aip-api saves to MongoDB and what aip-audit-service audits from Kafka,
// so the events suite runs locally exactly as it does against sit-01
const applications = new Map();
const auditTrails = new Map();
const APPLICATION_ID = /^AIP-[0-9]{8}-[0-9A-F]{8}$/;
const EVENT_DELAY_MS = 300; // events arrive a moment after the decision, like a real Kafka consumer

function newApplicationId(now = new Date()) {
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  return `AIP-${date}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function saveAndPublish(applicationId, input, result) {
  const createdAt = new Date().toISOString();
  applications.set(applicationId, { id: applicationId, createdAt, input, result });

  setTimeout(() => {
    const event = {
      eventId: crypto.randomUUID(),
      eventType: 'AipDecisionMade',
      schemaVersion: 1,
      applicationId,
      decision: result.decision,
      loanAmount: input.loanAmount,
      maxBorrowing: result.maxBorrowing,
      occurredAt: createdAt,
      receivedAt: new Date().toISOString(),
      partition: 0,
      offset: [...auditTrails.values()].reduce((total, events) => total + events.length, 0)
    };
    auditTrails.set(applicationId, [...(auditTrails.get(applicationId) || []), event]);
  }, EVENT_DELAY_MS);
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

// Like aip-api: anything that isn't a JSON object (invalid JSON, an array, null) is "Invalid JSON"
function parseJsonObject(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Not a JSON object');
  return data;
}

// A malformed %-escape in an ID is just an invalid ID (400), not a crash
function decodePathSegment(segment) {
  try { return decodeURIComponent(segment); } catch { return segment; }
}

// DIP Decision Logic - Corrected
function calculateDIPDecision(annualIncome, loanAmount, existingCommitments) {
  // Validation
  if (!annualIncome || loanAmount === undefined) {
    return { error: 'Missing required fields', details: ['annualIncome', 'loanAmount'] };
  }
  
  if (typeof annualIncome !== 'number' || typeof loanAmount !== 'number') {
    return { error: 'Invalid data types', details: ['annualIncome and loanAmount must be numbers'] };
  }
  
  if (annualIncome <= 0 || loanAmount < 0) {
    return { error: 'Invalid values', details: ['annualIncome must be > 0, loanAmount must be >= 0'] };
  }

  // Calculate borrowing power (standard: 4.5x income)
  const maxBorrowing = annualIncome * 4.5;
  const monthlyIncome = annualIncome / 12;
  const monthlyCommitments = existingCommitments || 0;
  const loanToIncomeRatio = loanAmount / annualIncome;

  // Decision logic - Priority order matters
  let decision = 'Accepted';
  let reason = 'Within standard affordability limits';

  // First priority: Check existing commitments (debt-to-income ratio)
  // If monthly commitments exceed 40% of monthly income, DECLINE
  if (monthlyCommitments > monthlyIncome * 0.4) {
    decision = 'Declined';
    reason = 'Existing credit commitments exceed affordability threshold (DTI > 40%).';
  }
  // Second priority: Check loan-to-income ratio
  // If loan > 4.5x income, REFER for manual review
  else if (loanToIncomeRatio > 4.5) {
    decision = 'Referred';
    reason = 'Loan amount exceeds 4.5x income multiple. Manual underwriting required.';
  }
  // Otherwise: Approved

  return {
    decision,
    reason,
    borrowingPower: Math.round(maxBorrowing),
    maxBorrowing: Math.round(loanAmount <= maxBorrowing ? loanAmount : maxBorrowing),
    loanToIncomeRatio: parseFloat(loanToIncomeRatio.toFixed(2)),
    monthlyAffordability: Math.round((monthlyIncome - monthlyCommitments) / 200)
  };
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check / UI page
  if ((pathname === '/' || pathname === '/mortgages/decision-in-principle') && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(`
      <html>
        <head><title>DIP Mortgage</title></head>
        <body>
          <h1>Mortgage Decision-in-Principle</h1>
          <form id="dip-form">
            <input id="applicant-annual-income" data-testid="applicant-annual-income" placeholder="Annual Income" />
            <input id="monthly-commitments" data-testid="monthly-commitments" placeholder="Monthly Commitments" />
            <input id="requested-loan-amount" data-testid="requested-loan-amount" placeholder="Loan Amount" />
            <button id="get-decision" data-testid="get-decision" type="button">Get Decision</button>
          </form>
          <div id="decision-badge" data-testid="decision-outcome" style="display:none;">Accepted</div>
          <div id="max-borrowing" data-testid="max-borrowing-amount" style="display:none;">£250,000</div>
          <div id="referral-guidance" data-testid="referral-guidance" style="display:none;"></div>
          <script>
            document.getElementById('get-decision').addEventListener('click', async function() {
              const income = parseFloat(document.getElementById('applicant-annual-income').value);
              const commitments = parseFloat(document.getElementById('monthly-commitments').value) || 0;
              const loanAmount = parseFloat(document.getElementById('requested-loan-amount').value);
              
              try {
                const response = await fetch('/api/mortgages/dip/decision', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    annualIncome: income,
                    loanAmount: loanAmount,
                    existingCommitments: commitments
                  })
                });
                
                const result = await response.json();
                if (result.decision) {
                  document.getElementById('decision-badge').textContent = result.decision;
                  document.getElementById('decision-badge').style.display = 'block';
                  document.getElementById('max-borrowing').textContent = '£' + result.borrowingPower.toLocaleString();
                  document.getElementById('max-borrowing').style.display = 'block';
                  const guidance = document.getElementById('referral-guidance');
                  if (result.decision === 'Referred') {
                    guidance.textContent = result.reason;
                    guidance.style.display = 'block';
                  } else {
                    guidance.style.display = 'none';
                  }
                }
              } catch (e) {
                console.error('Error calling API:', e);
              }
            });
          </script>
        </body>
      </html>
    `);
    res.end();
    return;
  }

  // API: DIP Decision
  if (pathname === '/api/mortgages/dip/decision' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = parseJsonObject(body);
        const result = calculateDIPDecision(data.annualIncome, data.loanAmount, data.existingCommitments);
        
        if (result.error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } else {
          // Same as aip-api: an application ID first, then the original fields unchanged
          const applicationId = newApplicationId();
          saveAndPublish(applicationId, {
            annualIncome: data.annualIncome,
            monthlyCommitments: data.existingCommitments || 0,
            loanAmount: data.loanAmount
          }, result);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ applicationId, ...result }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // API: Calculate Borrowing Power
  if (pathname === '/api/mortgages/dip/calculate-borrowing-power' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = parseJsonObject(body);
        if (!data.annualIncome) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing annualIncome' }));
          return;
        }
        
        const borrowingPower = data.annualIncome * 4.5;
        const commitment = data.existingCommitments || 0;
        const maxLoan = borrowingPower - (commitment * 12);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          borrowingPower: Math.round(borrowingPower),
          maxLoan: Math.round(Math.max(0, maxLoan)),
          annualIncome: data.annualIncome,
          existingCommitments: commitment
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // API: saved application (aip-api, persistence on)
  const applicationMatch = pathname.match(/^\/api\/applications\/([^/]+)$/);
  if (applicationMatch && req.method === 'GET') {
    const applicationId = decodePathSegment(applicationMatch[1]);
    if (!APPLICATION_ID.test(applicationId)) {
      sendJson(res, 400, { error: 'Invalid application ID', details: ['Expected AIP-yyyyMMdd-XXXXXXXX'] });
    } else if (!applications.has(applicationId)) {
      sendJson(res, 404, { error: 'Application not found' });
    } else {
      sendJson(res, 200, applications.get(applicationId));
    }
    return;
  }

  // API: audit trail (aip-audit-service)
  const auditMatch = pathname.match(/^\/api\/audit\/([^/]+)$/);
  if (auditMatch && req.method === 'GET') {
    const applicationId = decodePathSegment(auditMatch[1]);
    if (!APPLICATION_ID.test(applicationId)) {
      sendJson(res, 400, { error: 'Invalid application ID', details: ['Expected AIP-yyyyMMdd-XXXXXXXX'] });
    } else {
      sendJson(res, 200, { applicationId, events: auditTrails.get(applicationId) || [] });
    }
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(3000, () => {
  console.log('✅ Mock server running at http://localhost:3000');
  console.log('   📝 GET  / - Serves DIP HTML form');
  console.log('   🔌 POST /api/mortgages/dip/decision - DIP decision endpoint');
  console.log('   🔌 POST /api/mortgages/dip/calculate-borrowing-power - Calculator endpoint');
  console.log('   🔌 GET  /api/applications/:id - Saved application');
  console.log('   🔌 GET  /api/audit/:id - Audit trail of decision events\n');
});
