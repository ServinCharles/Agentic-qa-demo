const { $ } = require('@wdio/globals');
const locators = require('../Locators/dipDecision.locators');

class DipDecisionPage {
  get decisionBadge() { return $(locators.decisionBadge); }
  get maxBorrowingAmount() { return $(locators.maxBorrowingAmount); }
  get referralGuidance() { return $(locators.referralGuidance); }
}

module.exports = new DipDecisionPage();
