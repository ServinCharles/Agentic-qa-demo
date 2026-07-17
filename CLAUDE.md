# CLAUDE.md — Agentic QA Demo (Retail Banking Web App)

> Layer 1: The Memory Layer. Always loaded, always active.
> This file is the agent's constitution for this repo.

## Project overview

BDD test automation framework for a retail banking web application
(Mortgage Decision-in-Principle journey). Stack:

- WebdriverIO 8 + Cucumber BDD (JavaScript)
- Page Object Model under `pageobjects/`
- Feature files under `features/`, step definitions under `features/step-definitions/`
- CI: Jenkins (Jenkinsfile in repo root)
- Cross-browser: BrowserStack (config in `wdio.browserstack.conf.js`)

## Architecture rules

1. **Page Object Model is mandatory.** No selectors inside step definitions —
   ever. All locators live in `pageobjects/*.page.js`.
2. One page object per screen. Shared components (header, cookie banner)
   go in `pageobjects/components/`.
3. Step definitions must be thin: orchestration only, no assertions on raw
   selectors. Assertions use `expect` from `@wdio/globals`.
4. Waits: use WebdriverIO auto-wait or explicit `waitForDisplayed`.
   `browser.pause()` is banned outside debugging.

## Naming conventions

- Feature files: `kebab-case.feature` (e.g. `dip-eligibility.feature`)
- Page objects: `camelCase.page.js` exporting a class instance
- Step definition files mirror their feature: `dip-eligibility.steps.js`
- Gherkin: Given = state, When = action, Then = observable outcome.
  Scenario titles start with a verb.

## Test data & security rules (regulated environment)

- **Never hardcode credentials, account numbers, sort codes, or PII**
  in any file. Use `test-data/*.json` placeholders + environment variables.
- Synthetic data only. Any value that looks like a real card/account
  number must be flagged in review.
- Do not log request/response bodies containing customer data.
- Secrets come from the CI credential store, never from the repo.

## Test expectations

- Every new page object needs at least one smoke scenario tagged `@smoke`.
- Regression scenarios tagged `@regression`; DIP journey scenarios
  additionally tagged `@dip`.
- All scenarios must pass locally in headless Chrome before commit:
  `npm run test:smoke`
- Flaky tests are quarantined with `@quarantine`, never deleted silently.

## Repo map

```
features/                  Gherkin feature files
features/step-definitions/ Cucumber step definitions
pageobjects/               Page Object Model classes
test-data/                 Synthetic test data (JSON)
.claude/                   Agent configuration (skills, hooks, subagents)
wdio.conf.js               Local WebdriverIO config
Jenkinsfile                CI pipeline
```

## Commands

- `npm run test:smoke` — smoke pack, headless Chrome
- `npm run test:regression` — full regression pack
- `npm run lint` — ESLint over features/ and pageobjects/
