const puppeteer = require('puppeteer');
const process = require('process');
const { testsite, screenShotsDir } = require('../util');
const { bceid_basic_config, bceid_business_config, fetchSsoUrl } = require('../config');
const assert = require('assert');
const { describe, it, beforeEach, afterEach } = require('mocha');
const timeout = process.env.TIMEOUTSETTING ?? 3000;
const addContext = require('mochawesome/addContext');

describe('siteminder test suite', function () {
  let browser;
  let page;

  beforeEach(async function () {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox', '--no-sandbox'],
    });
    page = await browser.newPage();
  });

  afterEach(async function () {
    await page.waitForTimeout(timeout);
    await page.screenshot({ path: `${screenShotsDir}/${this.currentTest.title}.png` });
    await page.waitForTimeout(timeout);
    await page.close();
    await browser.close();
    addContext(this, `assets/${this.currentTest.title}.png`);
  });

  it('bceid-basic', async function () {
    const data = await testsite(
      fetchSsoUrl('BCEID_BASIC'),
      bceid_basic_config.username,
      bceid_basic_config.password,
      'BCEID_BASIC',
      page,
    );
    assert.deepEqual(data.guid, bceid_basic_config.user_identifier, 'user_identifier');
    assert.deepEqual(data.display_name, bceid_basic_config.display_name, 'display_name');
    assert.deepEqual(data.username, bceid_basic_config.username, 'username');
    assert.deepEqual(data.email, bceid_basic_config.email, 'email');
  });

  it('bceid-business', async function () {
    const data = await testsite(
      fetchSsoUrl('BCEID_BUSINESS'),
      bceid_business_config.username,
      bceid_business_config.password,
      'BCEID_BUSINESS',
      page,
    );
    assert.deepEqual(data.guid, bceid_business_config.user_identifier, 'user_identifier');
    assert.deepEqual(data.display_name, bceid_business_config.display_name, 'display_name');
    assert.deepEqual(data.username, bceid_business_config.username, 'username');
    assert.deepEqual(data.email, bceid_business_config.email, 'email');
    assert.deepEqual(data.business_guid, bceid_business_config.guid, 'business guid');
    assert.deepEqual(data.business_legalname, bceid_business_config.legalname, 'business legalname');
  });

  it('bceid-basic-business', async function () {
    const data = await testsite(
      fetchSsoUrl('BCEID_BOTH'),
      bceid_business_config.username,
      bceid_business_config.password,
      'BCEID_BASIC_BUSINESS',
      page,
    );
    assert.deepEqual(data.guid, bceid_business_config.user_identifier, 'user_identifier');
    assert.deepEqual(data.display_name, bceid_business_config.display_name, 'display_name');
    assert.deepEqual(data.username, bceid_business_config.username, 'username');
    assert.deepEqual(data.email, bceid_business_config.email, 'email');
    assert.equal(data.business_guid, bceid_business_config.guid, 'business guid');
    assert.deepEqual(data.business_legalname, bceid_business_config.legalname, 'business legalname');
  });
});
