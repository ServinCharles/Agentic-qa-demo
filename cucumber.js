// Cucumber profiles for the API and events features (no browser). The UI features run through WebdriverIO (wdio.conf.js).
//   npm run test:api      -> cucumber-js --profile api
//   npm run test:events   -> cucumber-js --profile events
// Always name a profile: there is no default (see below).
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

// No "default" profile on purpose: WebdriverIO's Cucumber runner loads the default profile too, so its JUnit
// output would be written by every browser worker at once into reports/api-tests.xml and corrupt it.
module.exports = {
  api: profile('dip-decision-api', 'api-tests', 'API'),
  events: profile('decision-audit', 'events-tests', 'Events')
};
