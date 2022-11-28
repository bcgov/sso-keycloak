# SSO Keycloak

This is a custom RedHat Single Sign-On (RH-SSO) image to include:

1. Pre-defined Keycloak configuration `standalone-openshift.xml`.
1. Custom Keycloak extensions.
1. Custom Keycloak themes.

## Pre-defined configuration

The `configuration` directory contains the pre-defined Keycloak configuration to enable:

1. `periodic-rotating-file-handler` to store audit logs in disk.
1. Logging formatter `OPENSHIFT` to convert logs in JSON format.
1. Replace token cache mechanism `distributed-cache` with `replicated-cache` to ensure the token availability through multiple pods.
1. Enable `manual` upgrading of the database schema instead of auto-upgrading.

## Custom extensions

### Authentications

- There are three distinct custom authentications to enable Identity Provider (IDP) bindings at the client level rather than sharing all IDPs at the realm level.
- The custom authentications are executed in authentication flow (browser) in the following order:

  1. `Cookie Stopper`: checks the client-level user sessions and bypasses the further steps.

     - see [`CookieStopAuthenticator.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/authenticators/CookieStopAuthenticator.java)
     - see [`CookieStopAuthenticatorFactory.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/authenticators/CookieStopAuthenticatorFactory.java)

  1. `Identity Provider Stopper`: checks the assigned client roles and redirects if the client binds to a single IDP.
     - see [`IdentityProviderStopAuthenticator.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/authenticators/IdentityProviderStopAuthenticator.java)
     - see [`IdentityProviderStopAuthenticatorFactory.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/authenticators/IdentityProviderStopAuthenticatorFactory.java)
  1. `Identity Provider Stop Form`: checks the assigned client roles to limit the user's IDP access via UI.
     - It passes the allowed IDPs into the custom theme `bcgov-idp-stopper` to complete the UI.
     - see [`IdentityProviderStopForm.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/authenticators/browser/IdentityProviderStopForm.java)
     - see [`IdentityProviderStopFormFactory.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/authenticators/browser/IdentityProviderStopFormFactory.java)

- First-login authentications

  1. `Delete User If Duplicate`: if the authenticated user is a new user, but the Keycloak realm already has an user with the same username, it deletes the existing user so that the new user can be created without an warning message.
     - see [`IdpDeleteUserIfDuplicateAuthenticator.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/authenticators/broker/IdpDeleteUserIfDuplicateAuthenticator.java)
     - see [`IdpDeleteUserIfDuplicateAuthenticatorFactory.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/authenticators/broker/IdpDeleteUserIfDuplicateAuthenticatorFactory.java)

- Post-login authentications
  1. `Client Login Role Binding`: after the user authenticates with a specific client, it assigns the user to the corresponding realm-level role for the client; it creates the role if not exist.
     - see [`ClientLoginRoleBinding.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/authenticators/ClientLoginRoleBinding.java)
     - see [`ClientLoginRoleBindingFactory.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/authenticators/ClientLoginRoleBindingFactory.java)
  1. `User Attribute Authenticator`: after the user authenticates, it validates the user based on the user's attribute value; the user is deleted if failed with the validation.
     - see [`UserAttributeAuthenticator.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/authenticators/UserAttributeAuthenticator.java)
     - see [`UserAttributeAuthenticatorFactory.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/authenticators/UserAttributeAuthenticatorFactory.java)

### Broker Procotols

- there are two custom `OIDC` identity providers

  1. `Override OIDC Identity Provider`: in order to support the deprecated query param `redirect_uri` in the upstream IDP logout process, it modifies the logout request query params to redirect the user; a new configuration `legacyLogoutRedirectUriSupported` is added in the custom template.

     - config `legacyLogoutRedirectUriSupported`: whether or not the upstream IDP supports legacy logout redirect URI.
     - see [`OverrideOIDCIdentityProvider.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/broker/oidc/OverrideOIDCIdentityProvider.java)
     - see [`OverrideOIDCIdentityProviderFactory.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/broker/oidc/OverrideOIDCIdentityProviderFactory.java)
     - see [`realm-identity-provider-oidc-ext.html`](./extensions-7.6/themes/src/main/resources/theme/base/admin/resources/partials/realm-identity-provider-oidc-ext.html)

  1. `Custom OIDC Identity Provider`: it is designed to add a custom logic into the exisiting token validation, but has not been developed since the proof of concept.
     - see [`CustomOIDCIdentityProvider.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/broker/oidc/CustomOIDCIdentityProvider.java)
     - see [`CustomOIDCIdentityProviderFactory.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/broker/oidc/CustomOIDCIdentityProviderFactory.java)
     - see [`realm-identity-provider-oidc-custom-ext.html`](./extensions-7.6/themes/src/main/resources/theme/base/admin/resources/partials/realm-identity-provider-oidc-custom-ext.html)

