const { promisify } = require('util');
const _ = require('lodash');
const parseString = require('xml2js').parseString;
const fs = require('fs');
const parseStringSync = promisify(parseString);
const Buffer = require('buffer').Buffer;
const screenShotsDir = './results/assets';

if (!fs.existsSync(screenShotsDir)) {
  fs.mkdirSync(screenShotsDir, { recursive: true });
}

//take saml payload and put into a map
const parseFormData = (data) => {
  const vars = data.split('&');
  const map = Object.create(null);
  for (let i = 0; i < vars.length; i++) {
    let pair = vars[i].split('=');
    if (pair.length === 2) {
      pair = pair.map(decodeURIComponent);
      map[pair[0]] = pair[1];
    }
  }

  return map;
};

const decodeBase64 = (data) => {
  let buff = Buffer.from(data, 'base64');
  return buff.toString('ascii');
};

module.exports = {
  screenShotsDir,
  testsite: async function (website, idp_username, idp_password, test_name, page) {
    const siteminder_values = {};
    await page.goto(website, { timeout: 0, waitUntil: 'domcontentloaded' });
    await page.waitForSelector('title');
    await page.waitForSelector('input[name=user]');
    await page.type('#user', idp_username);
    await page.type('#password', idp_password);
    await page.keyboard.press('Enter');

    await page.goto(website);
    await page.waitForSelector('title');

    await page.waitForSelector('input[name=user]');
    await page.type('#user', idp_username);
    await page.type('#password', idp_password);

    await page.keyboard.press('Enter');
    const isIDIR = test_name.indexOf('IDIR') > -1;

    if (!isIDIR) {
      await page.waitForSelector('input[value=Continue]', { visible: true });
      page.click('input[value=Continue]', { clickCount: 2 });
    }

    return new Promise((resolve) => {
      page.on('request', async (request) => {
        if (request.method() !== 'POST') return;
        const data = request.postData();
        const entries = parseFormData(data);

        if (!entries.SAMLResponse) return;

        const cleanSamlResponse = entries.SAMLResponse.replace(/(\r\n|\n|\r)/gm, '');
        const decodedXML = decodeBase64(cleanSamlResponse);
        const jsonResult = await parseStringSync(decodedXML);
        const assertion = _.get(jsonResult, 'Response.ns2:Assertion.0');

        const getAttribute = (data) => ({ [_.get(data, '$.Name')]: _.get(data, 'ns2:AttributeValue.0') });
        const statements = _.get(assertion, 'ns2:AttributeStatement.0.ns2:Attribute');

        const attributes = _.reduce(statements, (ret, data) => ({ ...ret, ...getAttribute(data) }), {});

        siteminder_values.guid = attributes['useridentifier'] ?? attributes['SMGOV_USERGUID'] ?? '';
        siteminder_values.username = attributes['username'];
        siteminder_values.email = attributes['email'];
        siteminder_values.display_name =
          attributes['displayname'] ?? attributes['displayName'] ?? attributes['SMGOV_USERDISPLAYNAME'] ?? '';
        siteminder_values.firstname = attributes['firstname'] ?? '';
        siteminder_values.lastname = attributes['lastname'] ?? '';
        siteminder_values.business_guid = attributes['SMGOV_BUSINESSGUID'] ?? '';
        siteminder_values.business_legalname = attributes['SMGOV_BUSINESSLEGALNAME'] ?? '';

        resolve(siteminder_values);
      });
    });
  },
};
