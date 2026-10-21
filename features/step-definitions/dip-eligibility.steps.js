const { Given, When, Then } = require('@wdio/cucumber-framework');
const { expect } = require('@wdio/globals');
const dipJourneyPage = require('../pages/dipJourney.page');
const dipDecisionPage = require('../pages/dipDecision.page');

Given('a new Decision-in-Principle journey has started', async () => {
  await dipJourneyPage.open();
});

Given('the applicant declares an annual income of {money}', async (amount) => {
  await dipJourneyPage.enterAnnualIncome(String(amount));
});

Given('they have no existing credit commitments', async () => {
  await dipJourneyPage.enterMonthlyCommitments('0');
});

Given('they have monthly credit commitments of {money}', async (amount) => {
  await dipJourneyPage.enterMonthlyCommitments(String(amount));
});

When('they request a decision for a {money} loan', async (amount) => {
  await dipJourneyPage.requestDecision(String(amount));
});

Then('the decision is {string}', async (expectedDecision) => {
  await expect(dipDecisionPage.decisionBadge).toHaveText(expectedDecision);
});

Then('the maximum borrowing amount is displayed', async () => {
  await expect(dipDecisionPage.maxBorrowingAmount).toBeDisplayed();
});

Then('the referral guidance message is displayed', async () => {
  await expect(dipDecisionPage.referralGuidance).toBeDisplayed();
});