- there is one custom `GitHub` identity provider

  1. `Custom GitHub Identity Provider`: it validates the GitHub users' org membership to update user attributes `org_verified` and `orgs`. two configurations `githubOrg` and `githubOrgRequired` are added in the custom template.
     - config `githubOrg`: a comma-separated list of the target GitHub org names.
     - config `githubOrgRequired`: whether or not the org membership is mandatory to authenticate the user.
     - see [`CustomGitHubIdentityProvider.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/social/github/CustomGitHubIdentityProvider.java)
     - see [`CustomGitHubIdentityProviderFactory.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/social/github/CustomGitHubIdentityProviderFactory.java)
     - see [`CustomGitHubUserAttributeMapper.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/social/github/CustomGitHubUserAttributeMapper.java)
     - see [`realm-identity-provider-github-custom-ext.html`](./extensions-7.6/themes/src/main/resources/theme/base/admin/resources/partials/realm-identity-provider-github-custom-ext.html)

### Protocol Mappers

- there are two custom `OIDC` protocol mappers

  1. `Omit Claims By IDPs`: it sets an empty string for the target claims by the maching IDP aliases; it has two configurations.

     - config `Identity Provider Aliases`: a comma-separated list of the target IDP aliases; if not specified, the mapper will be always applied.
     - config `Token Claim Names`: a comma-separated list of the target token claim names
     - see [`ClaimOmitterMapper.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/protocol/oidc/mappers/ClaimOmitterMapper.java)

  1. `IDP Userinfo Mapper`: it inserts the userinfo data, retrieved by the IDP's userinfo endpoint, into the tokens.

- there are two custom `SAML` protocol mappers

  1. `Client Role Mapper`: it includes the client-level roles of the authenticated user into the tokens.

     - config `Role attribute name`: the name of the SAML attribute you want to put your roles into. i.e. 'Role', 'memberOf'.
     - see [`ClientRoleListMapper.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/protocol/saml/mappers/ClientRoleListMapper.java)

  1. `Omit Statement Attributes By IDPs`: it removes the target SAML satement attributes by the maching IDP aliases; it has two configurations.

     - config `Identity Provider Aliases`: a comma-separated list of the target IDP aliases; if not specified, the mapper will be always applied.
     - config `Statement Attribute Names`: a comma-separated list of the target statement attribute names
     - see [`StatementAttributeOmitterMapper.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/protocol/saml/mappers/StatementAttributeOmitterMapper.java)

### Endpoints

- there is a custom endpoint under the `OIDC` identity provider base URL to support the backward compatible logout experience.
- see [`LegacyEndpoint.java`](./extensions-7.6/services/src/main/java/com/github/bcgov/keycloak/protocol/oidc/ext/endpoints/LegacyEndpoint.java)

### Themes

1. `bcgov`: base theme used for other custom themes and provides the following custom features:

- it displays `header` and `footer` according to the configurations `kcShowHeader` and `kcShowFooter`.
- it displays the authenticating client's name instead of realm's display name according to the configuration `kcLoginTitleType`.

1. `bcgov-no-brand`: the same theme as `bcgov` except that it does not display `header` and `footer`.
1. `bcgov-idp-login`: the same theme as `bcgov` except that it does not display `username & password` form.
1. `bcgov-idp-login-no-branch`: the same theme as `bcgov-idp-login` except that it does not display `header` and `footer`.
1. `bcgov-idp-stopper`: the theme specifically designed for the standard realm and provides the following custom features:

- it displays only allowed IDP options for the authenticating user based on the client.
- it displays the IDP tooltip if the value is specified in the IDP configuration.
