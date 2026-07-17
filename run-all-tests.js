const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const tests = [
  { name: 'Functional Tests (Smoke)', cmd: 'npm', args: ['run', 'test:smoke'], type: 'functional' },
  { name: 'Performance Tests', cmd: 'npm', args: ['run', 'test:perf'], type: 'performance' },
  { name: 'Stress Tests', cmd: 'npm', args: ['run', 'test:stress'], type: 'stress' },
  { name: 'Accessibility Tests', cmd: 'npm', args: ['run', 'test:a11y'], type: 'accessibility' }
];

const results = {
  summary: { totalTests: 4, passed: 0, failed: 0, startTime: new Date() },
  tests: []
};

async function runTest(test) {
  console.log(`\n🔄 Running: ${test.name}...`);
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    let output = '';
    let errorOutput = '';
    
    const proc = spawn(test.cmd, test.args, { cwd: process.cwd() });
    
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    proc.on('close', (code) => {
      const duration = Date.now() - startTime;
      const passed = code === 0;
      
      results.tests.push({
        name: test.name,
        type: test.type,
        passed: passed,
        duration: duration,
        output: output,
        error: errorOutput,
        exitCode: code
      });
      
      if (passed) {
        results.summary.passed++;
        console.log(`✅ ${test.name} - PASSED (${duration}ms)`);
      } else {
        results.summary.failed++;
        console.log(`❌ ${test.name} - FAILED (${duration}ms)`);
      }
      
      resolve(passed);
    });
  });
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║          🚀 COMPREHENSIVE TEST SUITE                    ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  for (const test of tests) {
    await runTest(test);
  }
  
  results.summary.endTime = new Date();
  results.summary.totalDuration = results.summary.endTime - results.summary.startTime;
  
  return results;
}

