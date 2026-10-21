const { browser } = require('@wdio/globals');
const { AxeBuilder } = require('@axe-core/webdriverio');
const allureReporter = require('@wdio/allure-reporter').default;

// WCAG 2.1 A and AA rules. Which impacts fail the scenario: A11Y_IMPACTS, default "critical,serious".
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const FAILING_IMPACTS = (process.env.A11Y_IMPACTS || 'critical,serious').split(',').map(impact => impact.trim());

// Scans the current page with axe-core, attaches the full results to the Allure report,
// and returns the violations at a failing impact level.
async function scanPage(name) {
  const results = await new AxeBuilder({ client: browser }).withTags(WCAG_TAGS).analyze();
  allureReporter.addAttachment(`axe results: ${name}`, JSON.stringify(results.violations, null, 2), 'application/json');
  return results.violations.filter(violation => FAILING_IMPACTS.includes(violation.impact));
}

function describeViolations(violations) {
  return violations.map(v =>
    `- [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} element(s), e.g. ${v.nodes[0]?.target?.join(' ')})\n  ${v.helpUrl}`
  ).join('\n');
}

module.exports = { scanPage, describeViolations, FAILING_IMPACTS };
