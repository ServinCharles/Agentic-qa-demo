const http = require('http');
const url = require('url');

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
        const data = JSON.parse(body);
        const result = calculateDIPDecision(data.annualIncome, data.loanAmount, data.existingCommitments);
        
        if (result.error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
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
        const data = JSON.parse(body);
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

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(3000, () => {
  console.log('✅ Mock server running at http://localhost:3000');
  console.log('   📝 GET  / - Serves DIP HTML form');
  console.log('   🔌 POST /api/mortgages/dip/decision - DIP decision endpoint');
  console.log('   🔌 POST /api/mortgages/dip/calculate-borrowing-power - Calculator endpoint\n');
});
