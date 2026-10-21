const http = require('http');
const https = require('https');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const applicants = require('./test-data/applicants.json');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function toDecisionRequest(applicant) {
  return {
    annualIncome: applicant.annualIncome,
    loanAmount: applicant.requestedLoan,
    existingCommitments: applicant.monthlyCommitments
  };
}

class APITester {
  constructor(baseUrl = process.env.BASE_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + path);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => { responseData += chunk; });
        res.on('end', () => {
          try {
            const body = responseData ? JSON.parse(responseData) : null;
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: body
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: null,
              rawBody: responseData
            });
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async test(name, method, path, data, expectations) {
    console.log(`\n🔄 Testing: ${name}`);
    const startTime = Date.now();

    try {
      const response = await this.makeRequest(method, path, data);
      const duration = Date.now() - startTime;

      let passed = true;
      const errors = [];

      // Check status code
      if (expectations.status && response.status !== expectations.status) {
        passed = false;
        errors.push(`Expected status ${expectations.status}, got ${response.status}`);
      }

      if (expectations.contract) {
        const { contentType, fields, enums } = expectations.contract;
        const actualContentType = response.headers['content-type']
          ?.split(';')[0]
          .trim()
          .toLowerCase();

        if (actualContentType !== contentType.toLowerCase()) {
          passed = false;
          errors.push(`Expected content type ${contentType}, got ${actualContentType || 'none'}`);
        }

        if (!response.body || typeof response.body !== 'object' || Array.isArray(response.body)) {
          passed = false;
          errors.push('Expected response body to be a JSON object');
        } else {
          for (const [field, expectedType] of Object.entries(fields)) {
            if (!Object.prototype.hasOwnProperty.call(response.body, field)) {
              passed = false;
              errors.push(`Missing contract field: ${field}`);
            } else if (typeof response.body[field] !== expectedType) {
              passed = false;
              errors.push(`Expected ${field} to be ${expectedType}, got ${typeof response.body[field]}`);
            }
          }

          for (const [field, allowedValues] of Object.entries(enums)) {
            if (Object.prototype.hasOwnProperty.call(response.body, field)
              && !allowedValues.includes(response.body[field])) {
              passed = false;
              errors.push(`Unexpected ${field} value: ${response.body[field]}`);
            }
          }
        }
      }

      // Check response body fields (only for JSON responses)
      if (expectations.bodyFields && response.body) {
        for (const field of expectations.bodyFields) {
          if (!(field in response.body)) {
            passed = false;
            errors.push(`Missing field: ${field}`);
          }
        }
      }

      // Check specific values
      if (expectations.values && response.body) {
        for (const [field, value] of Object.entries(expectations.values)) {
          if (response.body[field] !== value) {
            passed = false;
            errors.push(`Expected ${field}=${value}, got ${response.body[field]}`);
          }
        }
      }

      if (passed) {
        console.log(`   ✅ PASSED in ${duration}ms`);
        this.passed++;
      } else {
        console.log(`   ❌ FAILED in ${duration}ms`);
        errors.forEach(e => console.log(`      - ${e}`));
        this.failed++;
      }

      this.results.push({
        name,
        method,
        path,
        passed,
        status: response.status,
        duration,
        errors
      });

    } catch (error) {
      // A refused connection to "localhost" arrives as an AggregateError with an empty message
      const reason = error.message || error.code || error.errors?.[0]?.code || String(error);
      error.message = `${reason} (${this.baseUrl})`;
      console.log(`   ❌ ERROR: ${error.message}`);
      this.failed++;
      this.results.push({
        name,
        method,
        path,
        passed: false,
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  }

  async runAllTests() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║              🌐 API TEST SUITE                          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Test 1: Health Check - just check if server responds
    await this.test(
      'Health Check - Server Running',
      'GET',
      '/',
      null,
      { status: 200 }
    );

    // Test 2: DIP Decision - Happy Path (Approved)
    await this.test(
      'DIP Decision - Approved Applicant',
      'POST',
      '/api/mortgages/dip/decision',
      toDecisionRequest(applicants.standardApplicant),
      {
        status: 200,
        bodyFields: ['decision', 'maxBorrowing', 'borrowingPower'],
        values: { decision: 'Accepted' }
      }
    );

    // Contract: the decision endpoint returns a stable JSON response shape.
    await this.test(
      'Contract - DIP Decision Response',
      'POST',
      '/api/mortgages/dip/decision',
      toDecisionRequest(applicants.standardApplicant),
      {
        status: 200,
        contract: {
          contentType: 'application/json',
          fields: {
            decision: 'string',
            reason: 'string',
            borrowingPower: 'number',
            maxBorrowing: 'number',
            loanToIncomeRatio: 'number',
            monthlyAffordability: 'number'
          },
          enums: {
            decision: ['Accepted', 'Referred', 'Declined']
          }
        }
      }
    );

    // Test 3: DIP Decision - Referred
    await this.test(
      'DIP Decision - Referred Applicant',
      'POST',
      '/api/mortgages/dip/decision',
      toDecisionRequest(applicants.referredApplicant),
      {
        status: 200,
        bodyFields: ['decision', 'reason'],
        values: { decision: 'Referred' }
      }
    );

    // Test 4: DIP Decision - Declined
    await this.test(
      'DIP Decision - Declined Applicant',
      'POST',
      '/api/mortgages/dip/decision',
      toDecisionRequest(applicants.declinedApplicant),
      {
        status: 200,
        bodyFields: ['decision'],
        values: { decision: 'Declined' }
      }
    );

    // Test 5: Missing Required Fields
    await this.test(
      'Validation - Missing annualIncome',
      'POST',
      '/api/mortgages/dip/decision',
      {
        loanAmount: 150000,
        existingCommitments: 0
      },
      {
        status: 400
      }
    );

    // Test 6: Invalid Data Type
    await this.test(
      'Validation - Invalid annualIncome (non-numeric)',
      'POST',
      '/api/mortgages/dip/decision',
      {
        annualIncome: 'invalid',
        loanAmount: 150000,
        existingCommitments: 0
      },
      {
        status: 400
      }
    );

    // Test 7: Negative Values
    await this.test(
      'Validation - Negative loan amount',
      'POST',
      '/api/mortgages/dip/decision',
      {
        annualIncome: 45000,
        loanAmount: -50000,
        existingCommitments: 0
      },
      {
        status: 400
      }
    );

    // Test 8: Edge Case - Zero Income
    await this.test(
      'Edge Case - Zero annual income',
      'POST',
      '/api/mortgages/dip/decision',
      {
        annualIncome: 0,
        loanAmount: 100000,
        existingCommitments: 0
      },
      {
        status: 400
      }
    );

    // Test 9: High LTV Ratio
    await this.test(
      'High LTV - Max Allowed Borrowing',
      'POST',
      '/api/mortgages/dip/decision',
      {
        annualIncome: 100000,
        loanAmount: 400000,
        existingCommitments: 500
      },
      {
        status: 200,
        bodyFields: ['decision', 'maxBorrowing']
      }
    );

    // Test 10: Calculator Endpoint
    await this.test(
      'Affordability Calculator',
      'POST',
      '/api/mortgages/dip/calculate-borrowing-power',
      {
        annualIncome: 50000,
        existingCommitments: 200
      },
      {
        status: 200,
        bodyFields: ['borrowingPower', 'maxLoan']
      }
    );

    return this.displayResults();
  }

  displayResults() {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                  ✅ API TEST COMPLETE                    ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    const total = this.passed + this.failed;
    const passRate = total ? ((this.passed / total) * 100).toFixed(1) : '0.0';

    console.log('📊 SUMMARY:');
    console.log(`   Total Tests: ${total}`);
    console.log(`   ✅ Passed: ${this.passed}`);
    console.log(`   ❌ Failed: ${this.failed}`);
    console.log(`   📈 Pass Rate: ${passRate}%\n`);

    console.log('📋 TEST RESULTS:\n');
    this.results.forEach((result, index) => {
      const icon = result.passed ? '✅' : '❌';
      const method = result.method || 'N/A';
      const path = result.path || 'N/A';
      console.log(`${index + 1}. ${icon} ${result.name}`);
      console.log(`   ${method} ${path}`);
      if (result.status) console.log(`   Status: ${result.status}`);
      if (result.duration) console.log(`   Duration: ${result.duration}ms`);
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(e => console.log(`   Error: ${e}`));
      }
      console.log('');
    });

    const reportPath = path.join(__dirname, 'api-test-report.html');
    const rows = this.results.map((result, index) => {
      const errors = [
        ...(result.errors || []),
        ...(result.error ? [result.error] : [])
      ];
      const details = errors.length
        ? `<ul>${errors.map(error => `<li>${escapeHtml(error)}</li>`).join('')}</ul>`
        : '';

      return `<tr class="${result.passed ? 'passed' : 'failed'}">
        <td>${index + 1}</td>
        <td><span class="badge">${result.passed ? 'PASSED' : 'FAILED'}</span></td>
        <td>${escapeHtml(result.name)}</td>
        <td><code>${escapeHtml(result.method || 'N/A')} ${escapeHtml(result.path || 'N/A')}</code>${details}</td>
        <td>${escapeHtml(result.status ?? '—')}</td>
        <td>${escapeHtml(result.duration ?? '—')} ms</td>
      </tr>`;
    }).join('\n');

    const report = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>API Test Report</title>
  <style>
    body { font: 16px system-ui, sans-serif; margin: 2rem auto; max-width: 1100px; padding: 0 1rem; color: #202124; }
    h1 { margin-bottom: .25rem; }
    .meta { color: #5f6368; margin-top: 0; }
    .summary { display: flex; flex-wrap: wrap; gap: 1rem; margin: 1.5rem 0; }
    .summary div { background: #f1f3f4; border-radius: .5rem; padding: 1rem; min-width: 120px; }
    .summary strong { display: block; font-size: 1.4rem; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border-bottom: 1px solid #dadce0; padding: .75rem; text-align: left; vertical-align: top; }
    th { background: #f8f9fa; }
    .passed .badge { color: #137333; }
    .failed .badge { color: #c5221f; }
    code { overflow-wrap: anywhere; }
    ul { color: #c5221f; margin: .5rem 0 0; padding-left: 1.25rem; }
    @media (max-width: 700px) { body { margin-top: 1rem; } th, td { padding: .5rem; } }
  </style>
</head>
<body>
  <h1>API Test Report</h1>
  <p class="meta">Generated ${escapeHtml(new Date().toLocaleString())} · ${escapeHtml(this.baseUrl)}</p>
  <section class="summary" aria-label="Test summary">
    <div>Total tests<strong>${total}</strong></div>
    <div>Passed<strong>${this.passed}</strong></div>
    <div>Failed<strong>${this.failed}</strong></div>
    <div>Pass rate<strong>${passRate}%</strong></div>
  </section>
  <table>
    <thead><tr><th>#</th><th>Result</th><th>Test</th><th>Request</th><th>Status</th><th>Duration</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

    fs.writeFileSync(reportPath, report);
    console.log(`📄 API report saved to: ${reportPath}`);

    // JUnit XML for Jenkins (junit '**/reports/**/*.xml') and the Allure report
    const reportDir = path.join(__dirname, 'reports');
    fs.mkdirSync(reportDir, { recursive: true });
    const cases = this.results.map(result => {
      const errors = [...(result.errors || []), ...(result.error ? [result.error] : [])];
      const failure = result.passed ? '' : `<failure message="${escapeHtml(errors.join('; ') || 'Failed')}"/>`;
      return `  <testcase classname="api" name="${escapeHtml(result.name)}" time="${((result.duration || 0) / 1000).toFixed(3)}">${failure}</testcase>`;
    }).join('\n');
    fs.writeFileSync(path.join(reportDir, 'api-tests.xml'),
      `<?xml version="1.0" encoding="UTF-8"?>\n<testsuite name="API" tests="${this.results.length}" failures="${this.failed}">\n${cases}\n</testsuite>\n`);

    return this.failed === 0;
  }
}

// Run tests
const tester = new APITester();
tester.runAllTests()
  .then(async success => {
    const reportPath = path.join(__dirname, 'api-test-report.html');

    if (process.env.CI || !process.stdout.isTTY) {
      console.log(`Open the API report in a browser: ${reportPath}`);
    } else {
      const openCommand = process.platform === 'darwin'
        ? ['open', [reportPath]]
        : process.platform === 'win32'
          ? ['cmd', ['/c', 'start', '', reportPath]]
          : ['xdg-open', [reportPath]];

      console.log('🌐 Opening API report in your browser...');
      await new Promise(resolve => {
        execFile(openCommand[0], openCommand[1], error => {
          if (error) {
            console.error(`Could not open the report automatically: ${error.message}`);
            console.log(`Open it manually in a browser: ${reportPath}`);
          }
          resolve();
        });
      });
    }

    process.exitCode = success ? 0 : 1;
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exitCode = 1;
  });
