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

## Test Data

- Given the application and database are up and database migration is successfully complete, run below SQL to add a client for testing purposes.
  ```sql
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
  '{http://localhost:3001}'
  'client_secret_post'); -- 'none' for public client
  ```

## References

- https://github.com/panva/node-oidc-provider
- https://www.npmjs.com/package/oidc-provider/v/7.5.1
