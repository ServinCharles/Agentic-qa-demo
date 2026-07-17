const http = require('http');

class APITester {
  constructor(baseUrl = 'http://localhost:3000') {
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
        port: url.port || 80,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
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
      {
        annualIncome: 45000,
        loanAmount: 150000,
        existingCommitments: 0
      },
      {
        status: 200,
        bodyFields: ['decision', 'maxBorrowing', 'borrowingPower'],
        values: { decision: 'Accepted' }
      }
    );

    // Test 3: DIP Decision - Referred
    await this.test(
      'DIP Decision - Referred Applicant',
      'POST',
      '/api/mortgages/dip/decision',
      {
        annualIncome: 30000,
        loanAmount: 200000,
        existingCommitments: 0
      },
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
      {
        annualIncome: 45000,
        loanAmount: 150000,
        existingCommitments: 1800
      },
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

    this.displayResults();
  }

  displayResults() {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                  ✅ API TEST COMPLETE                    ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    const total = this.passed + this.failed;
    const passRate = ((this.passed / total) * 100).toFixed(1);

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

    return this.failed === 0;
  }
}

// Run tests
const tester = new APITester('http://localhost:3000');
tester.runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
