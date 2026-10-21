const { When, Then } = require('@wdio/cucumber-framework');
const { expect } = require('@wdio/globals');
const dipJourneyPage = require('../pages/dipJourney.page');
const dipDecisionPage = require('../pages/dipDecision.page');
const { scanPage, describeViolations, FAILING_IMPACTS } = require('../support/accessibility');
const applicants = require('../../test-data/applicants.json');

When('the {word} applicant requests a decision using only the keyboard', async (name) => {
  const applicant = applicants[`${name}Applicant`];
  if (!applicant) throw new Error(`Unknown applicant "${name}" in test-data/applicants.json`);
  await dipJourneyPage.requestDecisionWithKeyboardFor(applicant);
});

Then('the page has no serious accessibility violations', async function () {
  const violations = await scanPage(this.pickle?.name || 'page');
  await expect(violations.length).toBe(0,
    { message: `${violations.length} accessibility violation(s) at impact ${FAILING_IMPACTS.join('/')}:\n${describeViolations(violations)}` });
});


Then('the decision is announced to screen readers', async () => {
  const announcement = await dipDecisionPage.announcement();
  await expect(announcement).not.toBeNull({
    message: 'The decision is not inside an aria-live region or a status/alert role, so screen readers will not announce it (WCAG 4.1.3)'
  });
});

Then('every form control shows a visible focus indicator', async () => {
  const missing = [];
  for (const testId of ['applicant-annual-income', 'monthly-commitments', 'requested-loan-amount', 'get-decision']) {
    const style = await dipJourneyPage.focusIndicatorFor(testId);
    const outline = style.outlineStyle !== 'none' && style.outlineWidth !== '0px';
    const shadow = style.boxShadow && style.boxShadow !== 'none';
    if (!outline && !shadow) missing.push(`${testId} (${JSON.stringify(style)})`);
  }
  await expect(missing).toEqual([], { message: `No visible focus indicator (WCAG 2.4.7) on: ${missing.join(', ')}` });
});

When('the page is shown at {int} CSS pixels wide', async (width) => {
  await dipJourneyPage.setViewport(width, 640);
});

Then('the content fits without scrolling sideways', async () => {
  const overflow = await dipJourneyPage.horizontalOverflow();
  await expect(overflow <= 1).toBe(true, { message: `The page scrolls sideways by ${overflow}px (WCAG 1.4.10 Reflow)` });
});

Then('the page has exactly one main heading', async () => {
  await expect(await dipJourneyPage.mainHeadingCount()).toBe(1);
});
