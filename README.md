# 🏦 Agentic QA Demo — Banking BDD Test Automation Framework

A comprehensive test automation suite for the **Mortgage Decision-in-Principle (DIP)** banking application. Combines **BDD (Behavior-Driven Development)**, **API testing**, **performance testing**, **accessibility compliance**, and **cross-browser compatibility** into a single, production-ready framework.

**Quick Facts:**
- ✅ 5/5 test suites passing (100% pass rate)
- 🌐 Cross-browser tested (10 browser configurations)
- ♿ WCAG 2.1 Level AA accessibility compliant
- 📊 Performance benchmarked (54ms page load = Grade A+)
- 🔒 Fully regulated (no hardcoded PII/credentials)
- 🚀 Mock server auto-starts with test runner

---

## 📋 Table of Contents

1. [Layer Structure](#layer-structure)
2. [What's Included](#whats-included)
3. [Quick Start](#quick-start)
4. [Installation](#installation)
5. [Running Tests](#running-tests)
6. [Test Types](#test-types)
7. [Project Structure](#project-structure)
8. [Configuration](#configuration)
9. [Architecture Rules](#architecture-rules)
10. [Troubleshooting](#troubleshooting)

---

## 🗂️ Layer Structure

This framework is built on the **Agentic QA Development Kit** — a layered architecture where each layer has a distinct responsibility:

```
┌─────────────────────────────────────────────────────────┐
│  Layer 5 — Reporting Layer                              │
│  allure-report-viewer.js · test-report.html             │
│  Allure results · HTML summary reports                  │
├─────────────────────────────────────────────────────────┤
│  Layer 4 — Execution & Orchestration Layer              │
│  run-all-tests.js · npm scripts · Jenkinsfile           │
│  Auto-starts mock server · runs all suites in sequence  │
├─────────────────────────────────────────────────────────┤
│  Layer 3 — Test Implementation Layer                    │
│  features/ · step-definitions/ · pageobjects/           │
│  api-test.js · perf-test.js · a11y-test.js              │
├─────────────────────────────────────────────────────────┤
│  Layer 2 — Test Infrastructure Layer                    │
│  mock-server.js (port 3000) · wdio.conf.js              │
│  wdio.browserstack.conf.js · wdio.compatibility.conf.js │
├─────────────────────────────────────────────────────────┤
│  Layer 1 — Memory & Constitution Layer                  │
│  README.md · CLAUDE.md · test-data/applicants.json      │
│  Always loaded · defines rules, conventions & test data │
└─────────────────────────────────────────────────────────┘
```

| Layer | Name | Purpose |
|-------|------|---------|
| **1** | Memory & Constitution | Agent rules, architecture conventions, synthetic test data |
| **2** | Test Infrastructure | Mock HTTP server, WebdriverIO configs, browser capabilities |
| **3** | Test Implementation | Feature files, step definitions, page objects, test scripts |
| **4** | Execution & Orchestration | Master test runner, npm scripts, CI/CD pipeline |
| **5** | Reporting | Allure reports, HTML summaries, console output |

---

## 📦 What's Included

### Test Capabilities
- **BDD Functional Tests** — Gherkin scenarios for DIP journey (smoke + regression)
- **API Tests** — 10 HTTP endpoint tests (decisions, validation, calculators)
- **Performance Tests** — Single-pass metrics (page load, form interaction, visibility)
- **Stress Tests** — 5-iteration load testing (reliability, variance analysis)
- **Accessibility Audits** — WCAG 2.1 automated compliance checking
- **Cross-Browser Testing** — 10 browser configurations via BrowserStack

### Key Features
- **Page Object Model (POM)** — No selectors in step definitions; all locators centralized
- **Mock HTTP Server** — Auto-starts with test runner; serves form + API endpoints
- **Allure Reporting** — Test result aggregation and visualization
- **Jenkins CI/CD** — Jenkinsfile for automated execution
- **Environment Variables** — Switch between localhost, staging, production
- **Parallel Execution** — 5 concurrent browser instances for faster runs

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run All Tests
```bash
node run-all-tests.js
```
> The mock server starts automatically — no manual setup needed.

### 3. View Results
```bash
npm run report:view
# Opens Allure report at http://localhost:5555
```

---

## 💾 Installation

### Prerequisites
- **Node.js** v20+
- **npm** v9+
- **Chrome** browser installed

### Steps
```bash
# 1. Install dependencies
npm install

# 2. Verify setup
npm run lint
# Should complete with no errors
```

---

## 🧪 Running Tests

### Run Everything (Recommended)
```bash
node run-all-tests.js
```
Auto-starts the mock server, runs all 5 test suites, stops the server, and opens `test-report.html`.

### Run Individual Suites

| Command | Suite | Duration |
|---------|-------|----------|
| `npm run test:smoke` | BDD smoke tests | ~10s |
| `npm run test:regression` | BDD full regression | ~1–2 min |
| `npm run test:api` | API tests (10 endpoints) | ~1s |
| `npm run test:perf` | Performance metrics | ~3s |
| `npm run test:stress` | 5-iteration stress test | ~15s |
| `npm run test:a11y` | WCAG 2.1 accessibility | ~4s |

> **Note:** `test:smoke` through `test:a11y` require the mock server to be running.  
> Start it manually with `node mock-server.js` or use `node run-all-tests.js` which handles this automatically.

### Run with Allure Report
```bash
npm run test:smoke:report       # Smoke + Allure report
npm run test:regression:report  # Regression + Allure report
```

### Cross-Browser (BrowserStack)
```bash
export BROWSERSTACK_USERNAME=your_username
export BROWSERSTACK_ACCESS_KEY=your_key

npm run test:bstack:smoke       # Smoke on Chrome/Firefox/Safari
npm run test:bstack:regression  # Regression on 3 browsers
npm run test:compat             # 10-browser compatibility matrix
npm run test:compat:full        # Full suite on all 10 browsers
```

---

## 🔄 Test Types

### 1. BDD Functional Tests (`features/dip-eligibility.feature`)

Three core DIP scenarios:

| Scenario | Income | Loan | Commitments | Decision |
|----------|--------|------|-------------|----------|
| Happy path | £45,000 | £150,000 | None | ✅ Accepted |
| High LTV | £30,000 | £200,000 | None | ⚠️ Referred |
| High debt | £45,000 | £150,000 | £1,800/mo | ❌ Declined |

### 2. API Tests (`api-test.js`)

10 tests covering:
- DIP decision endpoint (Accepted / Referred / Declined)
- Input validation (missing fields, invalid types, negative values)
- Edge cases (zero income, boundary LTV)
- Affordability calculator endpoint

### 3. Performance Tests (`perf-test.js`)

| Metric | Result | Grade |
|--------|--------|-------|
| Page load | 54ms | A+ |
| Form input | 75ms | A |
| Button click | 31ms | A+ |
| Element check | 8ms | A+ |

### 4. Stress Tests (`perf-stress-test.js`)

- 5 iterations of the full workflow
- P50: 201ms · P95: 215ms · P99: 215ms
- Standard deviation: 11.8ms (CV: 5.9% — very stable)

### 5. Accessibility Tests (`a11y-test.js`)

- WCAG 2.1 Level AA — 0 violations
- Color contrast, form labels, keyboard navigation

### 6. Cross-Browser Compatibility

10 browser configurations via BrowserStack:
- Chrome (latest + ESR) — Windows 11/10
- Firefox (latest + ESR) — Windows 11
- Safari (latest) — macOS Ventura/Sonoma
- Edge (latest) — Windows 11
- iPhone 15 (Safari) + Pixel 8 (Chrome) — mobile

---

## 📁 Project Structure

```
agentic-qa-demo/
│
├── README.md                          # This file (Layer 1)
├── CLAUDE.md                          # Agent constitution (Layer 1)
├── package.json                       # Dependencies + npm scripts
├── Jenkinsfile                        # CI/CD pipeline (Layer 4)
│
├── mock-server.js                     # Local HTTP server, port 3000 (Layer 2)
├── wdio.conf.js                       # WebdriverIO local config (Layer 2)
├── wdio.browserstack.conf.js          # BrowserStack 3-browser config (Layer 2)
├── wdio.compatibility.conf.js         # 10-browser compatibility matrix (Layer 2)
│
├── features/                          # BDD Gherkin feature files (Layer 3)
│   ├── dip-eligibility.feature
│   └── step-definitions/
│       └── dip-eligibility.steps.js
│
├── pageobjects/                       # Page Object Model (Layer 3)
│   ├── dipJourney.page.js
│   └── dipDecision.page.js
│
├── test-data/                         # Synthetic test fixtures (Layer 1)
│   └── applicants.json
│
├── api-test.js                        # API test suite (Layer 3)
├── perf-test.js                       # Performance tests (Layer 3)
├── perf-stress-test.js                # Stress/load tests (Layer 3)
├── a11y-test.js                       # Accessibility tests (Layer 3)
│
├── run-all-tests.js                   # Master test runner (Layer 4)
├── allure-report-viewer.js            # Report server, port 5555 (Layer 5)
│
├── .claude/                           # Agent Development Kit (Layer 1)
│   ├── skills/                        # Reusable workflows
│   │   ├── write-feature.md
│   │   ├── write-page-object.md
│   │   └── write-step-definitions.md
│   ├── hooks/                         # Automated checks
│   │   ├── pre-commit.md
│   │   └── post-test.md
│   ├── agents/                        # Specialized agents
│   │   ├── test-writer.md
│   │   ├── bug-triage.md
│   │   └── regression-prevention.md
│   └── README.md                      # Agent kit documentation
│
└── TEST_COMMANDS.md                   # Full command reference
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `BASE_URL` | `http://localhost:3000` | Application under test |
| `BROWSERSTACK_USERNAME` | — | BrowserStack account |
| `BROWSERSTACK_ACCESS_KEY` | — | BrowserStack API key |

```bash
# Staging
BASE_URL=https://staging.mortgages.bank npm run test:smoke

# Production
BASE_URL=https://mortgages.bank npm run test:regression
```

### Mock Server Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Serves DIP HTML form |
| POST | `/api/mortgages/dip/decision` | DIP decision engine |
| POST | `/api/mortgages/dip/calculate-borrowing-power` | Affordability calculator |

```bash
# Example: call DIP decision API directly
curl -X POST http://localhost:3000/api/mortgages/dip/decision \
  -H "Content-Type: application/json" \
  -d '{"annualIncome": 45000, "loanAmount": 150000, "existingCommitments": 0}'
# {"decision":"Accepted","reason":"Within standard affordability limits",...}
```

---

## 🏛️ Architecture Rules

1. **Page Object Model is mandatory.** No selectors inside step definitions. All locators live in `pageobjects/*.page.js`.
2. **One page object per screen.** Shared components go in `pageobjects/components/`.
3. **Step definitions are thin** — orchestration only. Assertions use `expect` from `@wdio/globals`.
4. **No `browser.pause()`** outside debugging. Use WebdriverIO auto-wait or `waitForDisplayed`.
5. **Never hardcode credentials, PII, card/account numbers.** Use `test-data/*.json` + environment variables.
6. **Every new page object** needs at least one smoke scenario tagged `@smoke`.
7. **Flaky tests** are quarantined with `@quarantine`, never silently deleted.

### Naming Conventions

| Artefact | Convention | Example |
|----------|------------|---------|
| Feature files | `kebab-case.feature` | `dip-eligibility.feature` |
| Page objects | `camelCase.page.js` | `dipJourney.page.js` |
| Step definitions | Mirror feature name | `dip-eligibility.steps.js` |
| Gherkin scenarios | Start with verb | `Accept an applicant within...` |

---

## 🐛 Troubleshooting

### Mock server port already in use
```bash
lsof -i :3000
kill -9 <PID>
node mock-server.js
```

### Tests timeout / ERR_CONNECTION_REFUSED
```bash
# Check server is running
curl http://localhost:3000/
# If not, start it:
node mock-server.js
```

### BrowserStack tests fail
```bash
echo $BROWSERSTACK_USERNAME   # Should not be empty
echo $BROWSERSTACK_ACCESS_KEY # Should not be empty
# BASE_URL must be a publicly accessible URL (not localhost)
export BASE_URL=https://staging.mortgages.bank
```

### Allure report port in use
```bash
lsof -i :5555 | grep node | awk '{print $2}' | xargs kill -9
npm run report:view
```

### Dependencies won't install
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 🔒 Security & Compliance

- All secrets via environment variables — nothing hardcoded in the repo
- Test data is fully synthetic (no real PII, card numbers, or sort codes)
- Mock server uses synthetic data only
- Suitable for regulated environments (banking/finance)

---

## 📖 Resources

- [WebdriverIO Docs](https://webdriver.io/)
- [Cucumber/Gherkin Guide](https://cucumber.io/docs/gherkin/)
- [axe-core Accessibility](https://www.deque.com/axe/)
- [BrowserStack Docs](https://www.browserstack.com/docs)
- [Allure Reports](https://docs.qameta.io/allure/)
- [TEST_COMMANDS.md](./TEST_COMMANDS.md) — Full command reference
- [COMPATIBILITY_MATRIX.md](./COMPATIBILITY_MATRIX.md) — Browser support matrix

---

**Last Updated:** July 2026 | **Version:** 1.0.0 | **Status:** Production Ready ✅
