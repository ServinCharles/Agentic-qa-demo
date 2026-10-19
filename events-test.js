// Events suite: proves a decision is saved (aip-api + MongoDB) and audited (Kafka + aip-audit-service).
//
//   BASE_URL   the app (web app or aip-api), e.g. http://localhost:8090      default http://localhost:3000 (mock)
//   AUDIT_URL  aip-audit-service, e.g. http://localhost:8091                 default BASE_URL (the mock serves both)
//   EVENT_TIMEOUT_MS  how long to wait for an event to be audited            default 15000
//
// Events arrive asynchronously, so the audit checks poll until the event appears (or time out) instead of sleeping.
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const applicants = require('./test-data/applicants.json');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const AUDIT_URL = process.env.AUDIT_URL || BASE_URL;
const EVENT_TIMEOUT_MS = Number(process.env.EVENT_TIMEOUT_MS || 15000);
const POLL_INTERVAL_MS = 500;
const APPLICATION_ID = /^AIP-[0-9]{8}-[0-9A-F]{8}$/;
const DECISIONS = ['Accepted', 'Referred', 'Declined'];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function request(baseUrl, method, urlPath, data = null) {
  return new Promise((resolve, reject) => {
    const target = new URL(baseUrl + urlPath);
    const req = (target.protocol === 'https:' ? https : http).request({
      hostname: target.hostname,
      port: target.port || (target.protocol === 'https:' ? 443 : 80),
      path: target.pathname + target.search,
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 10000
    }, res => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        let body = null;
        try { body = raw ? JSON.parse(raw) : null; } catch { body = null; }
        resolve({ status: res.statusCode, body, raw });
      });
    });
    req.on('timeout', () => req.destroy(new Error(`Timed out calling ${baseUrl}`)));
    req.on('error', error => {
      // A refused connection to "localhost" arrives as an AggregateError with an empty message
      const reason = error.message || error.code || error.errors?.[0]?.code || String(error);
      reject(new Error(`${reason} (${baseUrl})`));
    });
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

const api = (method, urlPath, data) => request(BASE_URL, method, urlPath, data);
const audit = urlPath => request(AUDIT_URL, 'GET', urlPath);

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function toDecisionRequest(applicant) {
  return {
    annualIncome: applicant.annualIncome,
    loanAmount: applicant.requestedLoan,
    existingCommitments: applicant.monthlyCommitments
  };
}

async function decide(applicant) {
  const response = await api('POST', '/api/mortgages/dip/decision', toDecisionRequest(applicant));
  expect(response.status === 200, `Decision returned ${response.status}: ${response.raw}`);
  expect(APPLICATION_ID.test(response.body?.applicationId || ''),
    `Expected an applicationId like AIP-yyyyMMdd-XXXXXXXX, got ${JSON.stringify(response.body?.applicationId)}`);
  return response.body;
}

