# Skill: Write Step Definitions

## Trigger
Use this skill when asked to implement step definitions for a feature file.

## Rules
- File name mirrors the feature: `dip-eligibility.steps.js` → `dip-eligibility.feature`
- Steps are thin — orchestration only, no raw selectors
- Import page objects, never use `$()` directly inside steps
- Assertions use `expect` from `@wdio/globals`
- Use `async/await` throughout — no callbacks or `.then()`
- Test data comes from parameters or `test-data/*.json`, never hardcoded
- One step definition file per feature file

## Template
```javascript
const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@wdio/globals');
const myPage = require('../../pageobjects/myPage.page');
const testData = require('../../test-data/applicants.json');

Given('a precondition is met', async () => {
  await myPage.open();
});

When('the user performs {string}', async (action) => {
  await myPage.doSomething(action);
});

Then('the result should be {string}', async (expected) => {
  await expect(myPage.resultElement).toHaveText(expected);
});
```

## After creating step definitions
1. Verify all Gherkin steps in the feature file are matched
2. Run `npm run test:smoke` to confirm no undefined steps
3. Run `npm run lint` to check code quality
