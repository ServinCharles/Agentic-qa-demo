const { remote } = require('webdriverio');

async function stressTest(iterations = 5) {
  console.log(`🔥 Starting Stress Test (${iterations} iterations)...\n`);
  
  const results = {
    iterations: [],
    totalTime: 0,
    errors: 0
  };
  
  const startTotal = Date.now();
  
  for (let i = 1; i <= iterations; i++) {
    console.log(`🔄 Iteration ${i}/${iterations}`);
    
    const browser = await remote({
      logLevel: 'error',
      capabilities: {
        browserName: 'chrome'
      }
    });
    
    try {
      const iterStart = Date.now();
      
      // Load page
      await browser.url('http://localhost:3000/mortgages/decision-in-principle');
      
      // Fill form
      const income = await browser.$('[data-testid="applicant-annual-income"]');
      await income.setValue(Math.floor(Math.random() * 100000 + 20000).toString());
      
      const commitment = await browser.$('[data-testid="monthly-commitments"]');
      await commitment.setValue(Math.floor(Math.random() * 2000).toString());
      
      const loan = await browser.$('[data-testid="requested-loan-amount"]');
      await loan.setValue(Math.floor(Math.random() * 300000 + 50000).toString());
      
      // Click button
      const button = await browser.$('[data-testid="get-decision"]');
      await button.click();
      
      // Wait for result
      const result = await browser.$('[data-testid="decision-outcome"]');
      await result.waitForDisplayed();
      
      const iterTime = Date.now() - iterStart;
      results.iterations.push(iterTime);
      
      console.log(`   ✓ Completed in ${iterTime}ms\n`);
      
    } catch (error) {
      results.errors++;
      console.log(`   ❌ Error: ${error.message}\n`);
    } finally {
      await browser.deleteSession();
    }
  }
  
  results.totalTime = Date.now() - startTotal;
  return results;
}

function generateStressReport(results) {
  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('🔥 STRESS TEST REPORT\n');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Basic Stats
  console.log('📊 TEST STATISTICS\n');
  console.log(`  Total Iterations: ${results.iterations.length}`);
  console.log(`  Successful: ${results.iterations.length - results.errors}`);
  console.log(`  Errors: ${results.errors}`);
  console.log(`  Total Duration: ${results.totalTime}ms\n`);
  
  // Performance Stats
  console.log('⚙️  PERFORMANCE METRICS\n');
  const times = results.iterations;
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const median = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];
  
  console.log(`  Average Time: ${avg.toFixed(2)}ms`);
  console.log(`  Min Time: ${min}ms`);
  console.log(`  Max Time: ${max}ms`);
  console.log(`  Median Time: ${median}ms`);
  console.log(`  Range: ${max - min}ms\n`);
  
  // Percentiles
  console.log('📈 PERCENTILES\n');
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];
  
  console.log(`  P50 (Median): ${p50 || min}ms`);
  console.log(`  P95: ${p95 || max}ms`);
  console.log(`  P99: ${p99 || max}ms\n`);
  
  // Stability Assessment
  console.log('🎯 STABILITY ASSESSMENT\n');
  const stdDev = Math.sqrt(
    times.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / times.length
  );
  const variance = (stdDev / avg) * 100;
  
  console.log(`  Standard Deviation: ${stdDev.toFixed(2)}ms`);
  console.log(`  Coefficient of Variation: ${variance.toFixed(2)}%\n`);
  
  if (variance < 10) {
    console.log('  ✅ EXCELLENT - Very stable performance\n');
  } else if (variance < 25) {
    console.log('  ✅ GOOD - Stable performance\n');
  } else if (variance < 50) {
    console.log('  ⚠️  WARNING - Some variance in performance\n');
  } else {
    console.log('  ❌ POOR - High variance, inconsistent performance\n');
  }
  
  // Success Rate
  console.log('✅ RELIABILITY\n');
  const successRate = ((results.iterations.length - results.errors) / results.iterations.length) * 100;
  console.log(`  Success Rate: ${successRate.toFixed(1)}%`);
  
  if (successRate === 100) {
    console.log('  ✅ All tests passed\n');
  } else if (successRate >= 95) {
    console.log('  ⚠️  Some failures detected\n');
  } else {
    console.log('  ❌ High failure rate\n');
  }
  
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run stress test
stressTest(5)
  .then(results => {
    generateStressReport(results);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Stress test failed:', error);
    process.exit(1);
  });
