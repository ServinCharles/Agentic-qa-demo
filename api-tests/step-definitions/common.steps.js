// Steps shared by the API and events features
const { When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert/strict');
const { toDecisionRequest } = require('../support/world');
const { schemaErrors } = require('../support/schemas');

// Table cells: empty = leave the field out, a number = a number, anything else = text (to test bad input)
function toRequestBody(dataTable) {
  const body = {};
  for (const [field, value] of Object.entries(dataTable.rowsHash())) {
    if (value === '') continue;
    body[field] = value.trim() !== '' && !Number.isNaN(Number(value)) ? Number(value) : value;
  }
  return body;
}

When('I request a decision for the {word} applicant', async function (name) {
  await this.requestDecision(toDecisionRequest(this.applicant(`${name}Applicant`)));
});

When('I request a decision with:', async function (dataTable) {
  await this.requestDecision(toRequestBody(dataTable));
});

Then('the response status is {int}', function (expected) {
  assert.equal(this.response.status, expected, `Expected ${expected}, got ${this.response.status}: ${this.response.raw}`);
});

Then('the decision is {string}', function (expected) {
  assert.equal(this.decision?.decision, expected, `Expected ${expected}, got ${JSON.stringify(this.response.body)}`);
});

Then('the response matches the {string} schema', function (schema) {
  const errors = schemaErrors(schema, this.response.body);
  assert.equal(errors, null, `Response doesn't match the ${schema} schema: ${errors}\nBody: ${this.response.raw}`);
});

module.exports = { toRequestBody };
