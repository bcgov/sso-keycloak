import http, { head } from 'k6/http';
import { realm, client } from './constants.js';
import encoding from 'k6/encoding';

let config = JSON.parse(open(__ENV.CONFIG));

const baseUrl = config.kcLoadTest.baseUrl;
const clientSecret = config.kcLoadTest.clientSecret;

const getHeaders = (accessToken) => ({
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
});

function createRealm(realm, accessToken) {
  const headers = getHeaders(accessToken);
  return http.post(`${baseUrl}/admin/realms`, JSON.stringify(realm), { headers });
}

function deleteRealm(realm, accessToken) {
  const headers = getHeaders(accessToken);
  return http.del(`${baseUrl}/admin/realms/${realm}`, {}, { headers });
}

function createClient(realm, accessToken) {
  const headers = getHeaders(accessToken);
  const result = http.post(`${baseUrl}/admin/realms/${realm}/clients`, JSON.stringify(client), { headers });

  // Clien internal id is returned in the location header as the trailing piece or the URL.
  const locationURIParts = result.headers.Location.split('/')
  const clientInternalId = locationURIParts[locationURIParts.length - 1]
  return clientInternalId
}

function deleteClient(realm, clientId, accessToken) {
  const headers = getHeaders(accessToken);
  http.del(`${baseUrl}/admin/realms/${realm}/clients/${clientId}`, {}, { headers });
}

function getAccessToken({username, password, clientId, confidential, realm = 'master', offline = false, secret = clientSecret}) {
  const body = {
    grant_type: 'password',
    client_id: clientId,
    username,
    password,
  }
  if (confidential) {
    body['client_secret'] = secret
  }
  if (offline) {
    body['scope'] = 'email profile offline_access openid'
  } else {
    body['scope'] = 'email profile openid'
  }

  const res = http.post(`${baseUrl}/realms/${realm}/protocol/openid-connect/token`, body);
  try {
    return JSON.parse(res.body).access_token;
  } catch (e) {
    return null;
  }
}

function createUser(user, realm, accessToken) {
  const headers = getHeaders(accessToken);
  const res = http.post(`${baseUrl}/admin/realms/${realm}/users`, JSON.stringify(user), { headers });
  if ( res.status > 299 ){
    console.log("Create user failed, often cause by 'newrealm-#' being left in the keycloak deployment.")
  }
  const userId = res.headers.Location.split('/').slice(-1)[0];
  return userId;
}

function deleteUser(userId, realm, accessToken) {
  const headers = getHeaders(accessToken);
  return http.del(`${baseUrl}/admin/realms/${realm}/users/${userId}`, JSON.stringify(user), { headers });
}

function clearRealmSessions(realm, accessToken) {
  const headers = getHeaders(accessToken);
  return http.post(`${baseUrl}/admin/realms/${realm}/logout-all`, {}, { headers });
}

function generateRealms(count) {
  const realms = [];
  for (let i = 0; i < count; i++) {
    const newRealm = {}
    Object.entries(realm).forEach(([key, value]) => {
      newRealm[key] = value;
    });
    newRealm.id = `newrealm-${i}`;
    newRealm.realm = `newrealm-${i}`;
    newRealm.displayName = `New Realm ${i}`;
    realms.push(newRealm);
  }
  return realms;
}

function hitUserInfoRoute(accessToken, realmName) {
  const headers = getHeaders(accessToken)
  const url = `${baseUrl}/realms/${realmName}/protocol/openid-connect/userinfo`
  const result = http.get(url, { headers });

  if ( result.status > 299 ){
    console.log("The get user info request failed")
  }
}

function hitIntrospectionRoute(accessToken, realmName, clientId, clientSecret) {
  const base64Credentials = encoding.b64encode(`${clientId}:${clientSecret}`)
  const url = `${baseUrl}/realms/${realmName}/protocol/openid-connect/token/introspect`;
  const headers = { Authorization: `Basic ${base64Credentials}` }

  const result = http.post(url, {token: accessToken}, { headers });
  if ( result.status > 299 ){
    console.log("The introspection request failed")
  }
}

module.exports = {
  createRealm,
  deleteRealm,
  createUser,
  deleteUser,
  getAccessToken,
  clearRealmSessions,
  generateRealms,
  hitUserInfoRoute,
  hitIntrospectionRoute,
  createClient,
  deleteClient,
};
