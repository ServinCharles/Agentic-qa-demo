const { $ } = require('@wdio/globals')
const Page = require('./page');
const locators = require('../Locators/secure.locators');

/**
 * sub page containing specific selectors and methods for a specific page
 */
class SecurePage extends Page {
    /**
     * define selectors using getter methods
     */
    get flashAlert () {
        return $(locators.flashAlert);
    }
}

module.exports = new SecurePage();