function generateHTMLReport(results) {
  const passRate = ((results.summary.passed / results.summary.totalTests) * 100).toFixed(1);
  const totalMinutes = Math.floor(results.summary.totalDuration / 60000);
  const totalSeconds = Math.floor((results.summary.totalDuration % 60000) / 1000);
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Execution Report - Agentic QA Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      background: white;
      border-radius: 10px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .header h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 32px;
    }
    .header p {
      color: #666;
      font-size: 14px;
    }
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    .card-value {
      font-size: 32px;
      font-weight: bold;
      margin: 10px 0;
    }
    .card-label {
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .passed { color: #4caf50; }
    .failed { color: #f44336; }
    .neutral { color: #2196f3; }
    .warning { color: #ff9800; }
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #eee;
      border-radius: 4px;
      margin-top: 10px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4caf50, #45a049);
      transition: width 0.3s ease;
    }
    .tests-section {
      background: white;
      border-radius: 10px;
      padding: 30px;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .tests-section h2 {
      color: #333;
      margin-bottom: 20px;
      font-size: 24px;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }
    .test-item {
      padding: 20px;
      border-left: 4px solid #ddd;
      margin-bottom: 15px;
      background: #fafafa;
      border-radius: 4px;
      transition: all 0.3s ease;
    }
    .test-item:hover {
      background: #f0f0f0;
      transform: translateX(5px);
    }
    .test-item.passed {
      border-left-color: #4caf50;
      background: #f1f8f4;
    }
    .test-item.failed {
      border-left-color: #f44336;
      background: #fef5f4;
    }
    .test-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .test-name {
      font-weight: bold;
      color: #333;
      font-size: 16px;
    }
    .test-status {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-passed {
      background: #4caf50;
      color: white;
    }
    .status-failed {
      background: #f44336;
      color: white;
    }
    .test-meta {
      display: flex;
      gap: 20px;
      font-size: 13px;
      color: #666;
      margin-top: 8px;
    }
    .test-badge {
      display: inline-block;
      background: #e0e0e0;
      padding: 3px 8px;
      border-radius: 3px;
      margin-right: 5px;
    }
    .footer {
      background: white;
      border-radius: 10px;
      padding: 20px 30px;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      text-align: center;
      color: #666;
    }
    .badge-functional { background: #e3f2fd; color: #1976d2; }
    .badge-performance { background: #f3e5f5; color: #7b1fa2; }
    .badge-stress { background: #fff3e0; color: #e65100; }
    .badge-accessibility { background: #e8f5e9; color: #2e7d32; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 Comprehensive Test Execution Report</h1>
      <p>Agentic QA Demo - Banking BDD Framework</p>
      <div class="summary-cards">
        <div class="card">
          <div class="card-label">Total Tests</div>
          <div class="card-value neutral">${results.summary.totalTests}</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: 100%"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-label">✅ Passed</div>
          <div class="card-value passed">${results.summary.passed}</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(results.summary.passed/results.summary.totalTests)*100}%"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-label">❌ Failed</div>
          <div class="card-value failed">${results.summary.failed}</div>
          <div class="progress-bar">
            <div class="progress-fill" style="background: linear-gradient(90deg, #f44336, #d32f2f); width: ${(results.summary.failed/results.summary.totalTests)*100}%"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-label">Pass Rate</div>
          <div class="card-value ${passRate === '100' ? 'passed' : passRate >= 80 ? 'warning' : 'failed'}">${passRate}%</div>
        </div>
        <div class="card">
          <div class="card-label">Duration</div>
          <div class="card-value neutral">${totalMinutes}m ${totalSeconds}s</div>
        </div>
        <div class="card">
          <div class="card-label">Timestamp</div>
          <div class="card-value" style="font-size: 14px; color: #666;">
            ${new Date(results.summary.startTime).toLocaleString()}
          </div>
        </div>
      </div>
    </div>

    <div class="tests-section">
      <h2>📋 Test Results</h2>
      ${results.tests.map(test => `
        <div class="test-item ${test.passed ? 'passed' : 'failed'}">
          <div class="test-header">
            <div class="test-name">
              ${test.passed ? '✅' : '❌'} ${test.name}
            </div>
            <span class="test-status ${test.passed ? 'status-passed' : 'status-failed'}">
              ${test.passed ? 'PASSED' : 'FAILED'}
            </span>
          </div>
          <div class="test-meta">
            <span><strong>Duration:</strong> ${test.duration}ms</span>
            <span><strong>Type:</strong> <span class="test-badge badge-${test.type}">${test.type.charAt(0).toUpperCase() + test.type.slice(1)}</span></span>
            <span><strong>Exit Code:</strong> ${test.exitCode}</span>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <p>Generated on ${new Date().toLocaleString()} | Framework Version 1.0.0</p>
      <p style="margin-top: 10px; font-size: 12px;">
        Report generated by agentic-qa-demo test automation framework
      </p>
    </div>
  </div>
</body>
</html>
  `;
  
  return html;
}

// Main execution
runAllTests()
  .then(results => {
    const html = generateHTMLReport(results);
    const reportPath = path.join(process.cwd(), 'test-report.html');
    fs.writeFileSync(reportPath, html);
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                  ✅ TEST SUITE COMPLETE                  ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log(`📊 SUMMARY:`);
    console.log(`  Total Tests: ${results.summary.totalTests}`);
    console.log(`  Passed: ${results.summary.passed} ✅`);
    console.log(`  Failed: ${results.summary.failed} ❌`);
    console.log(`  Pass Rate: ${((results.summary.passed/results.summary.totalTests)*100).toFixed(1)}%`);
    console.log(`  Total Duration: ${Math.floor(results.summary.totalDuration/1000)}s\n`);
    
    console.log(`📄 Report saved to: ${reportPath}`);
    console.log(`\n🌐 Opening report in browser...\n`);
    
    // Open in browser (macOS)
    require('child_process').exec(`open "${reportPath}"`);
    
    process.exit(results.summary.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Error running tests:', error);
    process.exit(1);
  });
