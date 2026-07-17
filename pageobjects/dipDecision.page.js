const { $ } = require('@wdio/globals');

class DipDecisionPage {
  get decisionBadge() { return $('[data-testid="decision-outcome"]'); }
  get maxBorrowingAmount() { return $('[data-testid="max-borrowing-amount"]'); }
  get referralGuidance() { return $('[data-testid="referral-guidance"]'); }
}

module.exports = new DipDecisionPage();
