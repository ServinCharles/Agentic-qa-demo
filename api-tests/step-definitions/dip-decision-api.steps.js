const { When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert/strict');
const { toRequestBody } = require('./common.steps');

When('I open the home page', async function () {
  this.response = await this.api('GET', '/');
});

When('I calculate borrowing power with:', async function (dataTable) {
  this.response = await this.api('POST', '/api/mortgages/dip/calculate-borrowing-power', toRequestBody(dataTable));
});

Then('the response is JSON', function () {
  const contentType = (this.response.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  assert.equal(contentType, 'application/json', `Expected application/json, got ${contentType || 'no content type'}`);
});
