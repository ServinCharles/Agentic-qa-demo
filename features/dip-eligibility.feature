@dip @regression
Feature: DIP affordability assessment
  As a mortgage applicant
  I want an instant affordability decision
  So that I know my borrowing range before a full application

  Background:
    Given a new Decision-in-Principle journey has started

  @smoke
  Scenario: Accept an applicant within standard affordability limits
    Given the applicant declares an annual income of £45,000
    And they have no existing credit commitments
    When they request a decision for a £150,000 loan
    Then the decision is "Accepted"
    And the maximum borrowing amount is displayed

  Scenario: Refer an applicant whose loan exceeds the income multiple cap
    Given the applicant declares an annual income of £30,000
    And they have no existing credit commitments
    When they request a decision for a £200,000 loan
    Then the decision is "Referred"
    And the referral guidance message is displayed

  @e2e
  Scenario: Decline an applicant with excessive existing commitments
    Given the applicant declares an annual income of £45,000
    And they have monthly credit commitments of £1,800
    When they request a decision for a £150,000 loan
    Then the decision is "Declined"
