# Migration to RHBK v24

## Impacting Changes

- Keycloak login page password input field has a toggle to show entered value
- By default `user profile` feature is enabled and the `unmanaged attributes` feature is disabled
- Attribute names like `some:attribute` or `some/attribute` are not allowed
- The `verify-profile` is enabled by default for new realms
- Offline sessions are loaded on demand instead of at the startup
- User attributes
  - Two new features: Unmanaged attributes, User Profile
  - User attributes are not available by default but can be provisioned in two ways
    - Managed
    - Unmanaged
  - If `Unmanaged Attributes` feature is enabled then it provides `Attributes` tab for each user entry but if keeping it disabled then to add any attributes, they need to be configured under `User Profile` tab.
  - `Unmanaged Attributes` have a max length of 2048 but can be extended if using attributes configured through `User Profile` tab
  - The restriction of 2048 is effective only from the UI.
  - Having `Unmanaged Attributes` feature disabled would just hide attributes in the UI but are still saved to database and can be mapped into token being returned to the client.
    - Testing: An attribute with length 10000 caused login failure where the user was stranded at the verify profile page and no error was displayed. As a work around we can create an attribute under `User Profile` and set length `min` and `max` and same thing can be done via [terraform](https://registry.terraform.io/providers/mrparkers/keycloak/latest/docs/resources/realm_user_profile)
- Password hashing: `pbkdf2-sha512`
- Signing algorithm: `HS512`
- `iss` param in authentication response by default but can be disabled
  - Example: `https://bcgov.github.io/keycloak-example-apps/#iss=https%3A%2F%2Fsso-keycloak-c6af30-test.apps.gold.devops.gov.bc.ca%2Fauth%2Frealms%2Fstandard`
- Searching only accepts `*` instead of `%` and `_`
- The client mappers tab was moved to `client dedicated scopes` (navigate to clients -> <client-name> -> client scopes -> <client-name>-dedicated)
- When service account is created, it automatically adds some claims like `clientId`, `clientHost`, and `clientAddress`. The new version uses `client_id` claim.
- Userinfo endpoint requires openid scope going forward. Also, errors are re-written related to this endpoint.
- The keycloak would reject if client has set `*` as a redirect URI and uses non-http schemes, however this has no impact on http schemes.
