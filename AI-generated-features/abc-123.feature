@ticket-ABC-123 @generated @draft
Feature: Pre-populate income from profile for returning applicant
  # Source: mock Jira payload for ABC-123
  As a returning mortgage applicant
  I want to pre-populate previously verified annual income in DIP
  So that I can complete the journey faster with fewer data-entry mistakes

  Scenario: Pre-populate verified annual income for a returning applicant
    Given a returning applicant has a previously verified annual income of 52000
    And a new Decision-in-Principle journey has started
    When the applicant opens the affordability form
    Then the annual income field shows 52000
    And the applicant can continue without re-entering income

  Scenario: Leave annual income blank when no verified record exists
    Given a returning applicant does not have a verified annual income record
    And a new Decision-in-Principle journey has started
    When the applicant opens the affordability form
    Then the annual income field is blank
    And the annual income field is editable

  Scenario: Use applicant-edited annual income for the decision request
    Given a returning applicant has a pre-populated annual income of 52000
    And a new Decision-in-Principle journey has started
    When the applicant changes annual income to 60000
    And they request a decision for a 180000 loan
    Then the decision request uses annual income 60000
