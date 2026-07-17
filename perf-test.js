const { remote } = require('webdriverio');

const performanceMetrics = {
  pageLoadTimes: [],
  operationTimes: [],
  totalDuration: 0,
  startTime: 0
};

async function runPerformanceTest() {
  console.log('🚀 Starting Performance Tests...\n');
  
  const browser = await remote({
    logLevel: 'error',
    capabilities: {
      browserName: 'chrome'
    }
  });

  try {
    performanceMetrics.startTime = Date.now();

    // Test 1: Page Load Time
    console.log('📊 Test 1: Page Load Time');
    const loadStart = Date.now();
    await browser.url('http://localhost:3000/mortgages/decision-in-principle');
    const loadTime = Date.now() - loadStart;
    performanceMetrics.pageLoadTimes.push(loadTime);
    console.log(`   ✓ Page loaded in ${loadTime}ms\n`);

    // Test 2: Input Field Population
    console.log('📊 Test 2: Form Input Performance');
    const inputStart = Date.now();
    const incomeInput = await browser.$('[data-testid="applicant-annual-income"]');
    await incomeInput.setValue('45000');
    const inputTime = Date.now() - inputStart;
    performanceMetrics.operationTimes.push({ name: 'Income Input', duration: inputTime });
    console.log(`   ✓ Income input in ${inputTime}ms\n`);

    // Test 3: Multiple Field Population
    console.log('📊 Test 3: Multiple Field Population');
    const multiStart = Date.now();
    
    const commitmentInput = await browser.$('[data-testid="monthly-commitments"]');
    await commitmentInput.setValue('0');
    
    const loanInput = await browser.$('[data-testid="requested-loan-amount"]');
    await loanInput.setValue('150000');
    
    const multiTime = Date.now() - multiStart;
    performanceMetrics.operationTimes.push({ name: 'Multiple Inputs', duration: multiTime });
    console.log(`   ✓ All inputs populated in ${multiTime}ms\n`);

    // Test 4: Button Click Response
    console.log('📊 Test 4: Button Click & Response');
    const clickStart = Date.now();
    const button = await browser.$('[data-testid="get-decision"]');
    await button.click();
    
    // Wait for decision result to appear
    const result = await browser.$('[data-testid="decision-outcome"]');
    await result.waitForDisplayed();
    const clickTime = Date.now() - clickStart;
    performanceMetrics.operationTimes.push({ name: 'Button Click & Response', duration: clickTime });
    console.log(`   ✓ Button click & response in ${clickTime}ms\n`);

    // Test 5: Element Visibility Check
    console.log('📊 Test 5: Element Visibility Check');
    const visStart = Date.now();
    const maxAmount = await browser.$('[data-testid="max-borrowing-amount"]');
    const isDisplayed = await maxAmount.isDisplayed();
    const visTime = Date.now() - visStart;
    performanceMetrics.operationTimes.push({ name: 'Visibility Check', duration: visTime });
    console.log(`   ✓ Visibility check in ${visTime}ms (Visible: ${isDisplayed})\n`);

    // Test 6: Text Extraction
    console.log('📊 Test 6: Text Extraction');
    const textStart = Date.now();
    const decisionText = await result.getText();
    const textTime = Date.now() - textStart;
    performanceMetrics.operationTimes.push({ name: 'Text Extraction', duration: textTime });
    console.log(`   ✓ Text extracted in ${textTime}ms: "${decisionText}"\n`);

    performanceMetrics.totalDuration = Date.now() - performanceMetrics.startTime;

  } finally {
    await browser.deleteSession();
  }

  return performanceMetrics;
}

function generateReport(metrics) {
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('📈 PERFORMANCE TEST REPORT\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // Summary Statistics
  console.log('📊 SUMMARY\n');
  console.log(`  Total Test Duration: ${metrics.totalDuration}ms`);
  console.log(`  Number of Operations: ${metrics.operationTimes.length}\n`);

  // Page Load Metrics
  console.log('📄 PAGE LOAD METRICS\n');
  const avgLoad = metrics.pageLoadTimes.reduce((a, b) => a + b, 0) / metrics.pageLoadTimes.length;
  const minLoad = Math.min(...metrics.pageLoadTimes);
  const maxLoad = Math.max(...metrics.pageLoadTimes);
  
  console.log(`  Average Load Time: ${avgLoad.toFixed(2)}ms`);
  console.log(`  Min Load Time: ${minLoad}ms`);
  console.log(`  Max Load Time: ${maxLoad}ms`);
  
  if (avgLoad < 1000) {
    console.log('  ✅ PASS - Page loads quickly (< 1000ms)\n');
  } else if (avgLoad < 3000) {
    console.log('  ⚠️  WARNING - Page load slightly slow (1000-3000ms)\n');
  } else {
    console.log('  ❌ FAIL - Page load very slow (> 3000ms)\n');
  }

  // Operation Metrics
  console.log('⚙️  OPERATION PERFORMANCE\n');
  
  metrics.operationTimes.forEach(op => {
    let status = '✅';
    let threshold = 500;
    
    if (op.name.includes('Button Click')) threshold = 1500;
    if (op.name.includes('Wait')) threshold = 2000;
    
    if (op.duration > threshold) status = '❌';
    else if (op.duration > threshold * 0.8) status = '⚠️ ';
    
    console.log(`  ${status} ${op.name.padEnd(35)} ${op.duration}ms`);
  });

  // Average operation time
  const avgOp = metrics.operationTimes.reduce((sum, op) => sum + op.duration, 0) / metrics.operationTimes.length;
  console.log(`\n  Average Operation Time: ${avgOp.toFixed(2)}ms\n`);

  // Performance Grade
  console.log('📈 PERFORMANCE GRADE\n');
  
  const allTimes = [
    ...metrics.pageLoadTimes,
    ...metrics.operationTimes.map(o => o.duration)
  ];
  const avgAll = allTimes.reduce((a, b) => a + b, 0) / allTimes.length;
  
  let grade = 'A';
  if (avgAll > 500) grade = 'B';
  if (avgAll > 1000) grade = 'C';
  if (avgAll > 2000) grade = 'D';
  if (avgAll > 3000) grade = 'F';
  
  console.log(`  Overall Average: ${avgAll.toFixed(2)}ms`);
  console.log(`  Performance Grade: ${grade}\n`);

  // Recommendations
  console.log('💡 RECOMMENDATIONS\n');
  const slowOps = metrics.operationTimes.filter(op => op.duration > 1000);
  
  if (slowOps.length > 0) {
    console.log('  The following operations are slow:');
    slowOps.forEach(op => {
      console.log(`    • ${op.name} (${op.duration}ms)`);
    });
    console.log('  Consider optimizing these operations.\n');
  } else {
    console.log('  ✅ All operations are performing well!\n');
  }

  console.log('═══════════════════════════════════════════════════════\n');
}

// Run the test
runPerformanceTest()
  .then(metrics => {
    generateReport(metrics);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Performance test failed:', error);
    process.exit(1);
  });
