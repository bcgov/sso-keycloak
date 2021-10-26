const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient, getRealmUrl, getOidcConfiguration } = require('./keycloak-core');
const { readJSON, createTemplate, generateSecret } = require('./utils');
const { env, realm, idp, totp } = argv;

const getConfidentialClient = createTemplate(`${__dirname}/base-objects/confidential-client.json`);
const getKeycloakOidcIDP = createTemplate(`${__dirname}/base-objects/keycloak-oidc-idp.json`);
const idps = readJSON(`${__dirname}/meta/idp-realms.json`);

for (let x = 0; x < idps.length; x++) {
  const _idp = idps[x];
  _idp.clientMappers = readJSON(`${__dirname}/client-mappers/${_idp.alias}.json`);
  _idp.idpMappers = readJSON(`${__dirname}/idp-mappers/${_idp.alias}.json`);
}

async function main() {
  if (!env || !realm) {
    console.info(`
    Usages:
      node keycloak-link-idp.js --env <env> --realm <realm> --idp <idp> [--totp <totp>]
    `);

    return;
  }

  try {
    const idpInfo = idps.find((v) => v.alias === idp);
    if (!idpInfo) {
      console.log(`invalid idp alias ${idp}`);
      return;
    }

    const idpAlias = idpInfo.alias;
    const idpName = idpInfo.displayName;
    const idpRealm = idpInfo.realm;
    const clientMappers = idpInfo.clientMappers;
    const idpMappers = idpInfo.idpMappers;

    const kcAdminClient = await getAdminClient(env, { totp });
    if (!kcAdminClient) return;

    const prompt = new Confirm(`Are you sure to link an idp ${idpName} to realm ${realm} in ${env} environment?`);
    const answer = await prompt.run();

    if (!answer) return;

    // 1. Check if the idp name already exists
    const idpConfig = await kcAdminClient.identityProviders.findOne({ alias: idpAlias, realm });

    if (idpConfig) {
      console.log(`idp ${idpName} already exists`);
      return;
    }

    const realmUrl = getRealmUrl(env, realm);
    const redirectUri = `${realmUrl}/broker/${idpAlias}/endpoint*`;

    // 2. Create a confidential client in the idp realm to use for the target realm's IDP connection
    const clientSecret = await generateSecret();

    await kcAdminClient.clients.create(
      getConfidentialClient({
        realm: idpRealm,
        clientId: realmUrl,
        secret: clientSecret,
        redirectUris: [redirectUri],
        protocolMappers: clientMappers,
      }),
    );

    // 3. Create the idp
    const { issuer, authorization_endpoint, token_endpoint, jwks_uri, userinfo_endpoint, end_session_endpoint } =
      await getOidcConfiguration(env, idpRealm);

    await kcAdminClient.identityProviders.create(
      getKeycloakOidcIDP({
        realm,
        alias: idpAlias,
        displayName: idpName,
        config: {
          issuer,
          authorizationUrl: authorization_endpoint,
          tokenUrl: token_endpoint,
          logoutUrl: end_session_endpoint,
          userInfoUrl: userinfo_endpoint,
          jwksUrl: jwks_uri,
          clientId: realmUrl,
          clientSecret,
        },
      }),
    );

    // 4. Create IDP mappers
    await Promise.all(
      idpMappers.map((identityProviderMapper) =>
        kcAdminClient.identityProviders.createMapper({ alias: idpAlias, realm, identityProviderMapper }),
      ),
    );
  } catch (err) {
    console.error(err.response.data && err.response.data.error);
  }
}

main();
