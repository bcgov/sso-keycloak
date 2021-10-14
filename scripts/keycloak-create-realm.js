const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { getAdminClient } = require('./keycloak-core');
let { env, realm, displayName, totp } = argv;
if (displayName) displayName = realm;

const defaultRealm = {
  id: 'newrealm',
  realm: 'newrealm',
  notBefore: 0,
  revokeRefreshToken: false,
  refreshTokenMaxReuse: 0,
  accessTokenLifespan: 300,
  accessTokenLifespanForImplicitFlow: 900,
  ssoSessionIdleTimeout: 1800,
  ssoSessionMaxLifespan: 36000,
  ssoSessionIdleTimeoutRememberMe: 0,
  ssoSessionMaxLifespanRememberMe: 0,
  offlineSessionIdleTimeout: 2592000,
  offlineSessionMaxLifespanEnabled: false,
  offlineSessionMaxLifespan: 5184000,
  accessCodeLifespan: 60,
  accessCodeLifespanUserAction: 300,
  accessCodeLifespanLogin: 1800,
  actionTokenGeneratedByAdminLifespan: 43200,
  actionTokenGeneratedByUserLifespan: 300,
  enabled: true,
  sslRequired: 'external',
  registrationAllowed: false,
  registrationEmailAsUsername: false,
  rememberMe: false,
  verifyEmail: false,
  loginWithEmailAllowed: true,
  duplicateEmailsAllowed: false,
  resetPasswordAllowed: false,
  editUsernameAllowed: false,
  bruteForceProtected: false,
  permanentLockout: false,
  maxFailureWaitSeconds: 900,
  minimumQuickLoginWaitSeconds: 60,
  waitIncrementSeconds: 60,
  quickLoginCheckMilliSeconds: 1000,
  maxDeltaTimeSeconds: 43200,
  failureFactor: 30,
  defaultRoles: ['offline_access', 'uma_authorization'],
  requiredCredentials: ['password'],
  otpPolicyType: 'totp',
  otpPolicyAlgorithm: 'HmacSHA1',
  otpPolicyInitialCounter: 0,
  otpPolicyDigits: 6,
  otpPolicyLookAheadWindow: 1,
  otpPolicyPeriod: 30,
  otpSupportedApplications: ['FreeOTP', 'Google Authenticator'],
  webAuthnPolicyRpEntityName: 'keycloak',
  webAuthnPolicySignatureAlgorithms: ['ES256'],
  webAuthnPolicyRpId: '',
  webAuthnPolicyAttestationConveyancePreference: 'not specified',
  webAuthnPolicyAuthenticatorAttachment: 'not specified',
  webAuthnPolicyRequireResidentKey: 'not specified',
  webAuthnPolicyUserVerificationRequirement: 'not specified',
  webAuthnPolicyCreateTimeout: 0,
  webAuthnPolicyAvoidSameAuthenticatorRegister: false,
  webAuthnPolicyAcceptableAaguids: [],
  webAuthnPolicyPasswordlessRpEntityName: 'keycloak',
  webAuthnPolicyPasswordlessSignatureAlgorithms: ['ES256'],
  webAuthnPolicyPasswordlessRpId: '',
  webAuthnPolicyPasswordlessAttestationConveyancePreference: 'not specified',
  webAuthnPolicyPasswordlessAuthenticatorAttachment: 'not specified',
  webAuthnPolicyPasswordlessRequireResidentKey: 'not specified',
  webAuthnPolicyPasswordlessUserVerificationRequirement: 'not specified',
  webAuthnPolicyPasswordlessCreateTimeout: 0,
  webAuthnPolicyPasswordlessAvoidSameAuthenticatorRegister: false,
  webAuthnPolicyPasswordlessAcceptableAaguids: [],
  browserSecurityHeaders: {
    contentSecurityPolicyReportOnly: '',
    xContentTypeOptions: 'nosniff',
    xRobotsTag: 'none',
    xFrameOptions: 'SAMEORIGIN',
    contentSecurityPolicy: "frame-src 'self'; frame-ancestors 'self'; object-src 'none';",
    xXSSProtection: '1; mode=block',
    strictTransportSecurity: 'max-age=31536000; includeSubDomains',
  },
  smtpServer: {},
  eventsEnabled: false,
  eventsListeners: ['jboss-logging'],
  enabledEventTypes: [],
  adminEventsEnabled: false,
  adminEventsDetailsEnabled: false,
  internationalizationEnabled: false,
  supportedLocales: [],
  browserFlow: 'browser',
  registrationFlow: 'registration',
  directGrantFlow: 'direct grant',
  resetCredentialsFlow: 'reset credentials',
  clientAuthenticationFlow: 'clients',
  dockerAuthenticationFlow: 'docker auth',
  attributes: {},
  userManagedAccessAllowed: false,
};

const getNewRealm = (realmData) => ({ ...defaultRealm, ...realmData });

async function main() {
  if (!env || !realm) {
    console.info(`
    Usages:
      node keycloak-create-realm.js --env <env> --realm <realm> [--totp <totp>]
    `);

    return;
  }

  try {
    const kcAdminClient = await getAdminClient(env, { totp });
    if (!kcAdminClient) return;

    const prompt = new Confirm(`Are you sure to create a realm ${realm} in ${env} environment?`);
    const answer = await prompt.run();

    if (!answer) return;

    // 1. Check if the realm name already exists
    const targetRealm = await kcAdminClient.realms.findOne({ realm });

    if (targetRealm) {
      console.log(`realm ${realm} already exists`);
      return;
    }

    // 2. Create the realm
    const data = getNewRealm({
      id: realm,
      realm,
      displayName,
      displayNameHtml: `<a>${displayName}</a>`,
      groups: [
        {
          name: 'Realm Administrator',
          path: '/Realm Administrator',
          clientRoles: {
            'realm-management': [
              'realm-admin',
              'manage-identity-providers',
              'query-realms',
              'query-groups',
              'manage-authorization',
              'query-clients',
              'manage-realm',
              'manage-clients',
              'query-users',
              'create-client',
              'manage-events',
              'manage-users',
            ].concat(env !== 'prod' ? ['impersonation'] : []),
          },
        },
      ],
    });

    await kcAdminClient.realms.create(data);
  } catch (err) {
    console.log(err);
  }
}

main();
