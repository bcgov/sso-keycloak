# SSO Pathfinder Knowledge Base

Welcome to our wiki for our Single Sign On Service. You are in the right spot if you need to configure/develop a login component (IDIR or BCeID) for your digital product/project. You can learn about [Common Hosted Single Sign On App on The Exchange Youtube channel](https://www.youtube.com/watch?v=JBaGxqykXJQ&list=PL9CV_8JBQHirMRjBk62jeYUE_MpE4unU8&index=3) or continue to read below.

**Get started now for your self serve experience to our [common hosted single sign on app](https://bcgov.github.io/sso-requests).**

<p style="text-align: center" markdown>
  ![Laptop](./img/css-app-on-laptop.png){: style="width:380px;height:300px;"}
</p>

<br>
<br>

#### _Have any questions? We would love to hear from you._ [![Chat Bubble](./img/chat-bubble.png)][2] <a href="mailto:bcgov.sso@gov.bc.ca">![Email](./img/email.png)</a>

[2]: https://chat.developer.gov.bc.ca/channel/sso

[3]: https://[mail](mailto:bcgov.sso@gov.bc.ca)[email](mailto:bcgov.sso@gov.bc.ca)

## Benefits

Here’s some reasons as to why this might work for your digital product:

### Easy setup

We've made this the #1 feature of this service. You can get your DEV, TEST, and PROD instances running against most of the available identity providers right away. The Pathfinder SSO service already has integrations to the following identity providers

- IDIR (BC Common Logon Page)
- [Learn about Azure IDIR ](Our-Partners-the-Identity-Providers#azure-idir-and-idir)
- BCeID Basic (BC Common Logon Page) -- Allows login only with BCeID _Basic_
- BCeID Business (BC Common Logon Page) -- Allows login only with BCeID _Business_
- BCeID Basic & Business(BC Common Logon Page) -- Allows login with BCeID _Basic_ or BCeID _Business_
- GitHub associated with BC Gov Org -- Allows login of GitHub BC Gov Org members
- Digital Credentials -- Allows login via _BC Wallet_
- BC Services Card -- Allows login via _BC Services Card App_

### OIDC protocol

Where certain identity providers (BCeID in particular) support SAML protocol when used directly, Pathfinder SSO brokers the SAML connection and lets you use OIDC instead. OIDC is more common and simpler to set up in modern programming stacks. [Please watch our material on youtube.](https://www.youtube.com/playlist?list=PL9CV_8JBQHirMRjBk62jeYUE_MpE4unU8)

### Session Management

Some identity providers don't offer advanced session management capabilities.

### High Availability Requirements

The Pathfinder SSO service is working on a formal published service level agreements (see [BC Government SSO Service Definition](https://digital.gov.bc.ca/common-components/pathfinder-sso/). This service is available 24/7 with questions and answers addressed during business hours only. [Uptime Monitoring](Pathfinder-Uptime-Monitoring)

## Limitations

It is technically possible to integrate directly with the various identity providers instead of using SSO-KEYCLOAK(formerly OCP-SSO). Architectural reasons for direct integration include:

### High Volume Expectations

The service is shared by many dozens of applications. If one application starts sending millions of login requests, the service itself can experience service degradation which is felt by all the users of all the applications. Pathfinder SSO is managed on the OpenShift Platform and scales fluidly, but there are limits to the resources it can consume.

### Unique Configuration Needs

New customers no longer receive a dedicated realm where they can experiment and invent on top of the platform (see "What's Changed" below).

### BC Services Card

The Pathfinder SSO Service provides the BC Services Card as a login option for both OpenID and SAML clients within the common realm. However, due to the high-security nature of the BC Services Card and the sensitive personal information involved in its authentication process, user personal information (PI) is not stored in the Keycloak database. As a result, we are unable to offer the **Role Management** feature, which is available with other identity providers such as IDIR and BCeID.

Each application requires separate user consent for authentication. Therefore, even if a user has an active BC Services Card session with one application, they must go through the authentication process again when logging into a different application, as **Single Sign-On (SSO)** is not supported in this case.

### Digital Credentials

The Pathfinder SSO Service provides the Digital Credentials as a login option for only OpenID clients. The reason this is not available for SAML clients due to lack of support for additional request query param `pres_req_conf_id`.

In our system, we do not store user attributes after a successful login using Digital Credentials. As a result, we lack access to persistent user data, which is essential for managing user roles and permissions. Consequently, this limitation means that we are unable to offer **Role Management** feature, as we cannot maintain or reference user-specific information required for such functionality. This design choice prioritizes user privacy and security by ensuring that personal data is not retained, aligning with the principles of decentralized identity management.

Since we do not retain any user-specific data during authentication with Digital Credentials, we cannot offer **Single Sign-On (SSO)** across client applications. As a result, users must provide consent each time they log into a new application using Digital Credentials.

## Our Partners

We provide our service with the support of our Identity Provider Partners. An "Identity Provider" is the holder of the identity that is used to log in with. [Learn more about our partners and relevant identity provider information](Our-Partners-the-Identity-Providers).

Your technical team may need to know the identity provider attributes provided, [please visit here to learn more on what we get from our Identity Partners](Identity-Provider-Attribute-Mapping)

Note: It is totally possible for your application to integrate with any or all of the identity providers directly instead of using the Pathfinder SSO service.

## Our Service

The Pathfinder SSO service (also known as "KeyCloak" or "RedHat SSO") consists of two offerings: Standard and Custom.

Our standard service makes use of one "standard" realm. When you complete a request in our [common hosted single sign on app](https://bcgov.github.io/sso-requests), you receive a pre-configured client inside an existing realm. Some of the features of this service:

- [Role based access control, ie authorization](Creating-a-Role)
- [Situations where you use our service](Using-Your-SSO-Client#usecases)
- [If you need to interact with the CSS App in a RESTful way](CSS-API-Account)
- [CSS APP my Teams](CSS-App-My-Teams)
- [CSS APP valid redirect URI Format](https://bcgov.github.io/sso-docs/integrating-your-application/redirects#valid-redirect-format)
- [Are you Part of GitHub BC Gov Org](Are-you-part-of-the-GitHub-BC-Gov-Org)

Our custom service is restricted on a needs only basis. Let’s have a conversation if our Standard (ie a request in common hosted single sign on app,) doesn't meet your needs. A product owner and technical contact will need to have a chat with us. Please reach out [email](mailto:bcgov.sso@gov.bc.ca)

### Some more details on Standard vs Custom Realms

#### Why do we promote Standard Realm?

90% of our clients make use of this service. It should be noted the KeyCloak product was not designed to handle an unlimited number of realms and we managed to find the limit (unfortunately!).

New customers will now be added to one of the specially configured standard realms to help us continue to offer this great common component.

We provide:

- Self-registration
- 20-minute access to a developer, test, and production environment
- Default settings
- Architecture best practices
- Access to developer support
- 24/7 site reliability monitoring
- Continuous improvement & bug fixes

Your team doesn't need to do any heavy lifting!

#### What are the nuances of a Custom Realm?

If your application has specific needs that don't fit our standard service, we also offer Custom Realms. Your team can configure it themselves to meet your needs.

We will provide you with all the advice and best practices for you to set it up.

Your responsibilities:

- Developer resources
- Governance model & decisions
- Migration of project teams that move ministries
- Access considerations
- Site reliability monitoring
- Bug fixes
- Any other hidden or overhead costs or resources

Learn more about the differences between Custom and Standard [here](https://github.com/bcgov/sso-keycloak/wiki/Understanding-the-Difference-Between-Custom-and-Standard-Realms)

## History

<p style="text-align: center" markdown>
  ![Laptop](./img/timeline_Dec2023.svg){: style="width:660px;height:500px;"}
</p>
