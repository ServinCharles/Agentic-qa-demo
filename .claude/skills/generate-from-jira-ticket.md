# Skill: Generate Scenarios From Jira Ticket (Optional MCP)

## Trigger
Use this skill when a user provides a Jira ticket ID and asks to create test scenarios.

## Goal
Fetch current user story details through MCP, then convert them into BDD scenarios that fit this repo's standards.

## Inputs
- `ticketId` (example: `ABC-123`)
- Optional tags preference (`@smoke`, `@regression`, `@dip`)

## Workflow
1. Validate ticket ID format and ask clarifying questions if needed.
2. Use configured MCP Jira tool to fetch:
   - Title
   - Description
   - Acceptance criteria
   - Priority and labels (if present)
3. Extract testable behaviors and edge cases.
4. Draft Gherkin scenarios using repo conventions:
   - At least one `@smoke` scenario
   - Additional scenarios tagged `@regression` and `@dip` where applicable
   - Scenario titles must start with a verb
5. Ask for user confirmation before creating or editing files.
6. Create/update:
   - `features/<kebab-case>.feature`
   - Matching step definition file in `features/step-definitions/`
   - Relevant page object methods if needed
7. Run:
   - `npm run test:smoke`
   - `npm run lint`

## Fallback Behavior
If MCP or Jira access fails, continue with manual requirement intake and clearly state that live ticket data could not be fetched.

## Constraints
- Keep MCP optional. Do not block existing manual workflow.
- Never store Jira credentials in repo files.
- Use environment variables for all secrets.
- Never include PII or real account data in generated artefacts.
