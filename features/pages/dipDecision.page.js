/* global document */
const { $, browser } = require('@wdio/globals');
const locators = require('../Locators/dipDecision.locators');

class DipDecisionPage {
  get decisionBadge() { return $(locators.decisionBadge); }
  get maxBorrowingAmount() { return $(locators.maxBorrowingAmount); }
  get referralGuidance() { return $(locators.referralGuidance); }

  // The aria-live or status role that makes screen readers announce the decision, or null if there is none
  async announcement() {
    return browser.execute((selector) => {
      for (let el = document.querySelector(selector); el; el = el.parentElement) {
        const live = el.getAttribute('aria-live');
        const role = el.getAttribute('role');
        if (live === 'polite' || live === 'assertive') return `aria-live="${live}"`;
        if (['status', 'alert', 'log'].includes(role)) return `role="${role}"`;
      }
      return null;
    }, locators.decisionBadge);
  }
}

module.exports = new DipDecisionPage();
