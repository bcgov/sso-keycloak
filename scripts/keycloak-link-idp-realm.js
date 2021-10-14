const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient, getRealmUrl, getOidcConfiguration, generateSecret } = require('./keycloak-core');
const { env, realm, idp, totp } = argv;

const meta = [
  { alias: 'idir', displayName: 'IDIR', realm: 'idir' },
  { alias: 'bceid', displayName: 'BCeID', realm: '_bceid' },
  { alias: 'bceid-basic', displayName: 'Basic BCeID', realm: '_bceidbasic' },
  { alias: 'bceid-business', displayName: 'Business BCeID', realm: '_bceidbusiness' },
  { alias: 'bceid-basic-and-business', displayName: 'BCeID', realm: '_bceidbasicbusiness' },
  { alias: 'github', displayName: 'GitHub', realm: '_github' },
];

const protocolMappers = {
  idir: [
    {
      name: 'username',
      protocol: 'openid-connect',
      protocolMapper: 'oidc-usermodel-property-mapper',
      consentRequired: true,
      consentText: '${username}',
      config: {
        'userinfo.token.claim': 'true',
        'user.attribute': 'username',
        'id.token.claim': 'true',
        'access.token.claim': 'true',
        'claim.name': 'preferred_username',
        'jsonType.label': 'String',
      },
    },
    {
      name: 'firstName',
      protocol: 'openid-connect',
      protocolMapper: 'oidc-usermodel-property-mapper',
      consentRequired: false,
      config: {
        'userinfo.token.claim': 'true',
        'user.attribute': 'firstName',
        'id.token.claim': 'true',
        'access.token.claim': 'true',
        'claim.name': 'firstName',
        'jsonType.label': 'String',
      },
    },
    {
      name: 'lastName',
      protocol: 'openid-connect',
      protocolMapper: 'oidc-usermodel-property-mapper',
      consentRequired: false,
      config: {
        'userinfo.token.claim': 'true',
        'user.attribute': 'lastName',
        'id.token.claim': 'true',
        'access.token.claim': 'true',
        'claim.name': 'lastName',
        'jsonType.label': 'String',
      },
    },
    {
      name: 'displayName',
      protocol: 'openid-connect',
      protocolMapper: 'oidc-usermodel-attribute-mapper',
      consentRequired: false,
      config: {
        'userinfo.token.claim': 'true',
        'user.attribute': 'displayName',
        'id.token.claim': 'true',
        'access.token.claim': 'true',
        'claim.name': 'displayName',
        'jsonType.label': 'String',
      },
    },
    {
      name: 'idir_userid',
      protocol: 'openid-connect',
      protocolMapper: 'oidc-usermodel-attribute-mapper',
      consentRequired: false,
      config: {
        'userinfo.token.claim': 'true',
        'user.attribute': 'idir_userid',
        'id.token.claim': 'true',
        'access.token.claim': 'true',
        'claim.name': 'idir_userid',
        'jsonType.label': 'String',
      },
    },
    {
      name: 'email',
      protocol: 'openid-connect',
      protocolMapper: 'oidc-usermodel-property-mapper',
      consentRequired: true,
      consentText: '${email}',
      config: {
        'userinfo.token.claim': 'true',
        'user.attribute': 'email',
        'id.token.claim': 'true',
        'access.token.claim': 'true',
        'claim.name': 'email',
        'jsonType.label': 'String',
      },
    },
  ],
};

