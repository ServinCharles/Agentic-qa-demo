const baseConfig = require('./wdio.conf.js');

exports.config = {
  ...baseConfig.config,
  
  // BrowserStack credentials from environment variables
  user: process.env.BROWSERSTACK_USERNAME,
  key: process.env.BROWSERSTACK_ACCESS_KEY,
  
  // BrowserStack settings
  services: [
    ['browserstack', {
      browserstackLocal: true,
      forceLocal: true,
      // BrowserStack Accessibility Testing: scans pages during the run and reports them in the BrowserStack
      // dashboard. Off unless BROWSERSTACK_ACCESSIBILITY=true (it's a separate BrowserStack product).
      accessibility: process.env.BROWSERSTACK_ACCESSIBILITY === 'true',
      accessibilityOptions: { wcagVersion: 'wcag21aa' }
    }]
  ],
  
  // BrowserStack capabilities
  capabilities: [
    {
      browserName: 'chrome',
      browserVersion: 'latest',
      'bstack:options': {
        os: 'Windows',
        osVersion: '11',
        buildName: 'DIP Mortgage Tests',
        projectName: 'Agentic QA Demo'
      }
    },
    {
      browserName: 'firefox',
      browserVersion: 'latest',
      'bstack:options': {
        os: 'Windows',
        osVersion: '11',
        buildName: 'DIP Mortgage Tests',
        projectName: 'Agentic QA Demo'
      }
    },
    {
      browserName: 'Safari',
      browserVersion: 'latest',
      'bstack:options': {
        os: 'OS X',
        osVersion: 'Ventura',
        buildName: 'DIP Mortgage Tests',
        projectName: 'Agentic QA Demo'
      }
    }
  ],
  
  maxInstances: 3,
  
  // Timeouts
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3
};
