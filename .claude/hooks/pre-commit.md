# Hook: Pre-Commit

## Trigger
Runs automatically before any code is committed to the repository.

## Checklist
The agent must verify all of the following before allowing a commit:

### Security (Regulated Environment)
- [ ] No hardcoded credentials, passwords, API keys, or tokens
- [ ] No real account numbers, sort codes, card numbers, or PII
- [ ] No `console.log` statements printing request/response bodies
- [ ] Secrets referenced via `process.env.*` only

### Code Quality
- [ ] `npm run lint` passes with zero errors
- [ ] No `browser.pause()` calls outside of commented debug blocks
- [ ] No selectors (`$()`, `$$()`) inside step definition files
- [ ] All new page objects follow `camelCase.page.js` naming

### Test Coverage
- [ ] Every new page object has at least one `@smoke` scenario
- [ ] New scenarios are tagged (`@smoke`, `@regression`, `@dip` as appropriate)
- [ ] Flaky tests are tagged `@quarantine`, not deleted
- [ ] `npm run test:smoke` passes locally in headless Chrome

## On Failure
Block the commit and report which checks failed with the file and line number.
