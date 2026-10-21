const { Given, When, Then } = require('@wdio/cucumber-framework');
const { expect } = require('@wdio/globals');
const dipJourneyPage = require('../pages/dipJourney.page');
const dipDecisionPage = require('../pages/dipDecision.page');
const applicants = require('../../test-data/applicants.json');

// "the standard applicant" -> applicants.standardApplicant
function applicantNamed(name) {
  const applicant = applicants[`${name}Applicant`];
  if (!applicant) {
    const known = Object.keys(applicants).filter(key => key.endsWith('Applicant')).map(key => key.replace('Applicant', ''));
    throw new Error(`Unknown applicant "${name}" in test-data/applicants.json. Known: ${known.join(', ')}`);
  }
  return applicant;
}

Given('a new Decision-in-Principle journey has started', async () => {
  await dipJourneyPage.open();
});

When('the {word} applicant requests a decision', async (name) => {
  await dipJourneyPage.requestDecisionFor(applicantNamed(name));
});

// Steps with the amounts written in the scenario, for cases where the exact value is the point (e.g. boundaries)
Given('the applicant declares an annual income of {amount}', async (amount) => {
  await dipJourneyPage.enterAnnualIncome(String(amount));
});

Given('they have no existing credit commitments', async () => {
  await dipJourneyPage.enterMonthlyCommitments('0');
});

Given('they have monthly credit commitments of {amount}', async (amount) => {
  await dipJourneyPage.enterMonthlyCommitments(String(amount));
});

When('they request a decision for a {amount} loan', async (amount) => {
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
