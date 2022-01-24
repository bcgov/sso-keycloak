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
- The custom authentications are executed in authentication flow (browser) in their order:
  1. `Cookie Stopper`: checks the client-level user sessions and bypasses the further steps.
  1. `Identity Provider Stopper`: checks the assigned client roles and redirects if the client binds to a single IDP.
  1. `Identity Provider Stop Form`: checks the assigned client roles to limit the user's IDP access via UI.
     - It passes the allowed IDPs into the custom theme `bcgov-idp-stopper` to complete the UI.
