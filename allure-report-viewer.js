const fs = require('fs');
const path = require('path');
const http = require('http');

const resultsDir = './allure-results';
const resultsFiles = fs.readdirSync(resultsDir).filter(f => f.endsWith('-result.json'));

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let tests = [];

resultsFiles.forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'));
  const status = data.status || 'unknown';
  
  totalTests++;
  if (status === 'passed') passedTests++;
  if (status === 'failed') failedTests++;
  
  tests.push({
    name: data.name,
    status: status,
    duration: (data.stop - data.start) || 0
  });
});

const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Report - Allure</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .summary { background: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .stats { display: flex; gap: 20px; margin-top: 15px; }
    .stat { padding: 10px 15px; border-radius: 5px; color: white; }
    .passed { background: #4caf50; }
    .failed { background: #f44336; }
    .total { background: #2196f3; }
    .tests { background: white; padding: 20px; border-radius: 5px; }
    .test { padding: 10px; border-bottom: 1px solid #eee; }
    .test.passed::before { content: '✓ '; color: #4caf50; font-weight: bold; }
    .test.failed::before { content: '✗ '; color: #f44336; font-weight: bold; }
    h1 { color: #333; }
    .duration { color: #999; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>Test Execution Report</h1>
  <div class="summary">
    <h2>Summary</h2>
    <div class="stats">
      <div class="stat total">Total: ${totalTests}</div>
      <div class="stat passed">Passed: ${passedTests}</div>
      <div class="stat failed">Failed: ${failedTests}</div>
    </div>
  </div>
  
  <div class="tests">
    <h2>Test Results</h2>
    ${tests.map(t => `
      <div class="test ${t.status}">
        ${t.name} <span class="duration">(${t.duration}ms)</span>
      </div>
    `).join('')}
  </div>
</body>
</html>
`;

// Start a simple server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write(html);
  res.end();
});

server.listen(5555, () => {
  console.log('📊 Allure Report Viewer running at http://localhost:5555');
  console.log('Press Ctrl+C to stop');
});
