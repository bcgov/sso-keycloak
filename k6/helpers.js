import http from 'k6/http';
import { baseUrl } from './env.js';
import { realm } from './constants.js';

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

function getAccessToken(username, password, clientId, realm = 'master') {
  const res = http.post(`${baseUrl}/realms/${realm}/protocol/openid-connect/token`, {
    grant_type: 'password',
    client_id: clientId,
    username,
    password,
  });
  try {
    return JSON.parse(res.body).access_token;
  } catch (e) {
    return null;
  }
}

function createUser(user, realm, accessToken) {
  const headers = getHeaders(accessToken);
  const res = http.post(`${baseUrl}/admin/realms/${realm}/users`, JSON.stringify(user), { headers });
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

module.exports = {
  createRealm,
  deleteRealm,
  createUser,
  deleteUser,
  getAccessToken,
  clearRealmSessions,
  generateRealms,
};
