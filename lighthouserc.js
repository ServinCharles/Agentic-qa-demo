// Lighthouse CI: page performance, accessibility and best-practice budgets for the DIP web page.
//
//   npm run test:lighthouse                                   (BASE_URL, default http://localhost:3000)
//   BASE_URL=http://localhost:8090 npm run test:lighthouse    (the real aip-webapp, e.g. a sit-01 port-forward)
//
// Lighthouse runs 3 times (mobile, simulated slow 4G and CPU, its default) and the budgets are checked on
// the median run. "error" fails the build; "warn" is reported only. Reports: reports/lighthouse/.
// These are lab numbers for catching regressions, not real-user measurements.
const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

const median = { aggregationMethod: 'median' };

module.exports = {
  ci: {
    collect: {
      url: [`${BASE_URL}/mortgages/decision-in-principle`],
      numberOfRuns: 3,
      settings: {
        // --no-sandbox for containers and CI runners; CHROME_PATH chooses the browser if needed
        chromeFlags: '--headless=new --no-sandbox'
      }
    },
    assert: {
      assertions: {
        // Category scores (0 to 1)
        'categories:performance': ['error', { minScore: 0.9, ...median }],
        'categories:accessibility': ['error', { minScore: 0.9, ...median }],
        'categories:best-practices': ['error', { minScore: 0.9, ...median }],
        'categories:seo': ['warn', { minScore: 0.9, ...median }],

        // Core Web Vitals (lab): Google's "good" thresholds
        'largest-contentful-paint': ['error', { maxNumericValue: 2500, ...median }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1, ...median }],
        'total-blocking-time': ['error', { maxNumericValue: 200, ...median }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800, ...median }],

        // Delivery improvements worth knowing about, reported but not blocking
        'uses-text-compression': 'warn',
        'uses-long-cache-ttl': 'warn',
        'render-blocking-resources': 'warn',
        'meta-description': 'warn'
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: 'reports/lighthouse',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%'
    }
  }
};
