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
}

module.exports = new DipJourneyPage();
