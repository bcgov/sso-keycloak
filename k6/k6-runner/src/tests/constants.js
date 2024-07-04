const realm = {
  id: 'newrealm',
  realm: 'newrealm',
  displayName: 'New Realm',
  enabled: true,
  sslRequired: 'external',
  registrationAllowed: false,
  loginWithEmailAllowed: true,
  duplicateEmailsAllowed: false,
  resetPasswordAllowed: false,
  editUsernameAllowed: false,
  bruteForceProtected: true,
};

const user = {
  firstName: 'wololo',
  username: 'wololobrin',
  lastName: 'brin',
  email: 'wololo@brin.com',
  enabled: true,
  credentials: [{ type: 'password', value: 'password', temporary: false }],
};

const client = {
  secret: 'secret',
  serviceAccountsEnabled: true,
  clientId: 'test_privateClient',
  directAccessGrantsEnabled: true,
}

module.exports = {
  user,
  realm,
  client,
}
