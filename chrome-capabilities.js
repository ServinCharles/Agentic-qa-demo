// Shared Chrome capabilities: headless Chromium in containers (CHROME_BIN set), plain Chrome locally
module.exports = {
  browserName: 'chrome',
  ...(process.env.CHROME_BIN && {
    'goog:chromeOptions': {
      binary: process.env.CHROME_BIN,
      args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    },
    'wdio:chromedriverOptions': { binary: process.env.CHROMEDRIVER_PATH }
  })
};
