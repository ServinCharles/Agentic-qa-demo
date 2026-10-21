// JSON schemas for the API contracts. Extra fields are allowed, so the services can add fields
// without breaking the tests; required fields, types and allowed values are checked.
const Ajv = require('ajv');

const APPLICATION_ID = '^AIP-[0-9]{8}-[0-9A-F]{8}$';
const DECISIONS = ['Accepted', 'Referred', 'Declined'];

const schemas = {
  decision: {
    type: 'object',
    required: ['decision', 'reason', 'borrowingPower', 'maxBorrowing', 'loanToIncomeRatio', 'monthlyAffordability'],
    properties: {
      applicationId: { type: 'string', pattern: APPLICATION_ID },
      decision: { enum: DECISIONS },
      reason: { type: 'string', minLength: 1 },
      borrowingPower: { type: 'number' },
      maxBorrowing: { type: 'number' },
      loanToIncomeRatio: { type: 'number' },
      monthlyAffordability: { type: 'number' }
    }
  },

  calculator: {
    type: 'object',
    required: ['borrowingPower', 'maxLoan'],
    properties: {
      borrowingPower: { type: 'number' },
      maxLoan: { type: 'number', minimum: 0 }
    }
  },

  application: {
    type: 'object',
    required: ['id', 'createdAt', 'input', 'result'],
    properties: {
      id: { type: 'string', pattern: APPLICATION_ID },
      createdAt: { type: 'string', minLength: 1 },
      input: {
        type: 'object',
        required: ['annualIncome', 'loanAmount', 'monthlyCommitments'],
        properties: {
          annualIncome: { type: 'number' },
          loanAmount: { type: 'number' },
          monthlyCommitments: { type: 'number' }
        }
      },
      result: {
        type: 'object',
        required: ['decision', 'maxBorrowing'],
        properties: {
          decision: { enum: DECISIONS },
          maxBorrowing: { type: 'number' }
        }
      }
    }
  },

  // AipDecisionMade v1, as stored by aip-audit-service. It must not carry the applicant's income.
  auditEvent: {
    type: 'object',
    required: ['eventId', 'eventType', 'schemaVersion', 'applicationId', 'decision', 'maxBorrowing', 'occurredAt'],
    properties: {
      eventId: { type: 'string', minLength: 1 },
      eventType: { const: 'AipDecisionMade' },
      schemaVersion: { const: 1 },
      applicationId: { type: 'string', pattern: APPLICATION_ID },
      decision: { enum: DECISIONS },
      maxBorrowing: { type: 'number' },
      occurredAt: { type: 'string', minLength: 1 }
    },
    not: { required: ['annualIncome'] }
  },

  // Every 4xx answer: { "error": "...", "details": [...] } (details optional, may be null)
  error: {
    type: 'object',
    required: ['error'],
    properties: {
      error: { type: 'string', minLength: 1 },
      details: { anyOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }] }
    }
  },

  auditTrail: {
    type: 'object',
    required: ['applicationId', 'events'],
    properties: {
      applicationId: { type: 'string' },
      events: { type: 'array' }
    }
  }
};

const ajv = new Ajv({ allErrors: true });
const validators = Object.fromEntries(Object.entries(schemas).map(([name, schema]) => [name, ajv.compile(schema)]));

// Returns null when the value matches, otherwise a readable list of what doesn't
function schemaErrors(name, value) {
  const validate = validators[name];
  if (!validate) throw new Error(`Unknown schema "${name}". Known: ${Object.keys(validators).join(', ')}`);
  if (validate(value)) return null;
  return ajv.errorsText(validate.errors, { dataVar: name, separator: '; ' });
}

module.exports = { schemaErrors, APPLICATION_ID: new RegExp(APPLICATION_ID) };