async function main() {
  if (!env || !realm) {
    console.info(`
    Usages:
      node keycloak-link-idp-realm.js --env <env> --realm <realm> --idp <idp> [--totp <totp>]
    `);

    return;
  }

  try {
    const idpInfo = meta.find((v) => v.alias === idp);
    if (!idpInfo) {
      console.log(`invalid idp alias ${idp}`);
      return;
    }

    const idpAlias = idpInfo.alias;
    const idpName = idpInfo.displayName;
    const idpRealm = idpInfo.realm;

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
    const redirectUri = `${realmUrl}/broker/${idpRealm}/endpoint*`;

    // 2. Create a confidential client in the idp realm to use for the target realm's IDP connection
    const clientSecret = await generateSecret();

    await kcAdminClient.clients.create({
      realm: idp,
      clientId: realmUrl,
      secret: clientSecret,
      surrogateAuthRequired: false,
      enabled: true,
      alwaysDisplayInConsole: false,
      clientAuthenticatorType: 'client-secret',
      redirectUris: [redirectUri],
      webOrigins: [],
      notBefore: 0,
      bearerOnly: false,
      consentRequired: false,
      standardFlowEnabled: true,
      implicitFlowEnabled: false,
      directAccessGrantsEnabled: true,
      serviceAccountsEnabled: false,
      publicClient: false,
      frontchannelLogout: false,
      protocol: 'openid-connect',
      attributes: {
        'saml.assertion.signature': 'false',
        'saml.multivalued.roles': 'false',
        'saml.force.post.binding': 'false',
        'saml.encrypt': 'false',
        'oauth2.device.authorization.grant.enabled': 'false',
        'backchannel.logout.revoke.offline.tokens': 'false',
        'saml.server.signature': 'false',
        'saml.server.signature.keyinfo.ext': 'false',
        'use.refresh.tokens': 'true',
        'exclude.session.state.from.auth.response': 'false',
        'oidc.ciba.grant.enabled': 'false',
        'saml.artifact.binding': 'false',
        'backchannel.logout.session.required': 'true',
        'client_credentials.use_refresh_token': 'false',
        saml_force_name_id_format: 'false',
        'saml.client.signature': 'false',
        'tls.client.certificate.bound.access.tokens': 'false',
        'saml.authnstatement': 'false',
        'display.on.consent.screen': 'false',
        'saml.onetimeuse.condition': 'false',
      },
      protocolMappers: protocolMappers[idpAlias],
      authenticationFlowBindingOverrides: {},
      fullScopeAllowed: true,
      nodeReRegistrationTimeout: -1,
      defaultClientScopes: ['web-origins', 'profile', 'roles', 'email'],
      optionalClientScopes: ['address', 'phone', 'offline_access', 'microprofile-jwt'],
      access: { view: true, configure: true, manage: true },
    });

    // 3. Create the idp
    const { issuer, authorization_endpoint, token_endpoint, jwks_uri, userinfo_endpoint, end_session_endpoint } =
      await getOidcConfiguration(env, idpRealm);

    await kcAdminClient.identityProviders.create({
      realm,
      alias: idp,
      displayName: idpName,
      providerId: 'keycloak-oidc',
      enabled: true,
      trustEmail: false,
      storeToken: false,
      addReadTokenRoleOnCreate: false,
      authenticateByDefault: false,
      linkOnly: false,
      firstBrokerLoginFlowAlias: 'first broker login',
      config: {
        issuer,
        authorizationUrl: authorization_endpoint,
        tokenUrl: token_endpoint,
        logoutUrl: end_session_endpoint,
        userInfoUrl: userinfo_endpoint,
        jwksUrl: jwks_uri,
        syncMode: 'IMPORT',
        clientAuthMethod: 'client_secret_basic',
        clientId: realmUrl,
        clientSecret: 'a7115ad7-b135-49f7-9cff-307d2d5e2223',
        backchannelSupported: 'true',
        useJwksUrl: 'true',
        loginHint: 'false',
        validateSignature: 'true',
      },
    });

    // 4. Create IDP mappers
    // await kcAdminClient.identityProviders.createMapper({ alias: idpAlias, realm, identityProviderMapper:{  config?: any;
    //   id?: string;
    //   identityProviderAlias?: string;
    //   identityProviderMapper?: string;
    //   name?: string;} });
  } catch (err) {
    console.log(err);
  }
}

main();
