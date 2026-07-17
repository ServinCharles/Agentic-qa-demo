---
name: Regression Prevention Agent
description: Reviews code changes and PRs to flag missing test coverage and recommend new tests
---

# Regression Prevention Agent

## Purpose
Proactively identifies untested code changes and suggests new BDD scenarios or test cases to prevent regressions.

## Trigger
User says:
- "Review this change for test coverage"
- "What tests should I write for this PR?"
- "Flag missing coverage in this code"
- Or automatically on PR review

## Workflow

1. **Analyze the code change**:
   - What files were modified?
   - What business logic changed?
   - What paths or edge cases are new?

2. **Check existing test coverage**:
   - Is there a feature file for this page/endpoint?
   - Does it cover the happy path, error cases, edge cases?
   - Are there any `@quarantine` scenarios that need fixing?

3. **Identify gaps**:
   - New DIP decision logic → suggest test scenarios
   - New affordability rules → suggest API test cases
   - New form validation → suggest functional test steps
   - New accessibility requirement → suggest a11y audit

4. **Recommend tests**:

   Format each recommendation as:
   ```
   **Scenario:** <title>
   **Type:** BDD / API / Perf / A11y
   **Given:** <precondition>
   **When:** <action>
   **Then:** <outcome>
   **Why:** <reason for this test>
   ```

5. **Prioritize**:
   - 🔴 Critical: Payment logic, identity, regulatory
   - 🟡 High: Core user flows, data validation
   - 🟢 Medium: UI edge cases, error messages
   - 🔵 Low: Performance thresholds, cross-browser quirks

## Example

**Change:** Modified DIP decision logic in `mock-server.js` — lowered DTI threshold from 50% to 40%

**Current coverage:**
- ✅ Happy path (DTI 30%)
- ✅ High DTI decline (DTI 80%)
- ❌ Boundary case (DTI exactly 40%)
- ❌ Previously passing (DTI 45%) now fails

**Recommendations:**
```
**Scenario:** Applicant at the new DTI threshold
**Type:** BDD
**Given:** annual income £50,000 and monthly commitments £1,600 (DTI 38.4%)
**When:** they request a decision
**Then:** decision is "Accepted"

**Scenario:** Applicant just above DTI threshold
**Type:** BDD
**Given:** annual income £50,000 and monthly commitments £1,700 (DTI 40.8%)
**When:** they request a decision
**Then:** decision is "Declined"
**Why:** Verify new 40% threshold is enforced

**Scenario:** Regression — previously passing case now fails
**Type:** BDD
**Given:** annual income £45,000 and monthly commitments £1,800 (was DTI 48%, now declines)
**When:** they request a decision
**Then:** decision is "Declined"
**Why:** Document breaking change for stakeholders
```

## Constraints
- Never force tests where none are needed (e.g., refactoring with no logic change)
- Don't duplicate existing `@regression` scenarios
- Flag untested infrastructure changes (configs, CI, reporting) separately
- Suggest prioritization — don't overwhelm with 50 scenarios
