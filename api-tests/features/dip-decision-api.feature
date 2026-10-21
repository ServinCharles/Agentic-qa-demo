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
    And the response matches the "error" schema

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

  # Robustness: malformed bodies, hostile IDs and response times. Every rejection
  # must be a 4xx with the standard error body, never a 500 or a crash.

  Scenario Outline: Reject a malformed decision request body (<problem>)
    When I send the decision request body '<body>'
    Then the response status is 400
    And the error message is "Invalid JSON"
    And the response matches the "error" schema

    Examples:
      | problem           | body                    |
      | cut-off JSON      | {"annualIncome": 45000, |
      | plain text        | annual income 45000     |
      | a JSON array      | [45000, 150000, 0]      |
      | JSON null         | null                    |
      | an empty body     |                         |

  Scenario: Reject a malformed borrowing power request body
    When I send the borrowing power request body '{"annualIncome": 50000'
    Then the response status is 400
    And the error message is "Invalid JSON"
    And the response matches the "error" schema

  Scenario Outline: Reject a hostile application ID (<problem>) without a server error
    When I fetch the application ID <id>
    Then the response status is 400
    And the response matches the "error" schema

    Examples:
      | problem          | id                        |
      | NoSQL operator   | {"$ne": null}             |
      | path traversal   | ../../etc/passwd          |
      | SQL injection    | ' OR '1'='1               |
      | script tag       | <script>alert(1)</script> |
      | lower-case ID    | aip-20261021-abcdef12     |

  Scenario: Reject a very long application ID without a server error
    When I fetch the application with an ID of 1000 characters
    Then the response status is 400
    And the response matches the "error" schema

  Scenario Outline: Respond within the time limit (<endpoint>)
    When <request>
    Then the response status is 200
    And the response time is within the limit

    Examples:
      | endpoint        | request                                                   |
      | home page       | I open the home page                                      |
      | decision        | I request a decision for the standard applicant           |
      | borrowing power | I calculate borrowing power for the standard applicant    |
