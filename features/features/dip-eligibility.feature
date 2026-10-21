@dip @regression
Feature: DIP affordability assessment
  As a mortgage applicant
  I want an instant affordability decision
  So that I know my borrowing range before a full application

  # Applicant details come from test-data/applicants.json (standardApplicant, referredApplicant, declinedApplicant)

  Background:
    Given a new Decision-in-Principle journey has started

  Scenario Outline: Give a <decision> decision to a <applicant> applicant
    When the <applicant> applicant requests a decision
    Then the decision is "<decision>"
    And the <detail> is displayed

    @smoke
    Examples: Within standard affordability limits
      | applicant | decision | detail                   |
      | standard  | Accepted | maximum borrowing amount |

    Examples: Loan above the income multiple cap
      | applicant | decision | detail                    |
      | referred  | Referred | referral guidance message |

    @e2e
    Examples: Excessive existing commitments
      | applicant | decision | detail                   |
      | declined  | Declined | maximum borrowing amount |

  Scenario: Accept a loan exactly at the 4.5x income multiple cap
    Given the applicant declares an annual income of £40,000
    And they have no existing credit commitments
    When they request a decision for a £180,000 loan
    Then the decision is "Accepted"
