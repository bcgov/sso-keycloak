# Introduction to Terms
This section covers general terms used throughout this documentation, as well as [resources and links](#more-resources) for learning about and using this service.

### Authentication

Authentication is the process of verifying who someone is.

### Authorization

Authorization is the process of verifying what specific applications, files, and data an entity has access to. Authorization can be broken into two categories based on the entity being authorized:

- **Client Authorization**: This determines the resources that a client is allowed to access on a user's behalf, and is most often what is meant by Authorization in an OAuth context.

- **User Authorization**: This determines the resources a user is allowed access, and usually applies when the user is interacting directly with the resource server.

User authorization can be implemented in many ways. Our service supports user roles allowing RBAC for robust user authorization. See [Creating and Managing a Role](./Creating-a-Role.md) for more information on using roles.

### Identity Provider

An Identity Provider is the holder of the identity that is used to log in with. The Pathfinder SSO service is NOT an identity provider. When a user of your application logs in, they will not be providing credentials to your application directly, or even to the Pathfinder SSO service. They will be logging in directly with the identity provider. That login event is then propagated back to your application in the form of a token that proves that they have logged in correctly. [Visit this FAQ](https://github.com/bcgov/sso-keycloak/discussions/256) on which Identity Provider might be best for you.

### Keycloak

[Keycloak](https://www.keycloak.org/) is an open source identity and access management tool. Our team runs [Red Hat SSO](https://access.redhat.com/products/red-hat-single-sign-on/), a component built on top of keycloak, and this documentation may use the terms interchangeably. [See here](What-is-Keycloak-at-BC-Government#what-is-keycloak) for a general overview of how we use keycloak.

### Client

Clients are entities that can request Keycloak to authenticate a user. Most often, clients are applications and services that want to use Keycloak to secure themselves and provide a single sign-on solution. Clients can also be entities that just want to request identity information or an access token so that they can securely invoke other services on the network that are secured by Keycloak. Clients can be either public or confidential:
- **Public Clients** are unable to use registered client secrets, for example applications running in the browser.
- **Confidential Clients** are applications that are able to securely store a client secret, such as server-rendered web applications.

### Realm

A realm manages a set of users, credentials, roles, and groups. A user belongs to and logs into a realm. Realms are isolated from one another and can only manage and authenticate the users that they control.

### Standard Realm

Clients created through our [CSS App](https://bcgov.github.io/sso-requests) will be configured into the standard realm, which includes a default set of optional IDP's and configurations suitable for most applications. Additional client-level configurations can be made through the webapp.

### Custom Realm

Custom realms are regular keycloak realms, which may be required by some clients who need features not supported in the standard realm. [See here](index#some-more-details-on-standard-vs-custom-realms) for more information on the difference between standard and custom realms.

## More Resources

### Readings for OAuth 2.0:

- [The OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [The State Of The Implicit Flow In Oauth2](https://brockallen.com/2019/01/03/the-state-of-the-implicit-flow-in-oauth2/)
- [OAuth 2.0 Threat Model and Security Considerations](https://tools.ietf.org/html/rfc6819)
- [OAuth 2.0 Security Best Current Practice](https://tools.ietf.org/html/draft-ietf-oauth-security-topics-13)
- [OAuth 2.0 for Browser-Based Apps](https://tools.ietf.org/html/draft-parecki-oauth-browser-based-apps-02)

### Learn about the Open ID connect and OAuth Protocols:

- [Example OIDC Applications Repository](https://github.com/bcgov/keycloak-example-apps/tree/dev/examples/oidc)
- [Our videos material from August 2023 Iteration on OIDC Learning ](https://www.youtube.com/playlist?list=PL9CV_8JBQHirMRjBk62jeYUE_MpE4unU8)
- [Powerpoint of OIDC and OAuth](https://github.com/bcgov/sso-keycloak/files/12422946/oidc-oauth-presentationk-beta.pptx)
- [OIDC Primer](https://developer.okta.com/blog/2017/07/25/oidc-primer-part-1)
- [SAML2 vs JWT: Understanding OpenID Connect Part 1](https://medium.com/@robert.broeckelmann/saml2-vs-jwt-understanding-openid-connect-part-1-fffe0d50f953)
- [Whats The Difference Between Oauth, Openid Connect And Saml](https://www.okta.com/identity-101/whats-the-difference-between-oauth-openid-connect-and-saml/)
- [SAML2 vs JWT: Understanding OpenID Connect Part 2](https://medium.com/@robert.broeckelmann/saml2-vs-jwt-understanding-openid-connect-part-2-f361ca867baa)
- [How OIDC authorization code flow works with a public client](https://www.pingidentity.com/en/company/blog/posts/2018/securely-using-oidc-authorization-code-flow-public-client-single-page-apps.html)

### Learn about Keycloak and its APIs:

* [Red Hat SSO (Keycloak)](https://access.redhat.com/documentation/en-us/red_hat_single_sign-on/7.6/)
* [Realm Admin guide](https://access.redhat.com/documentation/en-us/red_hat_single_sign-on/7.6/html/server_administration_guide/index)

### Q&A with Us:

- [Github Discussions Q&A on Gold](https://github.com/bcgov/sso-keycloak/discussions/categories/gold-q-a)
- [Stackover flow Collection 1 on Keycloak/RedHat SSO](https://stackoverflow.developer.gov.bc.ca/collections/179)
- [Stackover flow Collection 2 on Custom Realms](https://stackoverflow.developer.gov.bc.ca/search?q=custom+realm)

_**Have any questions? We would love to hear from you.**_ ![Chat Bubble](./img/chat-bubble.png)   <a href="mailto:bcgov.sso@gov.bc.ca">![Email](./img/email.png)</a>
