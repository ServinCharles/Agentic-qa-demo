const baseConfig = require('./wdio.conf.js');

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
      opts: {
        logFile: './logs/browserstack.log'
      }
    }]
  ],
  
  // Comprehensive browser compatibility matrix
  capabilities: [
    // Chrome Versions
    {
      browserName: 'chrome',
      browserVersion: 'latest',
      'bstack:options': {
        os: 'Windows',
        osVersion: '11',
        buildName: 'Compatibility Tests',
        projectName: 'DIP Mortgage',
        sessionName: 'Chrome Latest - Windows 11'
      }
    },
    {
      browserName: 'chrome',
      browserVersion: '121',
      'bstack:options': {
        os: 'Windows',
        osVersion: '10',
        buildName: 'Compatibility Tests',
        projectName: 'DIP Mortgage',
        sessionName: 'Chrome 121 - Windows 10'
      }
    },
    
    // Firefox Versions
    {
      browserName: 'firefox',
      browserVersion: 'latest',
      'bstack:options': {
        os: 'Windows',
        osVersion: '11',
        buildName: 'Compatibility Tests',
        projectName: 'DIP Mortgage',
        sessionName: 'Firefox Latest - Windows 11'
      }
    },
    {
      browserName: 'firefox',
      browserVersion: '122',
      'bstack:options': {
        os: 'Windows',
        osVersion: '10',
        buildName: 'Compatibility Tests',
        projectName: 'DIP Mortgage',
        sessionName: 'Firefox 122 - Windows 10'
      }
    },
    
    // Safari Versions
    {
      browserName: 'Safari',
      browserVersion: 'latest',
      'bstack:options': {
        os: 'OS X',
        osVersion: 'Ventura',
        buildName: 'Compatibility Tests',
        projectName: 'DIP Mortgage',
        sessionName: 'Safari Latest - macOS Ventura'
      }
    },
    {
      browserName: 'Safari',
      browserVersion: '16',
      'bstack:options': {
        os: 'OS X',
        osVersion: 'Sonoma',
        buildName: 'Compatibility Tests',
        projectName: 'DIP Mortgage',
        sessionName: 'Safari 16 - macOS Sonoma'
      }
    },
    
    // Edge
    {
      browserName: 'Edge',
      browserVersion: 'latest',
      'bstack:options': {
        os: 'Windows',
        osVersion: '11',
        buildName: 'Compatibility Tests',
        projectName: 'DIP Mortgage',
        sessionName: 'Edge Latest - Windows 11'
      }
    },
    
    // Mobile - iOS
    {
      browserName: 'Safari',
      deviceName: 'iPhone 15',
      realMobile: true,
      'bstack:options': {
        buildName: 'Compatibility Tests',
        projectName: 'DIP Mortgage',
        sessionName: 'Safari - iPhone 15'
      }
    },
    
    // Mobile - Android
    {
      browserName: 'Chrome',
      deviceName: 'Google Pixel 8',
      realMobile: true,
      'bstack:options': {
        buildName: 'Compatibility Tests',
        projectName: 'DIP Mortgage',
        sessionName: 'Chrome - Google Pixel 8'
      }
    }
  ],
  
  maxInstances: 5,  // Increased parallelism
  
  connectionRetryTimeout: 180000,
  connectionRetryCount: 3,
  
  cucumberOpts: {
    require: ['./features/step-definitions/**/*.steps.js'],
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
