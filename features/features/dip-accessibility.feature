@dip @a11y @regression
Feature: DIP journey accessibility
  As a mortgage applicant who uses assistive technology, a keyboard or a small screen
  I want the decision journey to meet WCAG 2.1 AA
  So that I can get a decision without barriers

  # axe-core checks WCAG 2.1 A and AA rules; critical and serious violations fail the scenario
  # (A11Y_IMPACTS). Full axe results are attached to the Allure report. Automated checks cover part
  # of WCAG only: screen reader behaviour, zoom to 200% and content meaning stay manual checks.

  Background:
    Given a new Decision-in-Principle journey has started

  Scenario: Show an accessible empty application form
    Then the page has no serious accessibility violations

  Scenario Outline: Show an accessible <decision> result
    When the <applicant> applicant requests a decision
    Then the decision is "<decision>"
    And the page has no serious accessibility violations

    Examples:
      | applicant | decision |
      | standard  | Accepted |
      | referred  | Referred |
      | declined  | Declined |

  # WCAG 2.1.1 Keyboard
  Scenario: Complete the journey using only the keyboard
    When the standard applicant requests a decision using only the keyboard
    Then the decision is "Accepted"
    And the maximum borrowing amount is displayed

  # WCAG 2.4.7 Focus Visible
  Scenario: Show where keyboard focus is on every form control
    Then every form control shows a visible focus indicator

  # WCAG 4.1.3 Status Messages
  Scenario: Announce the decision to screen reader users
    When the standard applicant requests a decision
    Then the decision is "Accepted"
    And the decision is announced to screen readers

  # WCAG 1.4.10 Reflow
  Scenario: Fit the journey on a 320 pixel wide screen without scrolling sideways
    When the page is shown at 320 CSS pixels wide
    Then the content fits without scrolling sideways
    And the page has no serious accessibility violations

  # WCAG 1.3.1 Info and Relationships (best practice: one h1 per page)
  Scenario: Give the page one main heading
    Then the page has exactly one main heading
