// Cucumber profiles for the API and events features (no browser). The UI features run through WebdriverIO (wdio.conf.js).
//   npm run test:api      -> cucumber-js --profile api
//   npm run test:events   -> cucumber-js --profile events
const shared = {
  require: ['api-tests/support/**/*.js', 'api-tests/step-definitions/**/*.js'],
  strict: true // undefined or pending steps fail the run
};

function profile(feature, report, suiteName) {
  return {
    ...shared,
    paths: [`api-tests/features/${feature}.feature`],
    format: [
      'progress',
      'summary',
      `junit:reports/${report}.xml`,  // Jenkins test results, copied into the Allure report
      `html:reports/${report}.html`   // standalone report, archived by Jenkins
    ],
    formatOptions: { junit: { suiteName } }
  };
}

module.exports = {
  default: profile('dip-decision-api', 'api-tests', 'API'),
  api: profile('dip-decision-api', 'api-tests', 'API'),
  events: profile('decision-audit', 'events-tests', 'Events')
};
