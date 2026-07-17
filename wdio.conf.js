exports.config = {
    runner: 'local',
    
    specs: [
        './features/**/*.feature'
    ],
    
    exclude: [],
    
    maxInstances: 1,
    
    capabilities: [{
        browserName: 'chrome'
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
