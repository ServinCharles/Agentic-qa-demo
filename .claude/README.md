# .claude/ — Agent Development Kit

This directory contains configuration files for GitHub Copilot (Claude) to extend and maintain this test automation framework. It defines skills, hooks, and specialized agents that automate common QA tasks.

## Directory Structure

```
.claude/
├── skills/                    # Reusable workflows for common tasks
│   ├── write-feature.md       # Create BDD feature files
│   ├── write-page-object.md   # Create page objects
│   ├── write-step-definitions.md  # Create step definitions
│   └── generate-from-jira-ticket.md # Optional MCP ticket-to-scenario flow
│
├── hooks/                     # Automated checks at key points
│   ├── pre-commit.md          # Security & code quality gate
│   └── post-test.md           # Test failure analysis
│
└── agents/                    # Specialized autonomous workflows
    ├── test-writer.md         # Creates complete test artefacts
    ├── bug-triage.md          # Debugs failing tests
    └── regression-prevention.md # Flags missing test coverage
```

## Skills

### [Write Feature](skills/write-feature.md)
Create Gherkin feature files with proper tagging and scenario structure.
- Enforces naming (`kebab-case.feature`)
- Ensures every new feature has `@smoke` scenario
- Links to corresponding step definitions
- Run: `npm run test:smoke` to verify locally

### [Write Page Object](skills/write-page-object.md)
Create page objects following the Page Object Model pattern.
- Enforces naming (`camelCase.page.js`)
- Centralizes all selectors
- Separates actions from assertions
- No hardcoded test data

### [Write Step Definitions](skills/write-step-definitions.md)
Implement Cucumber step definitions that map Gherkin to page objects.
- Thin orchestration layer
- Assertions use `expect()` from `@wdio/globals`
- Test data comes from files, never hardcoded
- No raw selectors inside step definitions

### [Generate From Jira Ticket](skills/generate-from-jira-ticket.md)
Optional MCP-based workflow to generate BDD scenarios from a Jira ticket.
- Input: ticket ID (example: `ABC-123`)
- Fetches story details from Jira via MCP tool
- Generates Gherkin scenarios with correct tags
- Requires user confirmation before writing files
- Falls back to manual requirement flow if MCP is unavailable

## Hooks

### [Pre-Commit Hook](hooks/pre-commit.md)
Automated security and quality gate before code is committed.
- ✅ No hardcoded credentials/PII
- ✅ Linting passes (`npm run lint`)
- ✅ Smoke tests pass locally
- ✅ Naming conventions followed
- ✅ No `browser.pause()` calls

### [Post-Test Hook](hooks/post-test.md)
Automated analysis after tests run.
- Checks exit codes
- Diagnoses failure root causes
- Suggests `@quarantine` tag instead of test deletion
- Prompts to start mock server if connection refused
- Shows clear summaries and next steps

## Agents

### [Test Writer Agent](agents/test-writer.md)
**Trigger:** "Write a test for...", "Create a feature that..."

Autonomous workflow to create complete BDD tests from requirements:
1. Asks clarifying questions
2. Creates feature file
3. Creates/updates page object
4. Implements step definitions
5. Verifies locally
6. Reports results

**Example:** User says "Test the affordability calculator with high commitments" → Agent creates feature, step definitions, and page object methods, then runs `npm run test:smoke` to verify.

### [Bug Triage Agent](agents/bug-triage.md)
**Trigger:** "Why is test X failing?", "Debug this"

Autonomous debugging workflow:
1. Gathers failure info (error message, stack trace, exit code)
2. Diagnoses by test type (BDD, API, Performance, A11y)
3. Identifies root cause (mock server down, stale selector, API schema, etc.)
4. Suggests specific fix with file/line number
5. Re-runs to verify fix

**Example:** `ERR_CONNECTION_REFUSED` → Agent checks if mock server is running, suggests `node mock-server.js` or `node run-all-tests.js`.

### [Regression Prevention Agent](agents/regression-prevention.md)
**Trigger:** "Review this change for test coverage", "What should I test?"

Analyzes code changes and recommends new test scenarios:
1. Identifies what logic changed
2. Checks existing test coverage
3. Flags gaps (edge cases, boundary conditions)
4. Recommends new scenarios with Given/When/Then
5. Prioritizes by risk (critical → low)

**Example:** DTI threshold lowered from 50% → 40% → Agent recommends scenarios for DTI 38%, 40%, 40.8% to verify boundary behavior.

## Usage

### Automatic
Hooks run automatically:
- **Pre-commit:** Gate before code is committed (if configured)
- **Post-test:** Runs after any test suite completes

### Manual / Explicit
Invoke agents by asking Copilot directly:
```
"Write a test for the loan approval flow"
"Why is the accessibility test failing?"
"Review my changes — what tests should I add?"
```

Optional MCP invocation example:
```
"Use ticket ABC-123 and create BDD scenarios"
```

## Rules for Agents

All agents follow the principles from `CLAUDE.md`:
- **POM is mandatory** — No selectors in step definitions
- **One page per object** — Shared components in `components/`
- **Thin steps** — Orchestration only, assertions in expectations
- **No hardcoded data** — Always use `test-data/*.json` + env vars
- **No PII** — Synthetic test data only (regulated environment)
- **Every new page** needs `@smoke` scenario
- **Flaky tests** get `@quarantine` tag, never deleted

## Integration

These files are read-only configuration. The agent (GitHub Copilot / Claude) uses them to:
- Understand the repo's conventions and constraints
- Apply consistent patterns when creating/modifying code
- Make informed decisions about test coverage and debugging
- Provide context-aware suggestions

No manual editing needed unless patterns or conventions change.

For optional MCP setup, see `.vscode/mcp.json.example`.
