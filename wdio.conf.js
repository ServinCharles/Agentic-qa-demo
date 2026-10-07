exports.config = {
    runner: 'local',
    
    specs: [
        './features/**/*.feature'
    ],
    
    exclude: [],
    
    maxInstances: 1,
    
    capabilities: [{
        browserName: 'chrome',
        ...(process.env.CHROME_BIN && {
            'goog:chromeOptions': {
                binary: process.env.CHROME_BIN,
                args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
            },
            'wdio:chromedriverOptions': { binary: process.env.CHROMEDRIVER_PATH }
        })
    }],

    logLevel: 'warn',
    
    bail: 0,
    
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    
    waitforTimeout: 10000,
    
    connectionRetryTimeout: 120000,
    
    connectionRetryCount: 3,
    
    services: [],

    framework: 'cucumber',
    
    reporters: [
        'spec',
        [
            'allure',
            {
                outputDir: 'allure-results',
                disableWebdriverStepsReporting: false,
                disableWebdriverScreenshotsReporting: false,
                useCucumberStepReporter: true
            }
        ]
    ],

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
        tagExpression: '',
        timeout: 60000,
        ignoreUndefinedDefinitions: false
    }
};
