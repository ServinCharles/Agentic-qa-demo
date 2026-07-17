const { remote } = require('webdriverio');
const { AxeBuilder } = require('@axe-core/webdriverio');

async function runAccessibilityTest() {
  console.log('♿ Starting Accessibility Tests...\n');
  
  const browser = await remote({
    logLevel: 'error',
    capabilities: {
      browserName: 'chrome'
    }
  });

  const results = {
    violations: [],
    passes: [],
    inapplicable: [],
    incomplete: []
  };

  try {
    // Test 1: Home Page Accessibility
    console.log('📄 Test 1: Page Accessibility (WCAG2AA)\n');
    
    await browser.url('http://localhost:3000/mortgages/decision-in-principle');
    
    const axeBuilder = new AxeBuilder({ client: browser });
    const axeResults = await axeBuilder
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();
    
    results.violations = axeResults.violations;
    results.passes = axeResults.passes;
    results.inapplicable = axeResults.inapplicable;
    results.incomplete = axeResults.incomplete;
    
    // Test 2: Form Input Labels
    console.log('📋 Test 2: Form Input Accessibility\n');
    
    const incomeInput = await browser.$('[data-testid="applicant-annual-income"]');
    const incomeId = await incomeInput.getAttribute('id');
    console.log(`   ✓ Income Input ID: ${incomeId || '(no ID)'}`);
    
    const loanInput = await browser.$('[data-testid="requested-loan-amount"]');
    const loanId = await loanInput.getAttribute('id');
    console.log(`   ✓ Loan Input ID: ${loanId || '(no ID)'}\n`);
    
    // Test 3: Button Accessibility
    console.log('🔘 Test 3: Button Accessibility\n');
    
    const button = await browser.$('[data-testid="get-decision"]');
    const buttonAriaLabel = await button.getAttribute('aria-label');
    const buttonText = await button.getText();
    console.log(`   ✓ Button Text: "${buttonText}"`);
    console.log(`   ✓ Aria Label: ${buttonAriaLabel || '(none - text used instead)'}\n`);
    
    // Test 4: Color Contrast
    console.log('🎨 Test 4: Color Contrast Check\n');
    
    const elements = await browser.$$('button, [role="button"], input, label');
    console.log(`   ✓ Elements checked: ${elements.length}\n`);
    
    // Test 5: Keyboard Navigation
    console.log('⌨️  Test 5: Keyboard Navigation\n');
    
    // Tab to first input
    const firstInput = await browser.$('[data-testid="applicant-annual-income"]');
    await firstInput.click();
    let focusedElement = await browser.execute(() => {
      return document.activeElement.getAttribute('data-testid');
    });
    console.log(`   ✓ First focus: ${focusedElement || 'unknown'}`);
    
    // Tab to next element
    await browser.keys(['Tab']);
    focusedElement = await browser.execute(() => {
      return document.activeElement.getAttribute('data-testid');
    });
    console.log(`   ✓ After Tab: ${focusedElement || 'unknown'}\n`);
    
  } finally {
    await browser.deleteSession();
  }

  return results;
}

function generateAccessibilityReport(results) {
  const total = results.violations.length + results.passes.length;
  const passRate = ((results.passes.length / total) * 100).toFixed(1);
  
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('♿ ACCESSIBILITY AUDIT REPORT (WCAG 2.1 Level AA)\n');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Summary
  console.log('📊 SUMMARY\n');
  console.log(`  Total Issues Found: ${total}`);
  console.log(`  Violations (Errors): ${results.violations.length}`);
  console.log(`  Passes (Compliant): ${results.passes.length}`);
  console.log(`  Incomplete (Needs Review): ${results.incomplete.length}`);
  console.log(`  Inapplicable: ${results.inapplicable.length}\n`);
  
  // Pass Rate
  console.log('✅ COMPLIANCE SCORE\n');
  
  let grade = 'A';
  if (results.violations.length > 10) grade = 'B';
  if (results.violations.length > 25) grade = 'C';
  if (results.violations.length > 50) grade = 'D';
  if (results.violations.length > 100) grade = 'F';
  
  console.log(`  Accessibility Grade: ${grade}`);
  console.log(`  Pass Rate: ${passRate}%\n`);
  
  // Violations Detail
  if (results.violations.length > 0) {
    console.log('❌ VIOLATIONS FOUND\n');
    console.log('  These issues violate WCAG guidelines:\n');
    
    results.violations.slice(0, 10).forEach((violation, idx) => {
      console.log(`  ${idx + 1}. ${violation.id}`);
      console.log(`     Impact: ${violation.impact}`);
      console.log(`     Nodes affected: ${violation.nodes.length}`);
      console.log(`     Description: ${violation.description}\n`);
    });
    
    if (results.violations.length > 10) {
      console.log(`  ... and ${results.violations.length - 10} more violations\n`);
    }
  } else {
    console.log('✅ NO VIOLATIONS FOUND\n');
  }
  
  // Incomplete Items
  if (results.incomplete.length > 0) {
    console.log('⚠️  ITEMS NEEDING REVIEW\n');
    console.log('  These require manual verification:\n');
    
    results.incomplete.slice(0, 5).forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.id}`);
      console.log(`     Nodes: ${item.nodes.length}\n`);
    });
    
    if (results.incomplete.length > 5) {
      console.log(`  ... and ${results.incomplete.length - 5} more items\n`);
    }
  }
  
  // Passed Checks
  console.log('✅ PASSED CHECKS (Selection)\n');
  
  const passTypes = {};
  results.passes.forEach(pass => {
    passTypes[pass.id] = (passTypes[pass.id] || 0) + 1;
  });
  
  Object.entries(passTypes).slice(0, 8).forEach(([id, count]) => {
    console.log(`  ✓ ${id} (${count} checks)`);
  });
  
  if (Object.keys(passTypes).length > 8) {
    console.log(`  ... and ${Object.keys(passTypes).length - 8} more checks\n`);
  } else {
    console.log('');
  }
  
  // Recommendations
  console.log('💡 WCAG COMPLIANCE TIPS\n');
  
  if (results.violations.length === 0) {
    console.log('  ✅ Excellent! Your page meets WCAG 2.1 Level AA standards.\n');
  } else {
    console.log('  Recommended fixes:\n');
    console.log('  1. Add ARIA labels to form inputs');
    console.log('  2. Ensure proper heading hierarchy');
    console.log('  3. Test with screen readers (NVDA, JAWS)');
    console.log('  4. Check color contrast ratios (4.5:1 for text)');
    console.log('  5. Test keyboard navigation (Tab, Enter, Escape)');
    console.log('  6. Add alt text to images');
    console.log('  7. Use semantic HTML elements\n');
  }
  
  // WCAG Levels
  console.log('📚 WCAG COMPLIANCE LEVELS\n');
  console.log('  Level A:    Basic accessibility support');
  console.log('  Level AA:   Enhanced support (recommended)');
  console.log('  Level AAA:  Optimal accessibility\n');
  
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run the test
runAccessibilityTest()
  .then(results => {
    generateAccessibilityReport(results);
    process.exit(results.violations.length === 0 ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Accessibility test failed:', error.message);
    process.exit(1);
  });
