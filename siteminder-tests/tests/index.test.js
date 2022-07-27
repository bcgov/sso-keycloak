const puppeteer = require('puppeteer');
const process = require('process');
const { testsite, screenShotsDir } = require('../util');
const { idir_config, bceid_basic_config, bceid_business_config, fetchSsoUrl } = require('../config');
const assert = require('assert');
const { describe, it, beforeEach, afterEach } = require('mocha');
const addContext = require('mochawesome/addContext');

describe('siteminder test suite', function () {
  let browser;
  let page;
  beforeEach(async function () {
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      headless: true,
      args: ['--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox', '--no-sandbox'],
    });
    page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
  });

  afterEach(async function () {
    await page.waitForTimeout(process.env.TIMEOUTSETTING);
    await page.screenshot({ path: `${screenShotsDir}/${this.currentTest.title}.png`, fullPage: true });
    await page.waitForTimeout(process.env.TIMEOUTSETTING);
    await page.close();
    await browser.close();
    addContext(this, `assets/${this.currentTest.title}.png`);
  });

  it('idir', async function () {
    const data = await testsite(fetchSsoUrl('IDIR'), idir_config.username, idir_config.password, 'IDIR', page);
    assert.deepEqual(data.guid, idir_config.user_identifier, 'user_identifier');
    assert.deepEqual(data.display_name, idir_config.display_name, 'display_name');
    assert.deepEqual(data.username, idir_config.username, 'username');
    assert.deepEqual(data.email, idir_config.email, 'email');
    assert.deepEqual(data.firstname, idir_config.firstname, 'firstname');
    assert.deepEqual(data.lastname, idir_config.lastname, 'lastname');
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
