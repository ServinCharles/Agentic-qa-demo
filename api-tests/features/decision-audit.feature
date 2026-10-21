@events
Feature: Decisions saved and audited
  As the mortgage platform
  I want every decision saved and recorded in the audit trail exactly once
  So that any decision can be traced later

  # Events arrive asynchronously (aip-api -> Kafka -> aip-audit-service), so the audit steps
  # poll until the event appears or EVENT_TIMEOUT_MS passes, instead of sleeping.

  Scenario: Return an application ID with each decision
    When I request a decision for the standard applicant
    Then the response status is 200
    And the decision is "Accepted"
    And the response has an application ID

  Scenario: Give every decision its own application ID
    When I request two decisions for the standard applicant
    Then the two application IDs are different

  Scenario: Save the application with the submitted form and the decision
    Given a decision has been made for the standard applicant
    When I fetch the saved application
    Then the response status is 200
    And the response matches the "application" schema
    And the saved application matches the submitted form and the decision

  Scenario: Return 404 for an unknown application
    When I fetch the application "AIP-20000101-00000000"
    Then the response status is 404
    And the response matches the "error" schema

  Scenario: Return 400 for an invalid application ID
    When I fetch the application "not-an-id"
    Then the response status is 400
    And the response matches the "error" schema

  Scenario: Audit the decision as an AipDecisionMade event
    Given a decision has been made for the standard applicant
    When the decision event is audited
    Then the audited event matches the "auditEvent" schema
    And the audited event matches the decision
    And the audited event does not contain the applicant's income

  Scenario: Audit each decision exactly once
    Given a decision has been made for the standard applicant
    When the decision event is audited
    Then no duplicate event arrives within 2 seconds

  Scenario Outline: Audit a <decision> decision with the right outcome
    Given a decision has been made for the <applicant> applicant
    And the decision is "<decision>"
    When the decision event is audited
    Then the audited event decision is "<decision>"

    Examples:
      | applicant | decision |
      | standard  | Accepted |
      | referred  | Referred |
      | declined  | Declined |

  Scenario: Return an empty audit trail for an unknown application
    When I fetch the audit trail for "AIP-20000101-00000000"
    Then the response status is 200
    And the response matches the "auditTrail" schema
    And the audit trail is empty

  Scenario: Neither save nor audit a rejected decision
    When I request a decision with:
      | annualIncome | 45000  |
      | loanAmount   | -50000 |
    Then the response status is 400
    And the response has no application ID

  Scenario Outline: Reject a hostile ID on the audit trail (<problem>) without a server error
    When I fetch the audit trail for ID <id>
    Then the response status is 400
    And the response matches the "error" schema

    Examples:
      | problem        | id               |
      | NoSQL operator | {"$ne": null}    |
      | SQL injection  | ' OR '1'='1      |

  Scenario: Never expose server files through path traversal in an audit trail ID
    When I fetch the audit trail for ID ../../etc/passwd
    Then the response is not a server error
    And the response does not contain "root:"
