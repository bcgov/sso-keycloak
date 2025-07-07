# Migration to RHBK v26.2

## Impacting Changes

### Custom Realms

- **Keycloak authorization client APIs** to check `ready` and perform `init` have been deprecated. The Keycloak authentication client is different, so `init` is still applicable there.
- The `private_key_jwt` and `client_secret_jwt` client authentication methods **do not support multiple audiences**.
- Client authentication with JWT, tokens issued too far in the past are rejected except ones issued within 60 seconds. i.e. iat should be max 60 seconds in the past

### Standard Realm Impact

- Clients requesting only the `offline_access` scope.

| Scenario                                   | Old Behavior             | New Behavior                       |
| ------------------------------------------ | ------------------------ | ---------------------------------- |
| `scope=offline_access` as first request    | Online + Offline session | Only Offline session               |
| Online session used before offline request | Both sessions kept       | Both sessions kept                 |
| SSO session in browser                     | Always created           | Only if user was already logged in |

### Required image changes

- Set `spi-admin-allowed-system-variables` with any custom env vars used. Example: PPID secrets
