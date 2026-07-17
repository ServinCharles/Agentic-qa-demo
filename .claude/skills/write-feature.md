# Skill: Write Feature File

## Trigger
Use this skill when asked to create a new feature file or add scenarios to an existing one.

## Rules
- File name must be `kebab-case.feature` under `features/`
- Every feature needs a corresponding step definition file mirroring its name
- Every new feature must have at least one `@smoke` scenario
- Additional scenarios tagged `@regression` and `@dip` where applicable
- Gherkin structure: Given = state, When = action, Then = observable outcome
- Scenario titles must start with a verb
- Never put selectors or test data inline — use step parameters only
- Flaky scenarios get `@quarantine` tag, never deleted

## Template
```gherkin
@smoke @regression @dip
Feature: <Feature name>
  As a <persona>
  I want <goal>
  So that <benefit>

  Scenario: <Verb-led title>
    Given <precondition using test-data>
    When <action>
    Then <observable outcome>
    And <secondary outcome>
```

## After creating the feature file
1. Create the matching step definition file in `features/step-definitions/`
2. Create or update the page object in `pageobjects/`
3. Run `npm run test:smoke` to verify it passes locally
