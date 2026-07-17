# Hook: Post-Test

## Trigger
Runs automatically after any test suite completes (pass or fail).

## Actions

### On Pass
1. Confirm exit code is `0`
2. Note the pass rate and duration in a summary
3. If `node run-all-tests.js` was used, confirm `test-report.html` was generated
4. Suggest running `npm run report:view` to open the Allure report

### On Failure
1. Identify which suite(s) failed from the output
2. Check if the mock server was running — if `ERR_CONNECTION_REFUSED`, prompt:
   ```
   Mock server not running. Start it with: node mock-server.js
   Or use: node run-all-tests.js (auto-starts the server)
   ```
3. For BDD failures: surface the failing Gherkin step and stack trace
4. For API failures: show the endpoint, expected vs actual status/body
5. For a11y failures: list each WCAG violation with element selector and rule ID
6. Tag any consistently failing scenario with `@quarantine` rather than deleting

## Never
- Do not delete failing tests
- Do not suppress or ignore test output
- Do not mark a test as passing when it failed
