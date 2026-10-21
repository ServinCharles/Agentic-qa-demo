const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert/strict');
const { toDecisionRequest, sleep } = require('../support/world');
const { schemaErrors, APPLICATION_ID } = require('../support/schemas');

Given('a decision has been made for the {word} applicant', async function (name) {
  const response = await this.requestDecision(toDecisionRequest(this.applicant(`${name}Applicant`)));
  assert.equal(response.status, 200, `Decision returned ${response.status}: ${response.raw}`);
  assert.match(this.decision?.applicationId || '', APPLICATION_ID,
    `Expected an applicationId like AIP-yyyyMMdd-XXXXXXXX, got ${JSON.stringify(this.decision?.applicationId)}`);
});

When('I request two decisions for the {word} applicant', async function (name) {
  const body = toDecisionRequest(this.applicant(`${name}Applicant`));
  this.applicationIds = [];
  for (let i = 0; i < 2; i++) {
    const response = await this.requestDecision(body);
    assert.equal(response.status, 200, `Decision returned ${response.status}: ${response.raw}`);
    this.applicationIds.push(response.body?.applicationId);
  }
});

When('I fetch the saved application', async function () {
  this.response = await this.api('GET', `/api/applications/${this.decision.applicationId}`);
});

When('I fetch the application {string}', async function (applicationId) {
  this.response = await this.api('GET', `/api/applications/${applicationId}`);
});

When('the decision event is audited', async function () {
  [this.event] = await this.waitForAuditedEvents(this.decision.applicationId);
});

When('I fetch the audit trail for {string}', async function (applicationId) {
  this.response = await this.audit(`/api/audit/${applicationId}`);
});

Then('the response has an application ID', function () {
  assert.match(this.response.body?.applicationId || '', APPLICATION_ID,
    `Expected an applicationId like AIP-yyyyMMdd-XXXXXXXX, got ${JSON.stringify(this.response.body?.applicationId)}`);
});

Then('the response has no application ID', function () {
  assert.equal(this.response.body?.applicationId, undefined,
    `A rejected request got applicationId ${this.response.body?.applicationId}`);
});

Then('the two application IDs are different', function () {
  const [first, second] = this.applicationIds;
  assert.match(first || '', APPLICATION_ID, `First decision had no valid applicationId: ${first}`);
  assert.notEqual(first, second, `Both decisions got ${first}`);
});

Then('the saved application matches the submitted form and the decision', function () {
  const saved = this.response.body;
  assert.equal(saved.id, this.decision.applicationId, 'saved id');
  assert.equal(saved.input.annualIncome, this.lastRequest.annualIncome, 'annualIncome');
  assert.equal(saved.input.loanAmount, this.lastRequest.loanAmount, 'loanAmount');
  assert.equal(saved.input.monthlyCommitments, this.lastRequest.existingCommitments, 'monthlyCommitments');
  assert.equal(saved.result.decision, this.decision.decision, 'decision');
  assert.equal(saved.result.maxBorrowing, this.decision.maxBorrowing, 'maxBorrowing');
  assert.ok(!Number.isNaN(Date.parse(saved.createdAt)), `createdAt is not a date: ${saved.createdAt}`);
});

Then('the audited event matches the {string} schema', function (schema) {
  const errors = schemaErrors(schema, this.event);
  assert.equal(errors, null, `Audited event doesn't match the ${schema} schema: ${errors}\nEvent: ${JSON.stringify(this.event)}`);
});

Then('the audited event matches the decision', function () {
  assert.equal(this.event.applicationId, this.decision.applicationId, 'applicationId');
  assert.equal(this.event.decision, this.decision.decision, 'decision');
  assert.equal(this.event.maxBorrowing, this.decision.maxBorrowing, 'maxBorrowing');
});

Then('the audited event does not contain the applicant\'s income', function () {
  assert.ok(!('annualIncome' in this.event), `The event carries annualIncome: ${JSON.stringify(this.event)}`);
});

Then('the audited event decision is {string}', function (expected) {
  assert.equal(this.event.decision, expected, `Audited ${this.event.decision} for a ${expected} decision`);
});

// Keeps checking for the whole window, so a late duplicate is caught as soon as it arrives
Then('no duplicate event arrives within {int} seconds', async function (seconds) {
  const deadline = Date.now() + seconds * 1000;
  let events = [];
  do {
    events = (await this.audit(`/api/audit/${this.decision.applicationId}`)).body?.events || [];
    assert.ok(events.length <= 1, `Expected 1 event, found ${events.length}`);
    await sleep(500);
  } while (Date.now() < deadline);
  assert.equal(events.length, 1, `Expected 1 event, found ${events.length}`);
});

Then('the audit trail is empty', function () {
  assert.deepEqual(this.response.body?.events, [], `Expected events: [], got ${this.response.raw}`);
});
