<br>
We are in a transition, please visit us here https://bcgov.github.io/sso-docs/category/integrating-your-application

The section below will be deleted before December 31 2023

## Table of Contents
- [Introduction to key concepts and terms (newbie guide)](#Introduction-to-key-concepts-and-terms)
- [Openshift Clusters](#openshift-clusters)
  - [RedHat SSO Version](#redhat-sso-version)
- [Environments and Accounts](#Environments-and-accounts)
  - [IDIR & GitHub Accounts](https://github.com/bcgov/sso-keycloak/wiki/Using-Your-SSO-Client#idir--github-accounts)
  - [BCeID Accounts](#bceid-accounts)
- [Technical Details](#technical-details)
  - [OIDC Setup and Keycloak's Authentication Flow](#oidc-setup-and-keycloaks-authentication-flow)
  - [Confidential vs Private Client](#confidential-vs-private-client)
  - [Using PKCE](#using-pkce)
  - [Select a Usecase](#usecases)
- [Setting Up your Redirect URIs](#setting-up-your-redirect-uris)
  - [Specifying redirect uris are important](#specifying-redirect-uris-are-important)
  - [Valid Redirect URIs](#valid-redirect-uris)
  - [Public Clients and Web Origins](#public-clients-and-web-origins)
- [Setting Up your Keycloak Client](#setting-up-your-keycloak-client)
  - [Installation JSON](#installation-json)
  - [Connecting to Keycloak using an adapter](#connecting-to-keycloak-using-an-adapter)
  - [Connecting without an adapter](#connecting-without-an-adapter)
  - [Specifying an IDP to bypass the Keycloak login page](#specifying-an-idp-to-bypass-the-keycloak-login-page)
  - [A few notes on security](#a-few-notes-on-security)
  - [A note on redirect URIs](#a-note-on-redirect-uris)
  - [Advanced/Additional Settings](#advanced-settings)
- [CSS Account API](#css-api)
- [Dos and Don'ts](#dos-and-donts)
  - [Do Not Call the KeyCloak API on Every Request](#do-not-call-the-keycloak-api-on-every-request)
  - [Do Not Load Test in Production](#do-not-load-test-in-production)
  - [Do Protect the Client Secret (Confidential Client Only)](#do-protect-the-client-secret-confidential-client-only)
  - [Do Carefully Manage Your List of Valid Redirect URIs](#do-carefully-manage-your-list-of-valid-redirect-uris)
  - [Do Skip the KeyCloak Login Page](#do-skip-the-keycloak-login-page)
  - [Do Validate the IDP in the JWT](#do-validate-the-idp-in-the-jwt)

---
### Introduction to key concepts and terms

Visit our [discussions page](https://github.com/bcgov/sso-keycloak/discussions/136) to understand key concepts and terms as you make use of our Self Service application to integrate your digital application with a with BC government approved login option.

### Openshift Clusters
In mid 2022, we moved our keycloak instance from the Platform Services **Silver Openshift cluster** to their **Gold Openshift cluster**. As of June 15, 2023, all of our services will live in Gold.

As part of the [Private Cloud Platform Openshift community](https://cloud.gov.bc.ca/private-cloud/) our service sits in the Gold Cluster which enables us to ensure our service is up 24/7. [Check out our up-to-date system health](https://uptime.com/s/bcgov-sso-gold)

#### Redhat SSO Version

Gold Current Version:  7.6.1.GA

decommissioned - Silver Current Version: 7.4.9.GA


For Red Hat SSO & Keycloak version information, please see this link: https://access.redhat.com/articles/2342881


### Environments and Accounts

You will have a Pathfinder SSO client in each of the DEV, TEST and PROD servers. Assuming you have a DEV, TEST, and PROD environments for your application, this should give you the decoupling you need to set up each environment up with its own login context.

##### IDIR & GitHub Accounts

For IDIR and GitHub, your users will use "real" credentials in all three environments.

##### BCeID Accounts


**With our GOLD Service** - please ensure you have BCeID accounts mapped to the correct BCeID environment listed below. For questions on test accounts, please reach out to our IDIM partners at idim.consulting@gov.bc.ca or visit [BC Gov Stack Overflow](https://stackoverflow.developer.gov.bc.ca/questions/704)

| SSO CSS APP GOLD        | BCeID Env           | Visual Clue          |
| ------------- |:-------------:| :-----: |
| DEV     | BCeID DEV| ![image](https://user-images.githubusercontent.com/56739669/182436774-ec4f6853-9bb7-4ad7-bc2d-3422e3b8e1f3.png) |
| TEST      | BCeID TEST       |   ![image](https://user-images.githubusercontent.com/56739669/182436317-68624f41-3889-4127-9440-20d7ec09da48.png) |
| PROD | BCeID PROD      |    ![image](https://user-images.githubusercontent.com/56739669/182436489-5e66b419-d3ad-4f33-b38b-92b6db6dd467.png) |



** Note : If you want to point other instances of your application to your clients (such as ephemeral instances that are spun up for pull request validation or something), feel free to use DEV and TEST (but you will have to have valid redirect URIs configured for those instances).

### Technical Details

##### OIDC Setup and Keycloak's Authentication Flow

All clients of Pathfinder SSO will use _Authorization Code Flow_. This is the modern, recommended OIDC setup for web applications and mobile applications.

##### Confidential vs Public Client

When requesting a new client you can specify whether you want it set up as a _Confidential_ client or you want it set up as a _Public Client with PKCE_.

With a confidential client, the back-end component securely stores an application secret that allows it to communicate with the KeyCloak server to facilitate the OIDC authentication process.

A public client is slightly less secure because there is no secret, but this configuration is required by some architectures and is supported as well. Public clients can use PKCE (Proof Key for Code Exchange) as a more secure flow.

PKCE provides dynamic client secrets, meaning your app’s client secrets can stay secret (even without a back end for your app). PKCE is better and more secure than the implicit flow (AKA the “token flow”). If you’re using the implicit flow, then you should switch to PKCE. If you use an implicit flow to authorize your Dropbox app, then PKCE is a better, more secure replacement, and you should no longer use implicit flow.

See the diagram below for use cases where each option is appropriate.

![public-confidential](https://user-images.githubusercontent.com/37274633/142315233-b376b29c-4763-466c-8578-536d8f3a2ee2.png)

#### Using PKCE

The javascript adapter for keycloak has built-in support for using PKCE. See the documentation under the init method [here](https://www.keycloak.org/docs/latest/securing_apps/#methods), specifically the `pkceMethod`. For example, when initializing the adapter you can call `keycloak.init({ pkceMethod: 'S256' })` to use PKCE. Use the 'S256' method for you public client.

If not using the adapter, you can use a custom implementation. This will require 4 steps:

1. Create a `code_verifier` (cryptographically secure string)
2. Hash the code verifier with the SHA256 method to create a `code_challenge`
3. Send the code challenge and code challenge method (S256) as query parameters when redirecting users to the authorization endpoint
4. When exchanging the received code for an access token, send the initial `code_verifier` to ensure your application initiated the current exchange.

For an example of a custom PKCE implementation, see [here](https://github.com/bcgov/sso-requests/blob/dev/app/utils/openid.ts#L20) for generating the authentication URL and [here](https://github.com/bcgov/sso-requests/blob/dev/app/utils/openid.ts#L49) for exchanging the received code for an access token.

#### Usecases

**Browser Login** - A web based application requiring a login component

**Service Account** - A service account is a digital identity used by an application software or service to interact with other applications or the operating system. They are often used for machine to machine communication (M2M), for example for application programming interfaces (API).

**Browser Login and Service Account** - A combination of the above


### Setting Up your Redirect URIs

#### Specifying redirect URIs are important

It is important to register redirect URIs as specifically as possible to prevents _bad guys_ from accessing your client and obtaining your users' information.

- Please see [here](https://www.keycloak.org/docs/latest/server_admin/index.html#unspecific-redirect-uris_server_administration_guide) for more detail.

#### Valid Redirect URIs

Redirect URI(s) is a required field to enable `standard OpenID Connect redirect based authentication` with authorization code. In terms of OpenID Connect or OAuth2 specifications, this enables support of 'Authorization Code Flow' for this client.

- Wildcards (\*) are commonly used to allow `dynamical redirect URIs` and can be added at the end of a URI only, i.e. http://host.com/*
- For local dev environment, `localhost` URIs can be used, i.e. http://localhost:3000/*

To learn more about our format, [visit our redirect URI format page](https://github.com/bcgov/sso-keycloak/wiki/CSS-App-Valid-Redirect-URI-Format)

#### Public Clients and Web Origins
The redirect URIs will be copied over to Keycloak Web Origins setup. In addition, adding ‘+’ to permit all origins of Valid Redirect URIs


### Setting Up your Keycloak Client

##### Installation JSON

Once your request has been completed, you will be able to download your installation file for each environment. It includes the client information to set up your SSO configuration.

- an example Installation JSON for `confidential` client types

```json
{
  "realm": "<standard_realm_name>",
  "auth-server-url": "https://<env>.loginproxy.gov.bc.ca/auth/",
  "ssl-required": "external",
  "resource": "<client_id>",
  "credentials": {
    "secret": "<client_secret>"
  },
  "confidential-port": 0
}
```

- an example Installation JSON for `public` client types

```json
{
  "realm": "<standard_realm_name>",
  "auth-server-url": "https://<env>.loginproxy.gov.bc.ca/auth/",
  "ssl-required": "external",
  "resource": "<client_id>",
  "public-client": true,
  "verify-token-audience": true,
  "use-resource-role-mappings": true,
  "confidential-port": 0
}
```

- The main difference between `confidential` and `public` clients is that `confidential` clients require `client secret`.

#### Connecting to Keycloak using an adapter

After having your `Installation JSON`, you can setup your application quickly using the Keycloak adapters. Keycloak has adapters for a number of languages, including java, javascript and C#. For a list of adapters and instructions on how to connect see [here](https://www.keycloak.org/docs/latest/securing_apps/index.html#openid-connect).

- There are example applications available to demonstrate integrating with Keycloak [here](https://github.com/bcgov/keycloak-example-apps)
- In most cases, it does not require any additional information than the `Installation JSON` you can download.

#### Connecting without an adapter

If you are not using an adapter, you will require some additional information to set up your OpenID connection. Required information
can be found behind the publicly accessible `provider configuration endpoint` for your environment.

Based on our integration with us, you will either have your integration connected to our Gold Standard offering. Reach out to us if you have questions.


##### Gold Service

These are:

- **Dev**: https://dev.loginproxy.gov.bc.ca/auth/realms/standard/.well-known/openid-configuration
- **Test**: https://test.loginproxy.gov.bc.ca/auth/realms/standard/.well-known/openid-configuration
- **Prod**: https://loginproxy.gov.bc.ca/auth/realms/standard/.well-known/openid-configuration

##### OpenID Provider Metadata sample
It gives you `OpenID Provider Metadata` required for the OpenID connect configration:

```json
{
  "issuer": "https://<env>.loginproxy.gov.bc.ca/auth/realms/<realm_name>", // Issuer URL
  "authorization_endpoint": "https://<env>.loginproxy.gov.bc.ca/auth/realms/<realm_name>/protocol/openid-connect/auth", // Authorization URL
  "token_endpoint": "https://<env>.loginproxy.gov.bc.ca/auth/realms/<realm_name>/protocol/openid-connect/token", // Token URL
  "userinfo_endpoint": "https://<env>.loginproxy.gov.bc.ca/auth/realms/<realm_name>/protocol/openid-connect/userinfo", // User Info UR
  "end_session_endpoint": "https://<env>.loginproxy.gov.bc.ca/auth/realms/<realm_name>/protocol/openid-connect/logout", // Logout URL
  "jwks_uri": "https://<env>.loginproxy.gov.bc.ca/auth/realms/<realm_name>/protocol/openid-connect/certs", // JSON Web Key Set URL
  ...
}
```

- According to [OpenID Connect Discovery](https://openid.net/specs/openid-connect-discovery-1_0.html#OpenID.Core) documentation, _"OpenID Providers have metadata describing their configuration. These OpenID Provider Metadata values are used by OpenID Connect"_

- You can find the `client_id` and `client_secret` from the `Installation JSON` downloaded through the request process.
- Please see
  [here](https://www.keycloak.org/docs/latest/securing_apps/index.html#endpoints) for a full list of endpoints and their descriptions.
- Please see [here](https://www.keycloak.org/docs/latest/securing_apps/index.html#other-openid-connect-libraries) for a other OpenID Connect Libraries.

#### Specifying an IDP to bypass the Keycloak login page

If there is more than one IDP in the realm, the Keycloak server directs your users into a login page to let them choose the IDP that they want to authenticate with. It is possible to skip the login page or override the default IDP in Keycloak by passing the optional query param" kc_idp_hint". [List of kc_idp_hints here](https://github.com/bcgov/sso-keycloak/wiki/Using-Your-SSO-Client#do-skip-the-keycloak-login-page)

- If using an adapter, there is an option for providing `idpHint`, and
- if not, please specify it in the `Authorization URL` in your code or configuration, i.e. `http://localhost:8080/auth?kc_idp_hint=<idp_name>`
- Please see [here](https://www.keycloak.org/docs/latest/server_admin/index.html#_client_suggested_idp) for more detail.

If the framework you are using prevents you from being able to pass through the _IDP hint_, please reach out to our team through rocket chat or email to ask about alternative options.

#### A few notes on security

The KeyCloak adapter for a Confidential client is configured in your **server-side component** because it requires a client ID and client secret that must be kept securely on the server and never provided to the user's browser. You can specify in your application logic which routes are secure and which are not. Use the adapter for this unless you really want to code your own OIDC logic. Your secure routes should invoke the adapter on each request to make sure the user is authenticated.

If you have an insecure "Home" page, the URI to load that page should not be secured and should not invoke authentication. If you create a "Login" button that makes an http request to a secure resource, that should kick off an authentication process. Any non-public API calls to your server-side component should be secured with the KeyCloak adapter.

#### A note on redirect URIs

You can use any valid URI for your redirect URIs. At least one redirect URI is required for each or DEV, TEST and PROD. If you don't know the redirect URI for one or more of these environments, you may provide any valid URI for now and change it later. We suggest something like 'http://localhost:1000'

#### Advanced settings

Through the Common Hosted Single Sign On Application, with a suitable justification, you can request to configure the following settings

* **Access Token Lifespan** - This setting is for the max time before an access token is expired. The value is recommended to be short relative to the SSO timeout. _Default set to 5 mins_

* **Client Session Idle** - this setting is the time a client session is allowed to be idle before it expires. Tokens are invalidated when a client session is expired. If not set it uses the standard SSO session idle value.  _Default set to 30 mins_

* **Client Session Max** - this setting is the max time for a client session before it expires. Tokens are invalidated when a client session is expired. If not set it uses the standard SSO session max value. _Default set to 10hrs_

* **Client Offline Session Idle** - this setting is the time that client offline session is allowed to be idle before it expires. Offline tokens are invalidated when a client offline session is expired. If not set it uses the offline session idle value. _Default setting - talk to us_

* **Client Offline Session Max** - this setting is the max time before a client offline session is expired. Offline tokens are invalidate when a client offline session is expired. If not set, it uses the offline session max value. _Default setting - talk to us_

More information can be found [here](https://access.redhat.com/documentation/en-us/red_hat_single_sign-on/7.5/html/server_administration_guide/managing_user_sessions#timeouts)



### CSS API

Through our engagements with our clients, we listened to your request to have an api so your apps can connect to our CSS App. Please go to [CSS API Account](https://github.com/bcgov/sso-keycloak/wiki/CSS-API-Account) of our wiki to learn more.

Note: Often times, you do not want to be the only person with access to your client details or you may want to create multiple clients. If this the case, please visit [CSS App and My Teams](https://github.com/bcgov/sso-keycloak/wiki/CSS-App-My-Teams) for more info on Team Admins and Team Members

### Dos and Don'ts

#### Do Not Call the KeyCloak API on Every Request

This can potentially bring down the shared service for all clients. This was the issue we saw with [Flask-OIDC](https://flask-oidc.readthedocs.io/en/latest/) with some teams. The adapter was making a call to the [Token Introspection Endpoint](https://www.oauth.com/oauth2-servers/token-introspection-endpoint/) with every request and it was a high-volume service. Most adapters don't do this as the token information is available within the token itself, but this one adapter seems to have a defect.

Another important technique to be aware of is that you should cache the JWT in a cookie so that you don't have to check the status of your session with every request. Keycloak has a feature that provides a cookie for you, and libraries like keycloak-js make use of this to limit the number of round trips to the Keycloak server.

#### Do Not Load Test in Production

Please let the SSO team in advance when you want to do load testing in DEV and TEST so we can plan ahead and coordinate with other teams. These are shared environments that many teams are actively using. A failed load test can affect many other teams.

#### Do Protect the Client Secret (Confidential Client Only)

It stays on the server. Use OCP _secrets_ if you are on OpenShift. Don't put it in your public JavaScript or in your GitHub repository. Don't build it into your Docker image.

#### Do Carefully Manage Your List of Valid Redirect URIs

Your redirect URIs should only be resources that you control. Most of the time you will only need one URI (the one that you want the client to return to after a login event).

#### Do Apply Appropriate Logout Calls
 There is known issue with identity providers which retain session. [More info here](https://stackoverflow.developer.gov.bc.ca/questions/83)

#### Do Skip the KeyCloak Login Page

In KeyCloak, if the realm that contains your client has more than one IDP configured, KeyCloak shows a page that prompts the user to select which IDP they want to log in with. Almost all teams have chosen to hide this page from their users by specifying the IDP as a query string parameter in the KeyCloak Authorization URI value behind their login button. The querystring is 'kc_idp_hint'. (The IDPs available will depend on the standard realm in which your client exists.) By specifying the IDP in this way, the user will be redirected directly to the login page for the identity provider and will not see the KeyCloak login choice page at all.

| Display Name       | kc_idp_hint        |
| ------------- |:-------------:|
| IDIR           | idir |
| Azure IDIR     | azureidir |
| Basic BCeID    | bceidbasic |
| Business BCeID | bceidbusiness |
| Basic or Business BCeID      | bceidboth |
| GitHub BC Gov           | githubbcgov |
| GitHub Public            | githubpublic |


We do have a work around for those of you who ABSOLUTELY need the keycloak login page [here](https://github.com/bcgov/sso-keycloak/wiki/Recommend-Skipping-the-Keycloak-Login-Page-and-if-you-ABSOLUTELY-need-it), please talk to us about this.

#### Do Validate the IDP in the JWT

Because there are multiple IDPs available to your client in the standard realm, if your application has business logic that specifies a particular login method, you have to enforce that. For example, if your application requires BCeID to authenticate, you have to make sure that the user didn't somehow log in with IDIR instead. Your client has a mapper configured to provide the alias of the IDP that was used to log in. The name of the claim is 'identity_provider' and the possible aliases are the same as the ones that are used for the kc_idp_hint query parameter (see above).

In the standard realms that support BCeID there are multiple IDPs (both BCeID and IDIR) and it is theoretically possible for a user to change the IDP hint (see above) maliciously using scripting or other techniques. Additionally, a user that is signed into another application that shares the same realm will get single sign-on with your app, so if you want to enforce a particular IDP, that's another good reason to validate the IDP that they used to sign in. It's up to you and your business logic requirements to make sure that your users have a good user experience and that you don't leave any room for unintended login flows.

If for some reason you want to make sure that your users do NOT have a single sign-on experience, you can force them to re-authenticate according to the OIDC spec at: [3.1.2.3. Authorization Server Authenticates End-User](https://openid.net/specs/openid-connect-core-1_0.html#Authenticates).

#### Do revoke tokens

Ensure offline tokens are revoked after use or set the maximum time.    

#### Do validate tokens at application level

Validate the token at the application level rather than using an introspection endpoint


<p align="center">
  <img width="300" height="300" src="https://user-images.githubusercontent.com/87393930/133833777-8b99fa68-4893-4d72-b5ed-32c8e8692e7d.png">
</p>

---
