const { browser, $ } = require('@wdio/globals');

class DipJourneyPage {
  get annualIncomeInput() { return $('[data-testid="applicant-annual-income"]'); }
  get monthlyCommitmentsInput() { return $('[data-testid="monthly-commitments"]'); }
  get loanAmountInput() { return $('[data-testid="requested-loan-amount"]'); }
  get getDecisionButton() { return $('[data-testid="get-decision"]'); }

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
