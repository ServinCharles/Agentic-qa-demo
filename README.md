# Agentic-qa-demo

# 🏦 Agentic QA Demo — Banking BDD Test Automation Framework
A comprehensive test automation suite for the **Mortgage Decision-in-Principle (DIP)** banking application. Combines **BDD (Behavior-Driven Development)**, **API testing**, **performance testing**, **accessibility compliance**, and **cross-browser compatibility** into a single, production-ready framework.

🏦 Agentic QA Demo — Banking BDD Test Automation Framework

![CI](https://github.com/YOUR_USERNAME/agentic-qa-demo/actions/workflows/ci.yml/badge.svg)
A portfolio test automation framework for a fictional lender's Mortgage Decision-in-Principle (DIP) journey — the kind of application-critical flow found across the retail banking industry. It combines BDD (Behavior-Driven Development), API testing, performance measurement, accessibility compliance, and cross-browser compatibility in a single framework, built to demonstrate how I structure test automation for regulated financial services.

> Note: Everything here is synthetic — a fictional lender ("Acme Bank"), synthetic data, mock endpoints, invented business rules. Nothing is derived from any real organisation's systems or code.

Quick Facts:
🤖 Built and maintained with an agentic AI workflow (Claude agents — see below)
✅ Fully green suite across 5 test types — designed to demonstrate structure and coverage strategy
🌐 Cross-browser matrix: 10 configurations via BrowserStack
♿ WCAG 2.1 Level AA accessibility checks (0 violations)
📊 Performance & stress measurement approaches demonstrated (against a local mock server)
🔒 No hardcoded PII or credentials — patterns suitable for regulated environments

***
🤖 AI-Assisted Development

This framework is built and maintained using an agentic workflow: Claude agents with defined skills and hooks (see the .claude/ directory and CLAUDE.md) handle scaffolding, Gherkin feature-file generation from requirements, and framework maintenance — with every change human-reviewed.

Fourteen years of writing frameworks by hand tells me exactly what to review; AI changes how fast I get to reviewable. The .claude/ directory contains:

skills/ — reusable capabilities the agents apply (e.g. feature-file generation, page-object scaffolding)
hooks/ — quality guardrails that run around agent actions
agents/ — role definitions for specialised tasks

***
📋 Table of Contents

What's Included
Quick Start (5 minutes)
Installation
Running Tests
Test Types
Project Structure
Configuration
Troubleshooting

***
📦 What's Included

Test Capabilities
BDD Functional Tests — Gherkin scenarios for the DIP journey (smoke + regression)
API Tests — 10 HTTP endpoint tests (decisions, validation, calculators)
Performance Measurement — single-pass metrics (page load, form interaction, visibility)
Stress Tests — 5-iteration load runs (reliability, variance analysis)
Accessibility Audits — WCAG 2.1 automated compliance checking
Cross-Browser Testing — 10 browser configurations via BrowserStack

Key Features
Page Object Model (POM) — no selectors in step definitions; all locators centralised
Mock HTTP Server — local test environment; serves form + API endpoints
Allure Reporting — test result aggregation and visualisation
CI/CD — GitHub Actions workflow (badge above) plus a Jenkinsfile showing an enterprise pipeline equivalent
Environment Variables — switch between localhost, staging, production
Parallel Execution — 5 concurrent browser instances for faster runs

***
🚀 Quick Start (5 minutes)

1. Install Dependencies
npm install

2. Start the Mock Server
Open a new terminal tab:
node mock-server.js
# Expected output:
# ✅ Mock server running at http://localhost:3000
#    📝 GET  / - Serves DIP HTML form
#    🔌 POST /api/mortgages/dip/decision - DIP decision endpoint
#    🔌 POST /api/mortgages/dip/calculate-borrowing-power - Calculator endpoint

3. Run Smoke Tests (Local)
npm run test:smoke

4. View Results
# Console output shows pass/fail summary
# All 6 tests pass ✅

***
💾 Installation

Prerequisites
Node.js v20+ (or the version matching package.json)
npm v9+
macOS (or Linux/Windows with slight terminal adjustments)

Step 1: Clone/Download Repository
cd /path/to/agentic-qa-demo

Step 2: Install Package Dependencies
npm install

This installs:
@wdio/cli — WebdriverIO browser automation
@wdio/cucumber-framework — BDD Gherkin support
@axe-core/webdriverio — Accessibility testing
@wdio/browserstack-service — Cloud browser testing
@wdio/allure-reporter — Test reporting
eslint — Code quality checks

Step 3: Verify Installation
npm run lint
# Should complete with no errors

***
🧪 Running Tests

Option A: Functional Tests (Recommended First)

Start the mock server (first terminal):
node mock-server.js

Run smoke tests (second terminal):
npm run test:smoke

Expected output:
6 passing ✅

***
Option B: Run All Tests (5 minutes)
# Ensure mock server is running first
node run-all-tests.js

This runs:
✅ Functional tests (smoke) — 2.7s
✅ Performance measurement — 2.1s
✅ Stress tests — 8.9s
✅ API tests — (included)
✅ Accessibility tests — 2.3s

Output: test-report.html opens in browser with visual summary

***
Option C: Test Individual Types

Functional Tests
npm run test:smoke              # Fast sanity checks
npm run test:regression         # Full regression suite
npm run test:smoke:report       # Smoke + Allure report
npm run test:regression:report  # Regression + Allure report

API Tests
npm run test:api

Covers:
✅ Health check (server running)
✅ DIP decision endpoints (Approved/Referred/Declined)
✅ Input validation (missing fields, invalid types)
✅ Edge cases (zero income, negative values)
✅ Affordability calculator

Performance Measurement
npm run test:perf

Demonstrates the measurement approach (against the local mock server — figures illustrate methodology, not real-world benchmarks):
Page load time
Form input response
Button click latency
Element visibility

Stress Tests
npm run test:stress

Runs 5 iterations with per-iteration timing, percentile analysis (P50/P95/P99) and variance — demonstrating how I evaluate suite stability.

Accessibility Tests
npm run test:a11y

Checks:
WCAG 2.1 Level AA compliance
Color contrast ratios
Form labels and buttons
Keyboard navigation
Result: 0 violations 🎉

***
Option D: Cross-Browser Testing (BrowserStack)

# Set credentials (free trial account works)
export BROWSERSTACK_USERNAME=your_username
export BROWSERSTACK_ACCESS_KEY=your_key

# Run on 3 browsers (Chrome, Firefox, Safari)
npm run test:bstack:smoke

# Run on 10-browser compatibility matrix
npm run test:compat

# Run full suite on all 10 browsers
npm run test:compat:full

***
🔄 Test Types & Scenarios

1. BDD Functional Tests (features/dip-eligibility.feature)

Scenario 1: Approved Applicant ✅
Given annual income £45,000
And no credit commitments
When requesting £150,000 loan
Then decision is "Accepted"
And maximum borrowing shown

Scenario 2: Referred Applicant ⚠️
Given annual income £30,000
And no credit commitments
When requesting £200,000 loan
Then decision is "Referred"
And referral guidance shown

Scenario 3: Declined Applicant ❌
Given annual income £45,000
And monthly commitments £1,800
When requesting £150,000 loan
Then decision is "Declined"

(Decision rules are invented for the fictional Acme Bank — they demonstrate scenario design, not any real lender's affordability model.)

2. API Tests (api-test.js)

POST /api/mortgages/dip/decision — DIP decision engine
POST /api/mortgages/dip/calculate-borrowing-power — Affordability calculator
GET / — Health check
Input validation (400 errors)
Edge cases (zero values, negative amounts)

3. Performance Measurement (perf-test.js)

Metrics tracked:
Page load time
Form input response
Button click latency
Element query times

4. Stress Tests (perf-stress-test.js)

5 iterations of full workflow
Per-iteration timing
Percentile analysis (P50, P95, P99)
Standard deviation

5. Accessibility Tests (a11y-test.js)

WCAG 2.1 Level AA compliance
Color contrast verification
Form accessibility
Keyboard navigation

6. Compatibility Tests

10 browser configurations:
✅ Chrome (latest + ESR, Windows 11/10, macOS)
✅ Firefox (latest + ESR, Windows 11)
✅ Safari (latest, macOS Ventura/Sonoma)
✅ Edge (latest, Windows 11)
✅ Mobile (iPhone 15 Safari, Pixel 8 Chrome)

***
📁 Project Structure

agentic-qa-demo/
├── README.md                          # This file
├── CLAUDE.md                          # Agent constitution
├── package.json                       # Dependencies + npm scripts
├── .github/workflows/ci.yml          # GitHub Actions CI (smoke suite on push)
├── Jenkinsfile                        # Enterprise CI/CD pipeline equivalent
│
├── .claude/                          # 🤖 Agent Development Kit
│   ├── skills/                       # Reusable agent capabilities
│   ├── hooks/                        # Quality guardrails
│   └── agents/                       # Specialised agent roles
│
├── features/                          # BDD Gherkin feature files
│   ├── dip-eligibility.feature        # Mortgage DIP scenarios
│   └── step-definitions/
│       └── dip-eligibility.steps.js   # Step implementations
│
├── pageobjects/                       # Page Object Model
│   ├── dipJourney.page.js            # DIP journey page
│   └── dipDecision.page.js           # Decision results page
│
├── test-data/                         # Test fixtures (synthetic data)
│   └── applicants.json               # Sample applicant data
│
├── wdio.conf.js                      # WebdriverIO local config
├── wdio.browserstack.conf.js         # BrowserStack 3-browser config
├── wdio.compatibility.conf.js        # 10-browser compatibility matrix
│
├── mock-server.js                    # Local HTTP server (port 3000)
├── api-test.js                       # API test suite (10 tests)
├── perf-test.js                      # Performance measurement
├── perf-stress-test.js              # Stress/load tests
├── a11y-test.js                      # Accessibility tests
│
├── run-all-tests.js                  # Master test runner
├── allure-report-viewer.js           # HTML report server
│
└── TEST_COMMANDS.md                  # Detailed command reference

***
⚙️ Configuration

Environment Variables

Switch between environments without code changes:

# Local (default)
npm run test:smoke
# Uses: http://localhost:3000

# Other environments (illustrative)
BASE_URL=https://staging.acmebank.example npm run test:smoke

Mock Server Endpoints

The local server provides:

Method	Path	Purpose
GET	/	Serves HTML DIP form
POST	/api/mortgages/dip/decision	DIP decision engine
POST	/api/mortgages/dip/calculate-borrowing-power	Affordability calculator
	Example: Call DIP Decision API
curl -X POST http://localhost:3000/api/mortgages/dip/decision \
  -H "Content-Type: application/json" \
  -d '{"annualIncome": 45000, "loanAmount": 150000, "existingCommitments": 0}'

# Response:
# {"decision":"Accepted","reason":"Within standard affordability limits",...}

WebdriverIO Configuration

Local Chrome: wdio.conf.js (headless)
BrowserStack (3 browsers): wdio.browserstack.conf.js
Compatibility (10 browsers): wdio.compatibility.conf.js

***
📊 Understanding Results

CI Status Codes
echo $?  # Exit code after npm run

0   = All tests passed ✅
1   = At least one test failed ❌

Allure Reports
npm run report:view
# Opens http://localhost:5555
# Shows: pass/fail counts, durations, trends

Console Output Example
✅ Functional Tests (Smoke) - PASSED (2.7s)
✅ Performance Measurement - PASSED (2.1s)
✅ Stress Tests - PASSED (8.9s)
✅ API Tests - PASSED (1.2s)
✅ Accessibility Tests - PASSED (2.3s)

SUMMARY: 5/5 suites green | 16s total

***
🐛 Troubleshooting

Problem: "Mock server already running"
# Kill existing process
pkill -f "node mock-server"

# Restart fresh
node mock-server.js

Problem: Tests timeout
# Ensure mock server is running
pgrep -f "node mock-server" > /dev/null && echo "✅ Running" || node mock-server.js

# Check server responds
curl http://localhost:3000/

Problem: BrowserStack tests fail
# Verify credentials
echo $BROWSERSTACK_USERNAME
echo $BROWSERSTACK_ACCESS_KEY

# If empty, set them:
export BROWSERSTACK_USERNAME=your_username
export BROWSERSTACK_ACCESS_KEY=your_key

# Try test again
npm run test:bstack:smoke

Problem: "Port 3000 already in use"
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Restart server
node mock-server.js

Problem: npm dependencies won't install
# Clear cache
npm cache clean --force

# Remove node_modules and package-lock
rm -rf node_modules package-lock.json

# Reinstall
npm install

Problem: Tests pass locally but fail in CI
Check BASE_URL environment variable is set correctly
Verify the mock server step runs in the CI job before tests
Check BrowserStack credentials in the CI secret store
Review CI logs for network/connectivity issues

***
🔒 Security & Compliance

No Hardcoded Credentials
✅ All secrets via environment variables
✅ No test data contains real PII, card numbers, or sort codes
✅ Mock server uses synthetic data only
✅ Patterns suitable for regulated environments (banking/finance)

Test Data Policy
Use test-data/applicants.json for fixtures
Generate synthetic data that looks realistic but isn't real
Never commit actual customer information
Rotate test data fixtures regularly

***
📚 Next Steps

Run smoke tests — verify everything works locally
npm run test:smoke

Explore feature files — see how Gherkin scenarios are written
cat features/dip-eligibility.feature

Review page objects — understand selector organisation
cat pageobjects/dipJourney.page.js

Run the full suite — see all test types in action
node run-all-tests.js

Check the CI pipelines — GitHub Actions + Jenkins equivalents
cat .github/workflows/ci.yml
cat Jenkinsfile

***
📖 Learning Resources

WebdriverIO Docs — Browser automation
Cucumber Gherkin — BDD syntax
axe DevTools — Accessibility testing
BrowserStack Docs — Cloud browser testing
Allure Reports — Test reporting

***
💬 Support & Questions

For issues or questions:
Check TEST_COMMANDS.md for detailed command reference
Review COMPATIBILITY_MATRIX.md for browser support
Check QUICK_START.md for 5-minute setup
Review CLAUDE.md for architecture principles

***
📝 License & Attribution

This portfolio framework demonstrates BDD test automation principles for regulated financial services. Use it as a template for your own test suites.

All data, hostnames, business rules and scenarios are synthetic and invented for a fictional lender — safe to share and demo.

***
Last Updated: July 2026 | Version: 1.0.0 | Status: Portfolio / Demo Framework
