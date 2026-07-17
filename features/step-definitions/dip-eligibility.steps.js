const { Given, When, Then } = require('@wdio/cucumber-framework');
const { expect } = require('@wdio/globals');
const dipJourneyPage = require('../../pageobjects/dipJourney.page');
const dipDecisionPage = require('../../pageobjects/dipDecision.page');

Given('a new Decision-in-Principle journey has started', async () => {
  await dipJourneyPage.open();
});

Given('the applicant declares an annual income of £{float},{int}', async (thousands, remainder) => {
  await dipJourneyPage.enterAnnualIncome(`${thousands}${remainder}`);
});

Given('they have no existing credit commitments', async () => {
  await dipJourneyPage.enterMonthlyCommitments('0');
});

Given('they have monthly credit commitments of £{float},{int}', async (thousands, remainder) => {
  await dipJourneyPage.enterMonthlyCommitments(`${thousands}${remainder}`);
});

When('they request a decision for a £{float},{int} loan', async (thousands, remainder) => {
  await dipJourneyPage.requestDecision(`${thousands}${remainder}`);
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
