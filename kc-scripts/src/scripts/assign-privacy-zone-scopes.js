#!/usr/bin/env node
/**
 * assign-privacy-zone-scopes.js
 *
 * Reads a pipe-delimited table file and ensures each client has the correct
 * privacy zone scope assigned as a default client scope in every listed environment.
 *
 * Table format (one row per line, header/comment lines starting with # are skipped):
 *   <client-id> | {env1, env2, ...} | <Privacy Zone Name>
 *
 * Example row:
 *   sdpr-my-ss-6498 | {dev} | Social (Citizen)
 *
 * Required environment variables:
 *   ALPHA_KEYCLOAK_USERNAME      - Keycloak master realm admin username for dev
 *   ALPHA_KEYCLOAK_PASSWORD  - Keycloak master realm admin password for dev
 *   BETA_KEYCLOAK_USERNAME      - Keycloak master realm admin username for test
 *   BETA_KEYCLOAK_PASSWORD  - Keycloak master realm admin password for test
 *   GAMMA_KEYCLOAK_USERNAME      - Keycloak master realm admin username for prod
 *   GAMMA_KEYCLOAK_PASSWORD  - Keycloak master realm admin password for prod
 *
 * Usage:
 *   node assign-privacy-zone-scopes.js <path-to-table-file>
 *
 * Requires Node.js >= 18 (uses native fetch).
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
dotenv.config();

const KEYCLOAK_URLS = {
  dev: 'https://dev.loginproxy.gov.bc.ca/auth',
  test: 'https://test.loginproxy.gov.bc.ca/auth',
  prod: 'https://loginproxy.gov.bc.ca/auth',
};

const PRIVACY_ZONES_URLS = {
  dev: 'https://idtest.gov.bc.ca/oauth2/privacy-zones',
  test: 'https://idtest.gov.bc.ca/oauth2/privacy-zones',
  prod: 'https://id.gov.bc.ca/oauth2/privacy-zones',
};
const REALM = 'standard';

const ADMIN_CREDENTIALS = {
  dev: {
    user: process.env.ALPHA_KEYCLOAK_USERNAME,
    password: process.env.ALPHA_KEYCLOAK_PASSWORD,
  },
  test: {
    user: process.env.BETA_KEYCLOAK_USERNAME,
    password: process.env.BETA_KEYCLOAK_PASSWORD,
  },
  prod: {
    user: process.env.GAMMA_KEYCLOAK_USERNAME,
    password: process.env.GAMMA_KEYCLOAK_PASSWORD,
  },
};

const missingCreds = Object.entries(ADMIN_CREDENTIALS)
  .flatMap(([env, { user, password }]) => [
    !user && `ALPHA_KEYCLOAK_USERNAME`,
    !password && `ALPHA_KEYCLOAK_PASSWORD`,
    !user && `BETA_KEYCLOAK_USERNAME`,
    !password && `BETA_KEYCLOAK_PASSWORD`,
    !user && `GAMMA_KEYCLOAK_USERNAME`,
    !password && `GAMMA_KEYCLOAK_PASSWORD`,
  ])
  .filter(Boolean);

if (missingCreds.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingCreds.join(', ')}`);
  process.exit(1);
}

const tableFile = process.argv[2];
if (!tableFile) {
  console.error('Usage: node assign-privacy-zone-scopes.js <path-to-table-file>');
  process.exit(1);
}

// ─── Keycloak API helpers ─────────────────────────────────────────────────────

// token cache keyed by baseUrl: { accessToken, expiresAt }
const tokenCache = new Map();

async function getAdminToken(baseUrl, user, password) {
  const url = `${baseUrl}/realms/master/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    client_id: 'admin-cli',
    grant_type: 'password',
    username: user,
    password,
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Authentication failed for ${baseUrl}: HTTP ${res.status} — ${text}`);
  }

  const data = await res.json();
  // cache with a 30s safety buffer before the real expiry
  tokenCache.set(baseUrl, {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 30) * 1000,
  });
  return data.access_token;
}

async function getCachedToken(baseUrl, user, password) {
  const cached = tokenCache.get(baseUrl);
  if (cached && Date.now() < cached.expiresAt) return cached.accessToken;
  return getAdminToken(baseUrl, user, password);
}

async function getClientByClientId(baseUrl, token, clientId) {
  const url = `${baseUrl}/admin/realms/${REALM}/clients?clientId=${encodeURIComponent(clientId)}&exact=true`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Failed to look up client "${clientId}": HTTP ${res.status}`);
  const clients = await res.json();
  return clients[0] ?? null;
}

async function getRealmClientScopes(baseUrl, token) {
  const url = `${baseUrl}/admin/realms/${REALM}/client-scopes`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Failed to list realm client scopes: HTTP ${res.status}`);
  return res.json();
}

async function getClientDefaultScopes(baseUrl, token, clientUuid) {
  const url = `${baseUrl}/admin/realms/${REALM}/clients/${clientUuid}/default-client-scopes`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Failed to list default scopes for client ${clientUuid}: HTTP ${res.status}`);
  return res.json();
}

async function assignDefaultScope(baseUrl, token, clientUuid, scopeId) {
  const url = `${baseUrl}/admin/realms/${REALM}/clients/${clientUuid}/default-client-scopes/${scopeId}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to assign scope ${scopeId} to client ${clientUuid}: HTTP ${res.status} — ${text}`);
  }
}

// ─── Privacy zones ────────────────────────────────────────────────────────────

async function fetchPrivacyZoneMap(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch privacy zones from ${url}: HTTP ${res.status} ${res.statusText}`);
  const zones = await res.json();
  // Normalise names to lowercase for case-insensitive matching
  return new Map(zones.map((z) => [z.privacy_zone_name.toLowerCase().trim(), z.privacy_zone_uri]));
}

// ─── Table parsing ────────────────────────────────────────────────────────────

function parseTableFile(filePath) {
  const content = fs.readFileSync(path.resolve(filePath), 'utf8');
  const rows = [];

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    // Format: <clientId>|{env1|env2,...}|<privacyZoneName>  (envs may be | or , separated)
    const match = line.match(/^([^|]+)\|\{([^}]+)\}\|(.+)$/);
    if (!match) {
      console.warn(`[WARN] Skipping malformed line: ${line}`);
      continue;
    }

    const clientId = match[1].trim();
    const environments = match[2]
      .split(/[|,]/)
      .map((e) => e.trim())
      .filter(Boolean);
    const privacyZoneName = match[3].trim();

    if (!clientId || environments.length === 0 || !privacyZoneName) {
      console.warn(`[WARN] Skipping incomplete row: ${line}`);
      continue;
    }

    rows.push({ clientId, environments, privacyZoneName });
  }

  return rows;
}

// ─── Row processor ────────────────────────────────────────────────────────────

async function processRow(row, privacyZoneMaps) {
  const { clientId, environments, privacyZoneName } = row;

  for (const env of environments) {
    const baseUrl = KEYCLOAK_URLS[env];
    if (!baseUrl) {
      console.warn(`  [WARN] Unknown environment "${env}" — skipping`);
      continue;
    }

    const privacyZoneMap = privacyZoneMaps[env];
    const privacyZoneUri = privacyZoneMap.get(privacyZoneName.toLowerCase().trim());
    if (!privacyZoneUri) {
      console.warn(`\n[WARN] Unknown privacy zone "${privacyZoneName}" for client "${clientId}" in ${env} — skipping`);
      continue;
    }

    console.log(`\n[${env.toUpperCase()}] client="${clientId}" scope="${privacyZoneUri}"`);

    try {
      const { user, password } = ADMIN_CREDENTIALS[env];
      const token = await getCachedToken(baseUrl, user, password);

      const client = await getClientByClientId(baseUrl, token, clientId);
      if (!client) {
        console.warn(`  [WARN] Client "${clientId}" not found in ${env} "${REALM}" realm — skipping`);
        continue;
      }

      const realmScopes = await getRealmClientScopes(baseUrl, token);
      const matchingScope = realmScopes.find((s) => s.name === privacyZoneUri);
      if (!matchingScope) {
        console.warn(`  [WARN] Client scope "${privacyZoneUri}" does not exist in the ${env} realm — skipping`);
        continue;
      }

      const defaultScopes = await getClientDefaultScopes(baseUrl, token, client.id);
      const alreadyAssigned = defaultScopes.some((s) => s.id === matchingScope.id);

      if (alreadyAssigned) {
        console.log(`  [SKIP] Scope already assigned as default — nothing to do`);
        continue;
      }

      await assignDefaultScope(baseUrl, token, client.id, matchingScope.id);
      console.log(`  [DONE] Scope assigned successfully`);
    } catch (err) {
      console.error(`  [ERROR] ${err.message}`);
    }
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  const rows = parseTableFile(tableFile);
  if (rows.length === 0) {
    console.log('No processable rows found in the table file.');
    return;
  }

  const uniqueUrls = [...new Set(Object.values(PRIVACY_ZONES_URLS))];
  console.log(`Fetching privacy zones from ${uniqueUrls.join(', ')} ...`);
  const fetchedMaps = new Map(await Promise.all(uniqueUrls.map(async (url) => [url, await fetchPrivacyZoneMap(url)])));
  const privacyZoneMaps = Object.fromEntries(
    Object.entries(PRIVACY_ZONES_URLS).map(([env, url]) => [env, fetchedMaps.get(url)]),
  );
  console.log(`Loaded privacy zones. Processing ${rows.length} row(s) ...`);

  for (const row of rows) {
    await processRow(row, privacyZoneMaps);
  }

  console.log('\nAll rows processed.');
}

main().catch((err) => {
  console.error('\n[FATAL]', err.message);
  process.exit(1);
});
