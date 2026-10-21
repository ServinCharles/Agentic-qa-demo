const baseConfig = require('./wdio.conf.js');

// BrowserStack compatibility matrix: the same scenarios across desktop browsers and real mobile devices.
//   npm run test:compatibility          @smoke (default)
//   npm run test:compatibility:full     every scenario
// Needs BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY. BrowserStack Local tunnels to BASE_URL, so it
// works against the mock or a sit-01 port-forward. Each session uses BrowserStack minutes.
const BUILD = `Compatibility ${process.env.BUILD_NUMBER ? `#${process.env.BUILD_NUMBER}` : 'local'}`;
const common = { buildName: BUILD, projectName: 'DIP Mortgage' };

function desktop(browserName, browserVersion, os, osVersion) {
  return {
    browserName,
    browserVersion,
    'bstack:options': { ...common, os, osVersion, sessionName: `${browserName} ${browserVersion} - ${os} ${osVersion}` }
  };
}

function mobile(browserName, deviceName, osVersion) {
  return {
    browserName,
    'bstack:options': { ...common, deviceName, osVersion, realMobile: 'true', sessionName: `${browserName} - ${deviceName}` }
  };
}

exports.config = {
  ...baseConfig.config,
  
  // BrowserStack credentials
  user: process.env.BROWSERSTACK_USERNAME,
  key: process.env.BROWSERSTACK_ACCESS_KEY,
  
  // BrowserStack compatibility testing service
  services: [
    ['browserstack', {
      browserstackLocal: true,
      forceLocal: true,
      accessibility: process.env.BROWSERSTACK_ACCESSIBILITY === 'true',
      accessibilityOptions: { wcagVersion: 'wcag21aa' },
      opts: {
        logFile: './logs/browserstack.log'
      }
    }]
  ],
  
  // Comprehensive browser compatibility matrix
  // Desktop: current and previous browser versions (BrowserStack's rolling "latest"/"latest-1", so the
  // matrix doesn't go stale) on Windows 11/10 and the two newest macOS versions BrowserStack offers.
  // Mobile: real devices. Check names and versions with https://www.browserstack.com/automate/capabilities
  capabilities: [
    desktop('chrome', 'latest', 'Windows', '11'),
    desktop('chrome', 'latest-1', 'Windows', '10'),
    desktop('edge', 'latest', 'Windows', '11'),
    desktop('firefox', 'latest', 'Windows', '11'),
    desktop('firefox', 'latest', 'OS X', 'Sequoia'),
    desktop('safari', 'latest', 'OS X', 'Sequoia'),
    desktop('safari', 'latest', 'OS X', 'Sonoma'),
    mobile('safari', 'iPhone 15', '17'),
    mobile('chrome', 'Google Pixel 8', '14.0')
  ],
  maxInstances: 5, // BrowserStack parallel sessions (the free plan allows 5)
  
  connectionRetryTimeout: 180000,
  connectionRetryCount: 3,
  
  cucumberOpts: {
    require: ['./features/support/**/*.js', './features/step-definitions/**/*.steps.js'],
    backtrace: false,
    requireModule: [],
    dryRun: false,
    failFast: false,
    name: [],
    snippets: true,
    source: true,
    strict: false,
    tagExpression: '@smoke',  // Compatibility tests use smoke tests only
    timeout: 60000,
    ignoreUndefinedDefinitions: false
  }
};
