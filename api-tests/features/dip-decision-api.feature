@api
Feature: DIP decision API
  As the mortgage platform
  I want the decision API to give consistent, validated answers
  So that the web journey and other services can rely on it

  Scenario: Respond when the service is running
    When I open the home page
    Then the response status is 200

  Scenario Outline: Return the expected decision for a <applicant> applicant
    When I request a decision for the <applicant> applicant
    Then the response status is 200
    And the decision is "<decision>"
    And the response matches the "decision" schema

    Examples:
      | applicant | decision |
      | standard  | Accepted |
      | referred  | Referred |
      | declined  | Declined |

  Scenario: Return the decision as JSON in the agreed contract
    When I request a decision for the standard applicant
    Then the response status is 200
    And the response is JSON
    And the response matches the "decision" schema

  Scenario Outline: Reject a decision request with <problem>
    When I request a decision with:
      | annualIncome        | <annualIncome>        |
      | loanAmount          | <loanAmount>          |
      | existingCommitments | <existingCommitments> |
    Then the response status is 400

    Examples:
      | problem                | annualIncome | loanAmount | existingCommitments |
      | no annual income       |              | 150000     | 0                   |
      | a non-numeric income   | invalid      | 150000     | 0                   |
      | a negative loan amount | 45000        | -50000     | 0                   |
      | a zero annual income   | 0            | 100000     | 0                   |

  Scenario: Return a full decision for a high loan-to-income request
    When I request a decision with:
      | annualIncome        | 100000 |
      | loanAmount          | 400000 |
      | existingCommitments | 500    |
    Then the response status is 200
    And the response matches the "decision" schema

  Scenario: Calculate borrowing power from income and commitments
    When I calculate borrowing power with:
      | annualIncome        | 50000 |
      | existingCommitments | 200   |
    Then the response status is 200
    And the response matches the "calculator" schema
