# One Time Password (OTP) Provider

The One-Time Password (OTP) identity provider offers a low-assurance, passwordless authentication method. It verifies end-users by sending a temporary code to their email address and validating it against the code entered by the user.

## Architecture Overview

Client Application -> Authenticates via Keycloak
Keycloak (Broker) -> Delegates authentication to Email OTP Identity Provider
OTP Provider -> Authenticates user via email-based OTP and returns identity assertion

## Authentication Flow

- User accesses the client application, which redirects to Keycloak for authentication.
- Keycloak presents the Email OTP provider as a login option (configured as an external identity provider).
- User selects the OTP provider, and Keycloak redirects the user to the provider’s login page.
- User enters their email address, and the provider sends an OTP to that address.
- User enters the OTP, and the provider validates it.
- Upon success, the provider redirects back to Keycloak with an identity token (OIDC or SAML).
- Keycloak maps the external identity to a local user (via mappers or first-login flow).
- Keycloak issues its own tokens (access, ID, refresh) to the client application.

## Installation

- Create `.env` from `.env.example` and update all the values
- Run `yarn` to install all the dependencies
- Run `yarn dev` to start a local server
- Run `yarn build` to create a javascript bundle for production deployment
- Run `yarn start` to run the javascript bundle
- Run `yarn tailwind` to compile the css (will hot reload)

## Local Env

The app runs locally using tsup to compile the server and client files into the `build` directory. To recompile the css on the fly, run `yarn tailwind` in another terminal.

## Test Data

- Given the application and database are up and database migration is successfully complete, run below SQL to add a client for testing purposes.

  ```sql
  --confidential client
  INSERT
  	INTO
  	"ClientConfig" ("clientId",
  	"clientSecret",
  	"grantTypes",
  	"redirectUris",
  	"scope",
  	"responseTypes",
  	"clientUri",
    "allowedCorsOrigins",
  	"postLogoutRedirectUris",
    "tokenEndpointAuthMethod")
  VALUES('conf-client',
  's3cr3t',
  '{authorization_code, refresh_token}',
  '{http://localhost:3001}',
  'openid email',
  '{code}',
  'http://localhost:3001',
  '{http://localhost:3001}',
  '{http://localhost:3001}',
  'client_secret_post');

  --public client
  INSERT INTO public."ClientConfig"
  ("clientId",
  "grantTypes",
  "redirectUris",
  "scope",
  "responseTypes",
  "clientUri",
  "allowedCorsOrigins",
  "postLogoutRedirectUris",
  "tokenEndpointAuthMethod")
  VALUES('pub-client',
    '{authorization_code, refresh_token}',
    '{http://localhost:3001}',
    'openid email',
    '{code}',
    'http://localhost:3001',
    '{http://localhost:3001}',
    '{http://localhost:3001}',
    'none');
  ```

## End to End Tests

End to end testing is done with playwright. As prerequisite the end-to-end tests need a seeded db. Run the folowing from this directory:
- `psql -c 'create database otp_test'`;
- `yarn build && DB_NAME=otp_test node build/migrate.js`
- `psql -d otp_test -f e2e/seed.sql`

This is only needed the first time to initialize the db. To run the tests run `yarn test:e2e`

For debugging, you can run `yarn playwright test --debug`. This is useful alongside adding `test.only` on the test to debug.
For auto-generating tests, you can run `yarn playwright codegen` to click through the app and generate a test.

The test-version of the server has a few settings, using the env vars `NODE_ENV=test OTP_RESEND_INTERVAL_MINUTES=[2,3,3,4]`. When NODE_ENV is set to test, code resend intervals will be in seconds instead of minutes, useful for testing lockout functionality. You can adjust the `OTP_RESEND_INTERVAL_MINUTES` array to desired intervals in seconds then. It will also skip the CHES email callouts while in test mode.

## References

- https://github.com/panva/node-oidc-provider
- https://www.npmjs.com/package/oidc-provider/v/7.5.1
