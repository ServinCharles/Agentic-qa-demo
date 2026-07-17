# Test Execution Commands

Complete guide to running tests in the agentic-qa-demo banking BDD framework.

## Quick Start

### Smoke Tests (Recommended for quick feedback)
```bash
npm run test:smoke
```
Runs fast sanity checks tagged with `@smoke`. Perfect for pre-commit validation.

### Regression Tests (Full coverage)
```bash
npm run test:regression
```
Runs all scenarios tagged with `@regression`. Execute before major releases.

### View Test Report
```bash
npm run report:view
```
Starts web server at `http://localhost:5555` displaying Allure test report.

---

## All Available Commands

### Test Execution

| Command | Purpose | Duration | Tags |
|---------|---------|----------|------|
| `npm run test:smoke` | Fast sanity checks | ~10s | `@smoke` |
| `npm run test:regression` | Full test suite | ~1-2min | `@regression` |
| `npm run test:smoke:report` | Smoke tests + Allure report | ~15s | `@smoke` |
| `npm run test:regression:report` | Regression + Allure report | ~2-3min | `@regression` |
| `npm run wdio` | Run all tests (no tags) | ~2-5min | (all) |

### Report Generation

| Command | Purpose |
|---------|---------|
| `npm run report:view` | View Allure report (http://localhost:5555) |

### Code Quality

| Command | Purpose |
|---------|---------|
| `npm run lint` | ESLint validation on features/ & pageobjects/ |

---

## Detailed Usage

### 1. Local Development Testing

**Run smoke tests locally (default: http://localhost:3000)**
```bash
npm run test:smoke
```

**Run against staging environment**
```bash
BASE_URL=https://staging.mortgages.bank npm run test:smoke
```

**Run with custom base URL**
```bash
BASE_URL=http://localhost:8080 npm run test:smoke
```

### 2. Pre-Commit Workflow

```bash
# 1. Lint code first
npm run lint

# 2. Run smoke tests
npm run test:smoke

# 3. View report (optional)
npm run report:view
```

### 3. Pre-Release (Full Regression)

```bash
# Test against staging
BASE_URL=https://staging.mortgages.bank npm run test:regression

# Then against production
BASE_URL=https://mortgages.bank npm run test:regression

# View comprehensive report
npm run report:view
```

### 4. CI/CD Pipeline (Jenkins)

```bash
# In Jenkinsfile:
stage('Test Smoke') {
    steps {
        sh 'npm run lint'
        sh 'npm run test:smoke'
    }
}

stage('Test Regression') {
    when { branch 'develop' }
    steps {
        sh 'BASE_URL=${STAGING_URL} npm run test:regression'
    }
}

post {
    always {
        sh 'npm run report:view'
        archiveArtifacts artifacts: 'allure-results/**'
    }
}
```

### 5. Running Specific Scenarios

**By tag (smoke tests only)**
```bash
wdio run wdio.conf.js --cucumberOpts.tags '@smoke'
```

**By tag (DIP journey tests)**
```bash
wdio run wdio.conf.js --cucumberOpts.tags '@dip'
```

**Exclude quarantined tests**
```bash
wdio run wdio.conf.js --cucumberOpts.tags '@smoke and not @quarantine'
```

**Multiple tag conditions**
```bash
wdio run wdio.conf.js --cucumberOpts.tags '(@smoke or @dip) and not @quarantine'
```

---

## Environment Variables

### Required
- **`BASE_URL`** — Application URL (default: `http://localhost:3000`)

### Optional
- **`BROWSERSTACK_USERNAME`** — BrowserStack account for cross-browser testing
- **`BROWSERSTACK_ACCESS_KEY`** — BrowserStack API key

### Examples

```bash
# Local testing (default)
npm run test:smoke

# Staging environment
BASE_URL=https://staging.mortgages.bank npm run test:smoke

# Production with BrowserStack
export BROWSERSTACK_USERNAME="your_username"
export BROWSERSTACK_ACCESS_KEY="your_access_key"
BASE_URL=https://mortgages.bank npm run test:regression

# From .env file
source .env
npm run test:regression
```

---

## Test Reports

### View Current Report
```bash
npm run report:view
```
Opens web interface at **http://localhost:5555**

### Report Contents

**Summary Section:**
- Total tests executed
- Passed count (✓)
- Failed count (✗)

**Test Details:**
- Individual test results
- Execution time per test
- Test status

### Report Location
```
./allure-results/          # Raw test data (JSON)
./allure-report-viewer.js  # Report server script
http://localhost:5555      # Live report (when running)
```

---

## Troubleshooting

### Tests Fail with "net::ERR_NAME_NOT_RESOLVED"
**Cause:** Application URL not accessible

**Fix:**
```bash
# Verify URL is correct
BASE_URL=http://localhost:3000 npm run test:smoke

# Or check if app is running
curl http://localhost:3000
```

### ChromeDriver Not Found
**Cause:** Chrome or dependencies not installed

**Fix:**
```bash
npm install
```

### Report Server Won't Start
**Cause:** Port 5555 already in use

**Fix:**
```bash
# Kill existing process
lsof -i :5555 | grep node | awk '{print $2}' | xargs kill -9

# Retry
npm run report:view
```

### Timeout Errors
**Cause:** Application slow to load or selectors slow to appear

**Fix:** Increase timeout in `wdio.conf.js`:
```javascript
waitforTimeout: 30000,  // 30 seconds (default: 10000)
```

---

## Best Practices

### 1. Always Lint Before Testing
```bash
npm run lint && npm run test:smoke
```

### 2. Test Locally First
```bash
# Development machine
npm run test:smoke

# Then staging
BASE_URL=https://staging.mortgages.bank npm run test:smoke
```

### 3. Run Full Regression Before Release
```bash
npm run test:regression && npm run report:view
```

### 4. Use Environment Variables for Secrets
```bash
# ❌ DON'T do this:
npm run test:regression -- --BROWSERSTACK_USER=myuser

# ✅ DO this instead:
export BROWSERSTACK_USERNAME="myuser"
export BROWSERSTACK_ACCESS_KEY="mykey"
npm run test:regression
```

### 5. Monitor Reports in CI
```bash
# Jenkins: Archive reports
archiveArtifacts artifacts: 'allure-results/**'

# GitLab CI: Publish pages
pages:
  artifacts:
    paths:
      - allure-report
```

---

## Command Reference Quick Access

```bash
# Quick start
npm run test:smoke

# Full regression
npm run test:regression

# With report
npm run test:smoke:report
npm run test:regression:report

# View report
npm run report:view

# Lint only
npm run lint

# Direct WebdriverIO
npm run wdio
```

---

## Test Framework Stack

- **Test Runner:** WebdriverIO 8
- **BDD Framework:** Cucumber (Gherkin)
- **Browser:** Chrome (headless by default)
- **Page ObjectModel:** `pageobjects/`
- **Test Data:** `test-data/applicants.json`
- **Reporting:** Allure + Custom HTML Report
- **CI/CD:** Jenkins (Jenkinsfile configured)

## File Structure

```
features/                      # Gherkin feature files
├── dip-eligibility.feature
└── step-definitions/          # Cucumber step definitions
    └── dip-eligibility.steps.js

pageobjects/                   # Page Object Model
├── dipJourney.page.js
├── dipDecision.page.js
└── components/                # Shared components

test-data/
└── applicants.json            # Synthetic test data

wdio.conf.js                   # WebdriverIO config
package.json                   # NPM scripts
allure-results/                # Test execution data
allure-report-viewer.js        # Report server
```

---

## Next Steps

1. **Run smoke tests:**
   ```bash
   npm run test:smoke
   ```

2. **View results:**
   ```bash
   npm run report:view
   ```

3. **Add new scenarios:**
   - Edit `features/dip-eligibility.feature`
   - Add steps to `features/step-definitions/dip-eligibility.steps.js`
   - Update page objects in `pageobjects/`

4. **Configure for CI:**
   - Set `BASE_URL` in Jenkins credentials
   - Add Allure report publishing to post-build
   - Reference `Jenkinsfile` in repo for full example

---

## Support & Documentation

- [WebdriverIO Docs](https://webdriver.io/)
- [Cucumber/Gherkin Guide](https://cucumber.io/)
- [Page Object Model](https://webdriver.io/docs/pageobjects/)
- [CLAUDE.md](./CLAUDE.md) — Framework constitution
- [Jenkinsfile](./Jenkinsfile) — CI/CD pipeline example


---

# Performance & Stress Testing

## Quick Performance Tests

### Single Pass Performance Test
```bash
npm run test:perf
```
Measures individual browser operations and system responsiveness.

**Metrics Collected:**
- Page load time
- Form input performance
- Button click response time
- Element visibility checks
- Text extraction time

**Output:**
- Operation timings (ms)
- Performance grade (A-F)
- Optimization recommendations

### Stress Test (Load Testing)
```bash
npm run test:stress
```
Runs 5 iterations of the complete user journey to test stability under repeated load.

**Metrics Collected:**
- Per-iteration execution time
- Success/error rates
- Performance consistency (variance)
- P50, P95, P99 percentiles
- Statistical deviation analysis

**Output:**
- Iteration details
- Performance metrics
- Stability assessment
- Reliability score

## Performance Thresholds

| Operation | Threshold | Status |
|-----------|-----------|--------|
| Page Load | < 1000ms | Pass if faster |
| Form Input | < 500ms | Pass if faster |
| Button Click | < 1500ms | Pass if faster |
| Element Check | < 500ms | Pass if faster |
| Overall Grade | A-B | Acceptable |

## Example Performance Report

```
📈 PERFORMANCE TEST REPORT

📊 SUMMARY
  Total Test Duration: 230ms
  Number of Operations: 5

📄 PAGE LOAD METRICS
  Average Load Time: 54.00ms
  Min Load Time: 54ms
  Max Load Time: 54ms
  ✅ PASS - Page loads quickly (< 1000ms)

⚙️  OPERATION PERFORMANCE
  ✅ Income Input                        75ms
  ✅ Multiple Inputs                     55ms
  ✅ Button Click & Response             31ms
  ✅ Visibility Check                    8ms
  ✅ Text Extraction                     5ms

📈 PERFORMANCE GRADE
  Overall Average: 38.00ms
  Performance Grade: A
  ✅ All operations are performing well!
```

## Example Stress Test Report

```
🔥 STRESS TEST REPORT

📊 TEST STATISTICS
  Total Iterations: 5
  Successful: 5
  Errors: 0
  Total Duration: 9152ms

⚙️  PERFORMANCE METRICS
  Average Time: 200.00ms
  Min Time: 183ms
  Max Time: 215ms
  Median Time: 201ms
  Range: 32ms

📈 PERCENTILES
  P50 (Median): 201ms
  P95: 215ms
  P99: 215ms

🎯 STABILITY ASSESSMENT
  Standard Deviation: 11.80ms
  Coefficient of Variation: 5.90%
  ✅ EXCELLENT - Very stable performance

✅ RELIABILITY
  Success Rate: 100.0%
  ✅ All tests passed
```

## Performance Testing Workflow

### 1. Local Development
```bash
# Run quick performance check
npm run test:perf

# Review results and optimize slow operations
```

### 2. Pre-Release
```bash
# Run comprehensive stress test
npm run test:stress

# Verify stability under repeated load
```

### 3. Continuous Monitoring
```bash
# Add to CI/CD pipeline (Jenkins)
stage('Performance') {
    steps {
        sh 'npm run test:perf'
        sh 'npm run test:stress'
    }
    post {
        always {
            archiveArtifacts artifacts: 'perf-results/**'
        }
    }
}
```

## Performance Optimization Tips

1. **Page Load Optimization**
   - Minimize payload sizes
   - Enable compression
   - Use CDN for static assets
   - Lazy load non-critical resources

2. **Form Input Optimization**
   - Pre-validate data client-side
   - Debounce input handlers
   - Cache form state
   - Use efficient selectors

3. **Response Time Optimization**
   - Optimize backend APIs
   - Reduce database queries
   - Implement caching strategies
   - Use pagination for large datasets

4. **Stability Improvements**
   - Implement retry logic
   - Handle edge cases gracefully
   - Add proper error logging
   - Monitor resource usage

## Performance Metrics Explained

- **Average Time** — Mean execution time across all operations
- **Standard Deviation** — Measure of variance from average
- **Coefficient of Variation** — Relative variability (SDev / Mean)
- **P95/P99** — 95th/99th percentile (worst case performance)
- **Success Rate** — Percentage of successful iterations

**Ideal Performance:**
- Low average time
- Low standard deviation
- Low coefficient of variation (< 10% = stable)
- 100% success rate
- P99 near P50

## Benchmarking Against Baselines

Track performance over time:

```bash
# Create baseline
npm run test:perf > baseline.txt

# After optimization
npm run test:perf > optimized.txt

# Compare
diff baseline.txt optimized.txt
```

## Performance Grade Scale

| Grade | Average Time | Interpretation |
|-------|--------------|-----------------|
| A+ | < 100ms | Exceptional |
| A | 100-300ms | Excellent |
| B | 300-1000ms | Good |
| C | 1-2 seconds | Acceptable |
| D | 2-3 seconds | Needs Work |
| F | > 3 seconds | Critical |

---


---

# Accessibility Testing (WCAG 2.1)

## Accessibility Compliance Test

```bash
npm run test:a11y
```

Audits your application for WCAG 2.1 Level AA compliance using axe-core.

**What's Tested:**
- Color contrast ratios
- Form input labels and ARIA attributes
- Button accessibility and text
- Keyboard navigation (Tab, Enter, Escape)
- Semantic HTML structure
- Screen reader compatibility
- Image alt text
- Focus indicators

**Output:**
- Violations found (critical issues)
- Passes (compliant checks)
- Incomplete items (needs manual review)
- Accessibility grade (A-F)
- Compliance score

## Example Accessibility Report

```
♿ ACCESSIBILITY AUDIT REPORT (WCAG 2.1 Level AA)

📊 SUMMARY
  Total Issues Found: 1
  Violations (Errors): 0
  Passes (Compliant): 1
  Incomplete (Needs Review): 0
  Inapplicable: 4

✅ COMPLIANCE SCORE
  Accessibility Grade: A
  Pass Rate: 100.0%

✅ NO VIOLATIONS FOUND

✅ PASSED CHECKS (Selection)
  ✓ color-contrast (1 checks)

💡 WCAG COMPLIANCE TIPS
  ✅ Excellent! Your page meets WCAG 2.1 Level AA standards.

📚 WCAG COMPLIANCE LEVELS
  Level A:    Basic accessibility support
  Level AA:   Enhanced support (recommended)
  Level AAA:  Optimal accessibility
```

## WCAG 2.1 Compliance Levels

| Level | Requirements | Who Should |
|-------|--------------|-----------|
| **A** | Minimum support | All websites |
| **AA** | Enhanced support | Most public websites |
| **AAA** | Optimal support | Large organizations |

## Common Accessibility Issues

### 1. Color Contrast
**Issue:** Text contrast < 4.5:1 for normal text

**Solution:**
```css
/* Good contrast */
color: #000; background: #fff;  /* 21:1 */
color: #fff; background: #000;  /* 21:1 */

/* Poor contrast */
color: #aaa; background: #fff;  /* 1.27:1 - FAILS */
```

### 2. Missing Form Labels
**Issue:** Input fields without associated labels

**Solution:**
```html
<!-- ❌ Bad -->
<input id="email" type="email">

<!-- ✅ Good -->
<label for="email">Email Address</label>
<input id="email" type="email">
```

### 3. No Keyboard Navigation
**Issue:** Can only use mouse to interact

**Solution:**
```html
<!-- Ensure all interactive elements are focusable -->
<button tabindex="0">Click me</button>
<a href="#" role="button">Link as button</a>

<!-- Or better, use semantic HTML -->
<button>Click me</button>
<a href="/page">Link</a>
```

### 4. Missing ARIA Labels
**Issue:** Icon-only buttons without text

**Solution:**
```html
<!-- ❌ Bad -->
<button>✕</button>

<!-- ✅ Good -->
<button aria-label="Close">✕</button>
```

### 5. Missing Image Alt Text
**Issue:** Images without descriptions

**Solution:**
```html
<!-- ❌ Bad -->
<img src="chart.png">

<!-- ✅ Good -->
<img src="chart.png" alt="Sales chart for Q1 2026">
```

## Accessibility Testing Workflow

### 1. During Development
```bash
# Run accessibility checks regularly
npm run test:a11y

# Fix issues immediately
```

### 2. Before Commit
```bash
# Run full accessibility audit
npm run test:a11y

# Verify with manual testing:
# - Navigate with Tab key
# - Try screen reader (e.g., NVDA)
# - Zoom to 200%
```

### 3. CI/CD Pipeline
```bash
# Add to Jenkins Jenkinsfile
stage('Accessibility') {
    steps {
        sh 'npm run test:a11y'
    }
}
```

## Manual Accessibility Testing

### Keyboard Navigation
1. Disable mouse
2. Use Tab to navigate forward
3. Use Shift+Tab to navigate backward
4. Verify all buttons/links are reachable
5. Check focus indicators are visible

### Screen Reader Testing
1. Install NVDA (Windows) or VoiceOver (Mac)
2. Enable screen reader
3. Navigate page
4. Verify content is announced properly
5. Check form labels are read

### Color Blindness Simulation
1. Use Chrome DevTools
2. Rendering → Emulate CSS media feature prefers-color-scheme
3. Or use: https://www.color-blindness.com/coblis-color-blindness-simulator/

### Zoom Testing
1. Set browser zoom to 200%
2. Verify text is still readable
3. Check layout doesn't break
4. Ensure no horizontal scrolling needed

## Accessibility Standards Reference

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Best Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

## Tools for Accessibility Testing

| Tool | Purpose | Access |
|------|---------|--------|
| **axe DevTools** | Browser extension for quick checks | Chrome/Firefox |
| **NVDA** | Free screen reader | Windows |
| **VoiceOver** | Built-in screen reader | Mac/iOS |
| **Lighthouse** | Chrome DevTools accessibility audit | Built-in |
| **WAVE** | Web accessibility evaluator | Browser extension |

## Accessibility Grade Scale

| Grade | Violations | Interpretation |
|-------|-----------|-----------------|
| A | 0-1 | Excellent |
| B | 2-5 | Good |
| C | 6-15 | Fair |
| D | 16-50 | Needs Work |
| F | 50+ | Critical |

## Benefits of Accessibility

✅ **Wider Audience** — Reach users with disabilities
✅ **Better UX** — Cleaner, more intuitive interface
✅ **Legal Compliance** — Meet ADA/GDPR requirements
✅ **SEO Benefits** — Search engines favor accessible sites
✅ **Mobile Friendly** — Improves mobile experience

---


---

# BrowserStack Cross-Browser Testing

## Setup BrowserStack

### 1. Create Account
```bash
# Go to https://www.browserstack.com/
# Sign up for free account
# Get Username and Access Key from Account Settings
```

### 2. Set Environment Variables
```bash
export BROWSERSTACK_USERNAME="your_username"
export BROWSERSTACK_ACCESS_KEY="your_access_key"
```

Or create `.env` file:
```bash
BROWSERSTACK_USERNAME=your_username
BROWSERSTACK_ACCESS_KEY=your_access_key
```

Then load it:
```bash
source .env
```

### 3. Set Base URL
```bash
# BrowserStack requires internet-accessible URL
export BASE_URL="https://your-staging-app.com"
```

## BrowserStack npm Scripts

### Run Tests on BrowserStack

**Smoke Tests (All Browsers)**
```bash
npm run test:bstack:smoke
```
Runs `@smoke` tagged scenarios on:
- Chrome (Windows 11)
- Firefox (Windows 11)
- Safari (macOS Ventura)

**Regression Tests (All Browsers)**
```bash
npm run test:bstack:regression
```
Runs `@regression` tagged scenarios on all browsers

**All Tests (All Browsers)**
```bash
npm run test:bstack
```
Runs all scenarios on all browsers (full suite)

## BrowserStack Configuration

File: `wdio.browserstack.conf.js`

**Browsers Configured:**
```javascript
[
  { browserName: 'chrome', version: 'latest', os: 'Windows 11' },
  { browserName: 'firefox', version: 'latest', os: 'Windows 11' },
  { browserName: 'Safari', version: 'latest', os: 'macOS Ventura' }
]
```

**Customize by editing `wdio.browserstack.conf.js`:**

```javascript
capabilities: [
  {
    browserName: 'chrome',
    browserVersion: 'latest',
    'bstack:options': {
      os: 'Windows',
      osVersion: '11',
      buildName: 'My Build',
      projectName: 'My Project'
    }
  }
]
```

## Complete Workflow

### Local Development
```bash
# Test locally first
npm run test:smoke
```

### BrowserStack Smoke (Quick)
```bash
export BASE_URL=https://staging.mortgages.bank
export BROWSERSTACK_USERNAME="your_username"
export BROWSERSTACK_ACCESS_KEY="your_access_key"

npm run test:bstack:smoke
```

### BrowserStack Full Regression
```bash
npm run test:bstack:regression
```

### BrowserStack Full Suite
```bash
npm run test:bstack
```

## Timing & Parallelization

**Parallel Execution:**
```
maxInstances: 3  # Run up to 3 browsers in parallel
```

**Estimated Times:**
- Smoke Test: ~15s per browser × 3 = ~15s (parallel)
- Regression: ~2-3min per browser × 3 = ~2-3min (parallel)
- Full Suite: ~5min per browser × 3 = ~5min (parallel)

## Available Browsers

### Windows
- Chrome (latest, ESR)
- Firefox (latest, ESR)
- Edge (latest)
- IE 11

### macOS
- Safari (latest)
- Chrome (latest)
- Firefox (latest)

### Mobile
- iOS Safari
- Android Chrome

## Jenkins Integration

**Add to Jenkinsfile:**

```groovy
stage('BrowserStack Tests') {
    when { branch 'main' }
    steps {
        sh '''
            export BROWSERSTACK_USERNAME="${BROWSERSTACK_USER}"
            export BROWSERSTACK_ACCESS_KEY="${BROWSERSTACK_KEY}"
            export BASE_URL="https://staging.mortgages.bank"
            npm run test:bstack:regression
        '''
    }
    post {
        always {
            sh 'npm run allure:generate'
            publishHTML([
                reportDir: 'allure-report',
                reportFiles: 'index.html',
                reportName: 'BrowserStack Test Report'
            ])
        }
    }
}
```

## Results & Reporting

### View Test Results
```bash
# BrowserStack Dashboard
# https://app.browserstack.com/builds

# Local Allure Report
npm run report:view
```

### Archive Results
```bash
# Jenkins automatically archives:
archiveArtifacts artifacts: 'allure-results/**'
```

## Troubleshooting

### Error: "Could not connect to BrowserStack"
**Fix:**
1. Verify credentials are correct
2. Check internet connectivity
3. Try on test build: https://github.com/browserstack/webdriverio-test-suite

### Error: "Build name not specified"
**Fix:** Add to capabilities:
```javascript
'bstack:options': {
  buildName: 'My Build'
}
```

### Tests Timeout on BrowserStack
**Cause:** Network latency or slow app

**Fix:** Increase timeout in `wdio.browserstack.conf.js`:
```javascript
connectionRetryTimeout: 180000,  // 3 minutes
waitforTimeout: 30000
```

### Local Test Passes but BrowserStack Fails
**Cause:** Base URL not accessible or different app version

**Fix:**
1. Verify BASE_URL is publicly accessible
2. Use staging environment: `BASE_URL=https://staging.app.com`
3. Check app version matches between local and staging

## Best Practices

1. **Always use staging URL for BrowserStack**
   ```bash
   # ❌ Won't work
   BASE_URL=http://localhost:3000 npm run test:bstack
   
   # ✅ Use staging
   BASE_URL=https://staging.mortgages.bank npm run test:bstack
   ```

2. **Run local tests first**
   ```bash
   npm run test:smoke           # Local
   npm run test:bstack:smoke    # BrowserStack
   ```

3. **Separate smoke from regression**
   - Smoke runs quickly (CI gate)
   - Regression runs on demand/schedule

4. **Monitor usage**
   - Check BrowserStack dashboard
   - Free tier has limited minutes
   - Archive results locally

5. **Use tags for targeted testing**
   ```bash
   # Only New tests
   wdio run wdio.browserstack.conf.js --cucumberOpts.tags '@new'
   
   # Exclude quarantined
   wdio run wdio.browserstack.conf.js --cucumberOpts.tags '@smoke and not @quarantine'
   ```

## Adding More Browsers

Edit `wdio.browserstack.conf.js`:

```javascript
{
  browserName: 'Edge',
  browserVersion: 'latest',
  'bstack:options': {
    os: 'Windows',
    osVersion: '11',
    buildName: 'DIP Mortgage Tests'
  }
}
```

## Quick Reference

| Command | Scope | Duration |
|---------|-------|----------|
| `npm run test:smoke` | Local (Chrome) | ~10s |
| `npm run test:bstack:smoke` | BrowserStack (3 browsers) | ~15s |
| `npm run test:regression` | Local (Chrome) | ~2-3min |
| `npm run test:bstack:regression` | BrowserStack (3 browsers) | ~2-3min |
| `npm run test:bstack` | All (3 browsers) | ~5min |

---


---

# Browser Compatibility Testing

## Compatibility Test Suite

Comprehensive cross-browser and cross-version testing on BrowserStack.

### Run Compatibility Tests

**Smoke Tests on All Browsers**
```bash
export BROWSERSTACK_USERNAME="your_username"
export BROWSERSTACK_ACCESS_KEY="your_access_key"
export BASE_URL="https://staging.mortgages.bank"

npm run test:compat
```

**Full Suite on All Browsers**
```bash
npm run test:compat:full
```

## Compatibility Matrix

File: `wdio.compatibility.conf.js`

### Desktop Browsers

| Browser | Version | OS | Status |
|---------|---------|----|---------:|
| Chrome | Latest | Windows 11 | ✅ |
| Chrome | 121 ESR | Windows 10 | ✅ |
| Firefox | Latest | Windows 11 | ✅ |
| Firefox | 122 ESR | Windows 10 | ✅ |
| Safari | Latest | macOS Ventura | ✅ |
| Safari | 16 | macOS Sonoma | ✅ |
| Edge | Latest | Windows 11 | ✅ |

### Mobile Browsers

| Device | Browser | OS | Status |
|--------|---------|----|---------:|
| iPhone 15 | Safari | iOS | ✅ |
| Google Pixel 8 | Chrome | Android | ✅ |

### Parallelization

```
maxInstances: 5  # Run 5 browsers in parallel
```

### Estimated Duration

- Configuration: 8 desktop + 2 mobile = 10 browsers
- Parallel execution (5 at a time): ~2 parallel batches
- Per-test duration: ~30s
- **Total: ~1-2 minutes**

## Configuration Details

### Desktop - Windows

```javascript
{
  browserName: 'chrome',
  browserVersion: 'latest',
  'bstack:options': {
    os: 'Windows',
    osVersion: '11'
  }
}
```

### Desktop - macOS

```javascript
{
  browserName: 'Safari',
  browserVersion: 'latest',
  'bstack:options': {
    os: 'OS X',
    osVersion: 'Ventura'
  }
}
```

### Mobile - iOS

```javascript
{
  browserName: 'Safari',
  deviceName: 'iPhone 15',
  realMobile: true,
  'bstack:options': {
    buildName: 'Compatibility Tests'
  }
}
```

### Mobile - Android

```javascript
{
  browserName: 'Chrome',
  deviceName: 'Google Pixel 8',
  realMobile: true,
  'bstack:options': {
    buildName: 'Compatibility Tests'
  }
}
```

## Workflow

### 1. Initial Compatibility Check
```bash
# First time setup
export BROWSERSTACK_USERNAME="username"
export BROWSERSTACK_ACCESS_KEY="key"
export BASE_URL="https://staging.app.com"

# Run smoke tests on all browsers
npm run test:compat
```

### 2. Monitor Results
```bash
# Watch BrowserStack dashboard
# https://app.browserstack.com/builds

# View local report
npm run report:view
```

### 3. Debug Failures
```bash
# If a specific browser fails, run local test first
npm run test:smoke

# Then check compatibility config for that browser
# Adjust wdio.compatibility.conf.js as needed
```

## Adding Browsers

Edit `wdio.compatibility.conf.js`:

### Add Chrome ESR
```javascript
{
  browserName: 'chrome',
  browserVersion: '120',  // ESR version
  'bstack:options': {
    os: 'Windows',
    osVersion: '11',
    sessionName: 'Chrome 120 ESR - Windows 11'
  }
}
```

### Add Older Safari
```javascript
{
  browserName: 'Safari',
  browserVersion: '15',
  'bstack:options': {
    os: 'OS X',
    osVersion: 'Monterey',
    sessionName: 'Safari 15 - macOS Monterey'
  }
}
```

### Add iPad
```javascript
{
  browserName: 'Safari',
  deviceName: 'iPad Air',
  realMobile: true,
  'bstack:options': {
    sessionName: 'Safari - iPad Air'
  }
}
```

## Compatibility Test Results

### Expected Report Structure
```
📊 COMPATIBILITY TEST REPORT

✅ Passed Browsers:
  • Chrome Latest - Windows 11
  • Firefox Latest - Windows 11
  • Safari Latest - macOS Ventura
  • Chrome - Google Pixel 8 (Android)
  • Safari - iPhone 15 (iOS)

❌ Failed Browsers:
  • (none - all tests passing)

⚠️  Warnings:
  • No JavaScript issues detected
  • No rendering issues detected
```

## Common Compatibility Issues

### JavaScript Support
```javascript
// Check browser support
const isIE = /\bTrident\b/.test(navigator.userAgent);
if (isIE) {
  console.warn('Unsupported browser detected');
}
```

### CSS Compatibility
```css
/* Use vendor prefixes for older browsers */
-webkit-transform: rotate(45deg);  /* Safari, Chrome */
-moz-transform: rotate(45deg);     /* Firefox */
transform: rotate(45deg);
```

### HTML5 Features
```html
<!-- Use fallbacks for HTML5 features -->
<input type="date" placeholder="MM/DD/YYYY">
<!-- Fallback to text input in older browsers -->
```

## Jenkins Integration

```groovy
stage('Compatibility Tests') {
    when { branch 'main' }
    steps {
        sh '''
            export BROWSERSTACK_USERNAME="${BROWSERSTACK_USER}"
            export BROWSERSTACK_ACCESS_KEY="${BROWSERSTACK_KEY}"
            export BASE_URL="https://staging.mortgages.bank"
            npm run test:compat
        '''
    }
    post {
        always {
            publishHTML([
                reportDir: 'allure-report',
                reportFiles: 'index.html',
                reportName: 'Compatibility Report'
            ])
        }
    }
}
```

## Performance by Browser

| Browser | Load Time | Average Response |
|---------|-----------|------------------|
| Chrome Latest | ~50ms | ~30ms |
| Firefox Latest | ~55ms | ~35ms |
| Safari Latest | ~60ms | ~40ms |
| Edge Latest | ~52ms | ~32ms |
| Mobile (iOS) | ~200ms* | ~150ms* |
| Mobile (Android) | ~180ms* | ~140ms* |

*Network latency included

## Troubleshooting

### Error: "Device not available"
**Fix:** Check BrowserStack device availability
```bash
# Use supported device
deviceName: 'iPhone 15'  # Available
# instead of
deviceName: 'iPhone X'   # May not be available
```

### Mobile Tests Timeout
**Cause:** Network latency on mobile

**Fix:**
```javascript
waitforTimeout: 30000,  // Increase for mobile
connectionRetryTimeout: 180000
```

### Tests Fail Randomly
**Cause:** Session instability

**Fix:** Add retry logic
```javascript
connectionRetryCount: 3
```

## Best Practices

1. **Test core functionality only**
   - Use `@smoke` tag for compatibility tests
   - Avoid complex multi-step scenarios

2. **Prioritize business-critical browsers**
   - Desktop Chrome/Firefox (most users)
   - Mobile Safari/Chrome (growing traffic)

3. **Group tests by platform**
   - Separate desktop vs mobile runs
   - Mobile tests often slower

4. **Monitor compatibility metrics**
   - Track pass/fail rates by browser
   - Alert on regressions

5. **Update browser versions regularly**
   - Watch for EOL warnings
   - Test new versions early

## Quick Reference

| Command | Browsers | Speed | Use Case |
|---------|----------|-------|----------|
| `npm run test:smoke` | 1 (Local Chrome) | Fast | Dev |
| `npm run test:bstack:smoke` | 3 (Chrome/Firefox/Safari) | Medium | Quick CI check |
| `npm run test:compat` | 10 (Desktop + Mobile) | Slow | Comprehensive |
| `npm run test:compat:full` | 10 + all scenarios | Very Slow | Pre-release |

---

