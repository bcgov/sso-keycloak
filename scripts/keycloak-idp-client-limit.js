const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient, getRealmUrl, getOidcConfiguration } = require('./keycloak-core');
const { readJSON, createTemplate, generateSecret } = require('./utils');
const { env, count, totp } = argv;

const getRealm = createTemplate(`${__dirname}/base-objects/custom-realm.json`);

async function main() {
  if (!env || !count) {
    console.info(`
    Usages:
      node keycloak-idp-client-limit.js --env <env> --count <count> [--totp <totp>]
    `);

    return;
  }

  try {
    let kcAdminClient = await getAdminClient(env, { totp });
    if (!kcAdminClient) return;

    const prompt = new Confirm(
      `Are you sure to create ${count} IDPs and clients in a test realm of ${env} environment?`,
    );
    const answer = await prompt.run();

    if (!answer) return;

    const testName = 'idp-client-test-realm';
    const data = getRealm({
      id: testName,
      realm: testName,
      displayName: testName,
      displayNameHtml: `<a>${testName}</a>`,
    });

    const idpCount = await kcAdminClient.identityProviders.find({ realm: testName });
    console.log('IDP Count:', idpCount.length);
    const clientCount = await kcAdminClient.clients.find({ realm: testName });
    console.log('Client Count:', clientCount.length);

    const existing = await kcAdminClient.realms.findOne({ realm: testName });
    if (!existing) await kcAdminClient.realms.create(data);
    const idpurl = 'https://dev.oidc.gov.bc.ca/auth/realms/onestopauth/protocol/openid-connect';

    const createIDP = (index) => {
      const tag = new Date().getTime() + index;
      return kcAdminClient.identityProviders.create({
        realm: testName,
        alias: `test-idp-${tag}`,
        displayName: `test-idp-${tag}`,
        providerId: 'keycloak-oidc',
        enabled: true,
        trustEmail: false,
        storeToken: false,
        addReadTokenRoleOnCreate: false,
        authenticateByDefault: false,
        linkOnly: false,
        firstBrokerLoginFlowAlias: 'first broker login',
        config: {
          authorizationUrl: `${idpurl}/auth`,
          tokenUrl: `${idpurl}/token`,
          logoutUrl: `${idpurl}/logout`,
          userInfoUrl: `${idpurl}/userinfo`,
          syncMode: 'IMPORT',
          clientAuthMethod: 'client_secret_basic',
          clientId: `test-idp-${tag}`,
          clientSecret: '',
          backchannelSupported: 'false',
          useJwksUrl: 'true',
          loginHint: 'false',
        },
      });
    };

    const createClient = (index) => {
      const tag = new Date().getTime() + index;
      return kcAdminClient.clients.create({
        realm: testName,
        clientId: `test-client-${tag}`,
        surrogateAuthRequired: false,
        enabled: true,
        secret: `test-client-${tag}`,
        alwaysDisplayInConsole: false,
        clientAuthenticatorType: 'client-secret',
        bearerOnly: false,
        consentRequired: false,
        standardFlowEnabled: true,
        implicitFlowEnabled: false,
        directAccessGrantsEnabled: true,
        serviceAccountsEnabled: false,
        publicClient: false,
        protocol: 'openid-connect',
      });
    };

    for (let x = 0; x < count; x++) {
      console.log(x);
      kcAdminClient = await getAdminClient(env, { totp });
      await Promise.all([createIDP(x), createClient(x)]);
    }
  } catch (err) {
    console.error(err);
  }
}

main();
