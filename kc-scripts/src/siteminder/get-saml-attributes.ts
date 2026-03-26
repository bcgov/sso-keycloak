import { promisify } from 'util';
import _ from 'lodash';
import { parseString } from 'xml2js';
import puppeteer, { Browser } from 'puppeteer';
import { getUserEnvFromLoginUrl } from 'helpers/realm';
import { credentials } from 'config';

const parseStringSync = promisify(parseString);

const parseFormData = (data: string) => {
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

const decodeBase64 = (data: string) => {
  let buff = new Buffer(data, 'base64');
  return buff.toString('ascii');
};

const getCredentials = (env: string, userType: string) => {
  const username = _.get(
    credentials,
    `${_.toUpper(env)}_${_.toUpper(userType)}_USERNAME`,
    _.get(credentials, `${_.toUpper(userType)}_USERNAME`),
  );

  const password = _.get(
    credentials,
    `${_.toUpper(env)}_${_.toUpper(userType)}_PASSWORD`,
    _.get(credentials, `${_.toUpper(userType)}_PASSWORD`),
  );

  return { username: username || '', password: password || '' };
};

export async function getSamlAttributes(url: string, userType: string) {
  let result: string[] = [];
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const env = getUserEnvFromLoginUrl(url);
  const credential = getCredentials(env, userType);

  await page.goto(url);
  await page.on('request', async (request) => {
    if (request.method() !== 'POST') return;
    const data = request.postData();
    const entries = parseFormData(data || '');

    if (!entries.SAMLResponse) return;

    const cleanSamlResponse = entries.SAMLResponse.replace(/(\r\n|\n|\r)/gm, '');
    const decodedXML = decodeBase64(cleanSamlResponse);
    const jsonResult = await parseStringSync(decodedXML);
    const assertion = _.get(jsonResult, 'Response.ns2:Assertion.0', _.get(jsonResult, 'ns5:Response.ns2:Assertion.0'));
    const subject = _.get(assertion, 'ns2:Subject.0.ns2:NameID.0._');
    const getAttribute = (data: any) => ({
      [_.get(data, '$.Name')]: _.get(data, 'ns2:AttributeValue.0.0', _.get(data, 'ns2:AttributeValue.0')),
    });

    const statements = _.get(assertion, 'ns2:AttributeStatement.0.ns2:Attribute');
    const attributes = _.reduce(statements, (ret, data) => ({ ...ret, ...getAttribute(data) }), {});
    const attributeKeys = _.keys(attributes);

    result = attributeKeys;
  });

  await page.waitForSelector('#user');
  await page.type('#user', credential.username);
  await page.type('#password', credential.password);
  await page.click('[name=btnSubmit]');

  if (userType !== 'idir') {
    await page.waitForSelector('input[value=Continue]');
    await page.click('input[value=Continue]');
  }

  await page.waitForSelector('.instruction');
  await page.close();
  await browser.close();

  return result;
}
