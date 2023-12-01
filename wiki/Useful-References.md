* [Intro to terms](#intro-to-terms)
* [How we describe Keycloak](#keycloak-how-we-describe-it)
* [Newbie Guide: Concepts and Terms](#newbie-guide)
* [Learn about the Open ID connect and OAuth Protocols](#learn-about-the-open-id-connect-and-oauth-protocols)
* [Our Youtube videos on OIDC 101](#oidc-101)
* [Learn about Keycloak and its APIs](#learn-about-keycloak-and-its-apis)
* [How to set up and use your KeyCloak Client](#how-to-set-up-and-use-your-keycloak-client)
* [Q&A with Us](#qa-with-us)



## Intro to terms

### Authentication

Authentication is the process of verifying who someone is

### Authorization

Authorization is the process of verifying what specific applications, files, and data a user has access to. For further detail on the OAuth2 flow being used for clients in the standard realm, please see the [Authorization Code Flow](https://auth0.com/docs/authorization/flows/authorization-code-flow).


### Identity Provider

An "Identity Provider" is the holder of the identity that is used to log in with. The Pathfinder SSO service is NOT an identity provider. When a user of your application logs in, they will not be providing credentials to your application directly, or even to the Pathfinder SSO service. They will be logging in directly with the identity provider. That login event is then propagated back to your application in the form of a token that proves that they have logged in correctly.

[Visit this FAQ](https://github.com/bcgov/sso-keycloak/discussions/256) on which Identity Provider might be best for you

### [Keycloak how we describe it](What-is-Keycloak-at-BC-Government#what-is-keycloak)

### Newbie Guide

Visit [this page](https://github.com/bcgov/sso-keycloak/discussions/136) to understand key concepts and terms as you make use of our Self Service application to integrate your digital application with a with BC government approved login option.


## Learn about the Open ID connect and OAuth Protocols
### Readings for OAuth 2.0:
- https://tools.ietf.org/html/rfc6749
- https://brockallen.com/2019/01/03/the-state-of-the-implicit-flow-in-oauth2/
- https://tools.ietf.org/html/rfc6819
- https://tools.ietf.org/html/draft-ietf-oauth-security-topics-13
- https://tools.ietf.org/html/draft-parecki-oauth-browser-based-apps-02

### OIDC 101
  [Example Repository](https://github.com/bcgov/keycloak-example-apps )

  [Our videos material from August 2023 Iteration on OIDC Learning ](https://www.youtube.com/playlist?list=PL9CV_8JBQHirMRjBk62jeYUE_MpE4unU8)

  [Nithin's ppt](TBD)

  [Powerpoint of OIDC and OAuth](https://github.com/bcgov/sso-keycloak/files/12422946/oidc-oauth-presentationk-beta.pptx)

The following links are a good introduction or refresher to the OIDC standard.
- [SAML2 vs JWT: Understanding OpenID Connect Part 1](https://medium.com/@robert.broeckelmann/saml2-vs-jwt-understanding-openid-connect-part-1-fffe0d50f953)
- [SAML2 vs JWT: Understanding OpenID Connect Part 2](https://medium.com/@robert.broeckelmann/saml2-vs-jwt-understanding-openid-connect-part-2-f361ca867baa)



## Learn about Keycloak and its APIs

* [Red Hat SSO (Keycloak)](https://access.redhat.com/documentation/en-us/red_hat_single_sign-on/7.4/)
* [Realm Admin guide](https://access.redhat.com/documentation/en-us/red_hat_single_sign-on/7.4/html/server_administration_guide/index)
* [API usage](https://access.redhat.com/webassets/avalon/d/red-hat-single-sign-on/version-7.4/restapi/)
## How to set up and use your KeyCloak Client
- [How OIDC authorization code flow works with a public client](https://www.pingidentity.com/en/company/blog/posts/2018/securely-using-oidc-authorization-code-flow-public-client-single-page-apps.html)

## Q&A with Us

[Github Discussions Q&A on Gold](https://github.com/bcgov/sso-keycloak/discussions/categories/gold-q-a)

[Stackover flow Collection 1 on Keycloak/RedHat SSO](https://stackoverflow.developer.gov.bc.ca/collections/179)

[Stackover flow Collection 2 on Custom Realms](https://stackoverflow.developer.gov.bc.ca/search?q=custom+realm)



#### *Have any questions? We would love to hear from you.* [![Semantic description of image](https://user-images.githubusercontent.com/87393930/133688357-09f82374-ba18-4402-8089-c0a989dde882.png)][2]   <a href="mailto:bcgov.sso@gov.bc.ca?"><img src="https://user-images.githubusercontent.com/87393930/133690650-b706e658-27bf-4066-92ba-3a7d8a4593ef.png"/></a>
[2]: https://chat.developer.gov.bc.ca/channel/sso
[3]: https://[mail](mailto:bcgov.sso@gov.bc.ca)[email](mailto:bcgov.sso@gov.bc.ca)
