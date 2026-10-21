// Shared state for one scenario, plus the settings for where the tests point.
//
//   BASE_URL          the app (web app or aip-api), e.g. http://localhost:8090   default http://localhost:3000 (mock)
//   AUDIT_URL         aip-audit-service, e.g. http://localhost:8091              default BASE_URL (the mock serves both)
//   EVENT_TIMEOUT_MS  how long to wait for an event to be audited                default 15000
//   MAX_RESPONSE_MS   response time limit for the timing scenarios               default 1000
const { setWorldConstructor, setDefaultTimeout, World } = require('@cucumber/cucumber');
const { request } = require('./http');
const applicants = require('../../test-data/applicants.json');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const AUDIT_URL = process.env.AUDIT_URL || BASE_URL;
const EVENT_TIMEOUT_MS = Number(process.env.EVENT_TIMEOUT_MS || 15000);
const POLL_INTERVAL_MS = 500;
const MAX_RESPONSE_MS = Number(process.env.MAX_RESPONSE_MS || 1000);

// Long enough for a step that polls for an event, plus a margin
setDefaultTimeout(EVENT_TIMEOUT_MS + 15000);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class ApiWorld extends World {
  constructor(options) {
    super(options);
    this.response = null;     // last HTTP response
    this.lastRequest = null;  // last decision request body
    this.decision = null;     // last successful decision
    this.event = null;        // last audited event
  }

  api(method, urlPath, body) {
    return request(BASE_URL, method, urlPath, body);
  }

  audit(urlPath) {
    return request(AUDIT_URL, 'GET', urlPath);
  }

  applicant(name) {
    const applicant = applicants[name];
    if (!applicant) {
      const known = Object.keys(applicants).filter(key => !key.startsWith('_'));
      throw new Error(`Unknown applicant "${name}" in test-data/applicants.json. Known: ${known.join(', ')}`);
    }
    return applicant;
  }

  async requestDecision(body) {
    this.lastRequest = body;
    this.response = await this.api('POST', '/api/mortgages/dip/decision', body);
    if (this.response.status === 200) this.decision = this.response.body;
    return this.response;
  }

  // Polls the audit trail until it has at least `count` events, or fails after EVENT_TIMEOUT_MS
  async waitForAuditedEvents(applicationId, count = 1) {
    const deadline = Date.now() + EVENT_TIMEOUT_MS;
    let last;
    while (Date.now() < deadline) {
      last = await this.audit(`/api/audit/${applicationId}`);
      if (last.status === 200 && (last.body?.events || []).length >= count) return last.body.events;
      await sleep(POLL_INTERVAL_MS);
    }
    throw new Error(`No audited event for ${applicationId} within ${EVENT_TIMEOUT_MS}ms (last response ${last?.status}: ${last?.raw})`);
  }
}

// The request body aip-api expects, from an applicant in test-data/applicants.json
function toDecisionRequest(applicant) {
  return {
    annualIncome: applicant.annualIncome,
    loanAmount: applicant.requestedLoan,
    existingCommitments: applicant.monthlyCommitments
  };
}

setWorldConstructor(ApiWorld);

module.exports = { toDecisionRequest, sleep, BASE_URL, AUDIT_URL, MAX_RESPONSE_MS };
