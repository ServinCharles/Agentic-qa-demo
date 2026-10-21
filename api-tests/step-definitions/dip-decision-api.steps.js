const { When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert/strict');
const { toRequestBody } = require('./common.steps');
const { toDecisionRequest } = require('../support/world');

When('I open the home page', async function () {
  this.response = await this.api('GET', '/');
});

When('I calculate borrowing power with:', async function (dataTable) {
  this.response = await this.api('POST', '/api/mortgages/dip/calculate-borrowing-power', toRequestBody(dataTable));
});

When('I calculate borrowing power for the {word} applicant', async function (name) {
  const { annualIncome, existingCommitments } = toDecisionRequest(this.applicant(`${name}Applicant`));
  this.response = await this.api('POST', '/api/mortgages/dip/calculate-borrowing-power', { annualIncome, existingCommitments });
});

When('I send the borrowing power request body {string}', async function (body) {
  this.response = await this.api('POST', '/api/mortgages/dip/calculate-borrowing-power', body);
});

// {} takes the rest of the line as written, so IDs can contain quotes, slashes or spaces
When('I fetch the application ID {}', async function (applicationId) {
  this.response = await this.api('GET', `/api/applications/${encodeURIComponent(applicationId)}`);
});

When('I fetch the application with an ID of {int} characters', async function (length) {
  this.response = await this.api('GET', `/api/applications/${'A'.repeat(length)}`);
});

Then('the response is JSON', function () {
  const contentType = (this.response.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  assert.equal(contentType, 'application/json', `Expected application/json, got ${contentType || 'no content type'}`);
});
