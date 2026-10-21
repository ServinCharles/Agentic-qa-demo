/* global document, window, getComputedStyle */
const { browser, $ } = require('@wdio/globals');
const locators = require('../Locators/dipJourney.locators');

class DipJourneyPage {
  get annualIncomeInput() { return $(locators.annualIncomeInput); }
  get monthlyCommitmentsInput() { return $(locators.monthlyCommitmentsInput); }
  get loanAmountInput() { return $(locators.loanAmountInput); }
  get getDecisionButton() { return $(locators.getDecisionButton); }

  async open() {
    await browser.url('/mortgages/decision-in-principle');
    await this.annualIncomeInput.waitForDisplayed();
  }

  async enterAnnualIncome(amount) {
    await this.annualIncomeInput.setValue(amount);
  }

  async enterMonthlyCommitments(amount) {
    await this.monthlyCommitmentsInput.setValue(amount);
  }

  async requestDecision(loanAmount) {
    await this.loanAmountInput.setValue(loanAmount);
    await this.getDecisionButton.click();
  }

  // data-testid of the element that has keyboard focus
  async focusedTestId() {
    return browser.execute(() => document.activeElement && document.activeElement.getAttribute('data-testid'));
  }

  // How the element with this data-testid looks while it has keyboard focus
  async focusIndicatorFor(testId) {
    await this.tabTo(testId);
    return browser.execute(() => {
      const style = getComputedStyle(document.activeElement);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, boxShadow: style.boxShadow };
    });
  }

  // Sets the page viewport (CSS pixels); falls back to resizing the window where the browser can't emulate one
  async setViewport(width, height) {
    try {
      await browser.setViewport({ width, height });
    } catch {
      await browser.setWindowSize(width, height);
    }
  }

  // Width of content that doesn't fit: more than 0 means the page scrolls sideways
  async horizontalOverflow() {
    return browser.execute(() => document.documentElement.scrollWidth - window.innerWidth);
  }

  async mainHeadingCount() {
    return browser.execute(() => document.querySelectorAll('h1').length);
  }

  // Presses Tab until the element with this data-testid has focus (fails if it's never reached)
  async tabTo(testId, maxTabs = 25) {
    for (let i = 0; i < maxTabs; i++) {
      if (await this.focusedTestId() === testId) return;
      await browser.keys('Tab');
    }
    throw new Error(`Keyboard focus never reached [data-testid="${testId}"] within ${maxTabs} Tab presses`);
  }

  // The whole journey with the keyboard only: Tab to each field in order, type, then Enter on the button
  async requestDecisionWithKeyboardFor(applicant) {
    const steps = [
      ['applicant-annual-income', applicant.annualIncome],
      ['monthly-commitments', applicant.monthlyCommitments],
      ['requested-loan-amount', applicant.requestedLoan]
    ];
    for (const [testId, value] of steps) {
      await this.tabTo(testId);
      await browser.keys(String(value).split(''));
    }
    await this.tabTo('get-decision');
    await browser.keys('Enter');
  }

  // Fills the form from an applicant in test-data/applicants.json and asks for a decision
  async requestDecisionFor(applicant) {
    await this.enterAnnualIncome(String(applicant.annualIncome));
    await this.enterMonthlyCommitments(String(applicant.monthlyCommitments));
    await this.requestDecision(String(applicant.requestedLoan));
  }
}

module.exports = new DipJourneyPage();