// Polls the audit trail until it has at least `count` events, or fails after EVENT_TIMEOUT_MS
async function waitForAuditedEvents(applicationId, count = 1) {
  const deadline = Date.now() + EVENT_TIMEOUT_MS;
  let last;
  while (Date.now() < deadline) {
    last = await audit(`/api/audit/${applicationId}`);
    if (last.status === 200 && (last.body?.events || []).length >= count) {
      return last.body.events;
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`No audited event for ${applicationId} within ${EVENT_TIMEOUT_MS}ms (last response ${last?.status}: ${last?.raw})`);
}

const tests = [
  {
    name: 'Decision returns an application ID',
    async run() {
      const decision = await decide(applicants.standardApplicant);
      expect(decision.decision === 'Accepted', `Expected Accepted, got ${decision.decision}`);
    }
  },
  {
    name: 'Every decision gets its own application ID',
    async run() {
      const first = await decide(applicants.standardApplicant);
      const second = await decide(applicants.standardApplicant);
      expect(first.applicationId !== second.applicationId, `Both decisions got ${first.applicationId}`);
    }
  },
  {
    name: 'Application saved: the stored form and result match what was submitted',
    async run() {
      const applicant = applicants.standardApplicant;
      const decision = await decide(applicant);

      const response = await api('GET', `/api/applications/${decision.applicationId}`);
      expect(response.status === 200, `Expected 200, got ${response.status}: ${response.raw}`);
      const saved = response.body;
      expect(saved.id === decision.applicationId, `Saved id ${saved.id} != ${decision.applicationId}`);
      expect(saved.input?.annualIncome === applicant.annualIncome, `annualIncome ${saved.input?.annualIncome} != ${applicant.annualIncome}`);
      expect(saved.input?.loanAmount === applicant.requestedLoan, `loanAmount ${saved.input?.loanAmount} != ${applicant.requestedLoan}`);
      expect(saved.input?.monthlyCommitments === applicant.monthlyCommitments, `monthlyCommitments ${saved.input?.monthlyCommitments} != ${applicant.monthlyCommitments}`);
      expect(saved.result?.decision === decision.decision, `Saved decision ${saved.result?.decision} != ${decision.decision}`);
      expect(saved.result?.maxBorrowing === decision.maxBorrowing, `Saved maxBorrowing ${saved.result?.maxBorrowing} != ${decision.maxBorrowing}`);
      expect(!Number.isNaN(Date.parse(saved.createdAt)), `createdAt is not a date: ${saved.createdAt}`);
    }
  },
  {
    name: 'Unknown application returns 404',
    async run() {
      const response = await api('GET', '/api/applications/AIP-20000101-00000000');
      expect(response.status === 404, `Expected 404, got ${response.status}`);
    }
  },
  {
    name: 'Invalid application ID returns 400',
    async run() {
      const response = await api('GET', '/api/applications/not-an-id');
      expect(response.status === 400, `Expected 400, got ${response.status}`);
    }
  },
  {
    name: 'Event audited: AipDecisionMade arrives with the right contract',
    async run() {
      const decision = await decide(applicants.standardApplicant);

      const [event] = await waitForAuditedEvents(decision.applicationId);
      expect(event.eventType === 'AipDecisionMade', `eventType ${event.eventType}`);
      expect(event.schemaVersion === 1, `schemaVersion ${event.schemaVersion}`);
      expect(event.applicationId === decision.applicationId, `applicationId ${event.applicationId}`);
      expect(event.decision === decision.decision, `decision ${event.decision} != ${decision.decision}`);
      expect(event.maxBorrowing === decision.maxBorrowing, `maxBorrowing ${event.maxBorrowing} != ${decision.maxBorrowing}`);
      expect(typeof event.eventId === 'string' && event.eventId.length > 0, 'eventId missing');
      expect(!('annualIncome' in event), 'Events must not carry the applicant\'s income');
    }
  },
  {
    name: 'Exactly one audited event per decision',
    async run() {
      const decision = await decide(applicants.standardApplicant);
      await waitForAuditedEvents(decision.applicationId);

      await sleep(2000); // give any duplicate time to arrive
      const response = await audit(`/api/audit/${decision.applicationId}`);
      const events = response.body?.events || [];
      expect(events.length === 1, `Expected 1 event, found ${events.length}`);
    }
  },
  {
    name: 'Accepted, Referred and Declined decisions are each audited correctly',
    async run() {
      const cases = [
        [applicants.standardApplicant, 'Accepted'],
        [applicants.referredApplicant, 'Referred'],
        [applicants.declinedApplicant, 'Declined']
      ];
      for (const [applicant, expected] of cases) {
        const decision = await decide(applicant);
        expect(decision.decision === expected, `Expected ${expected}, got ${decision.decision}`);
        const [event] = await waitForAuditedEvents(decision.applicationId);
        expect(DECISIONS.includes(event.decision) && event.decision === expected,
          `Audited ${event.decision} for a ${expected} decision`);
      }
    }
  },
  {
    name: 'Audit trail of an unknown application is empty',
    async run() {
      const response = await audit('/api/audit/AIP-20000101-00000000');
      expect(response.status === 200, `Expected 200, got ${response.status}`);
      expect(Array.isArray(response.body?.events) && response.body.events.length === 0,
        `Expected events: [], got ${response.raw}`);
    }
  },
  {
    name: 'A rejected decision is not saved or audited',
    async run() {
      const response = await api('POST', '/api/mortgages/dip/decision', { annualIncome: 45000, loanAmount: -50000 });
      expect(response.status === 400, `Expected 400, got ${response.status}`);
      expect(!response.body?.applicationId, `A rejected request got applicationId ${response.body?.applicationId}`);
    }
  }
];

function escapeXml(value) {
  return String(value).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]);
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║              📨 EVENTS TEST SUITE                       ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`   App:   ${BASE_URL}`);
  console.log(`   Audit: ${AUDIT_URL}`);
  console.log(`   Event timeout: ${EVENT_TIMEOUT_MS}ms\n`);

  const results = [];
  for (const test of tests) {
    const started = Date.now();
    try {
      await test.run();
      results.push({ name: test.name, passed: true, duration: Date.now() - started });
      console.log(`✅ ${test.name} (${Date.now() - started}ms)`);
    } catch (error) {
      results.push({ name: test.name, passed: false, duration: Date.now() - started, error: error.message });
      console.log(`❌ ${test.name}\n   ${error.message}`);
    }
  }

  const failed = results.filter(r => !r.passed).length;
  console.log(`\n📊 ${results.length - failed}/${results.length} passed`);

  // JUnit XML, picked up by Jenkins (junit '**/reports/**/*.xml')
  const reportDir = path.join(__dirname, 'reports');
  fs.mkdirSync(reportDir, { recursive: true });
  const cases = results.map(r => `  <testcase classname="events" name="${escapeXml(r.name)}" time="${(r.duration / 1000).toFixed(3)}">` +
    (r.passed ? '' : `<failure message="${escapeXml(r.error)}"/>`) + '</testcase>').join('\n');
  fs.writeFileSync(path.join(reportDir, 'events-tests.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<testsuite name="Events" tests="${results.length}" failures="${failed}">\n${cases}\n</testsuite>\n`);

  process.exit(failed ? 1 : 0);
}

main();
