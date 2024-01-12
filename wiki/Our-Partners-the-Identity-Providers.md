
## Our Partners
We provide our service with the support of our Identity Provider Partners. An "Identity Provider" is the holder of the identity that is used to log in with. Learn more about our partners and relevant identity provider information.

Your technical team may need to know the identity provider attributes provided, [please visit here to learn more on what we get from our Identity Partners](https://github.com/bcgov/sso-keycloak/wiki/Identity-Provider-Attribute-Mapping)


## What are Identity Providers?

[Identity providers](Useful-References#identity-provider) are directories of user accounts with details about those users, called attributes. The ones available to Pathfinder SSO Clients are:
- **IDIR** IDIR accounts are given to individuals who work for the B.C. government. Please note, your end users must have an IDIR account which can make use of the two authentication services we provide based on your application needs:
  - **IDIR via IWA**
    * User Experience: use an IDIR username and password for logging in.
    * Architecture/Developer note: Uses integrated windows authentication (IWA). This means if you are on a goverment pc and on the network, you don't have to re-enter your windows credentials for an IDIR based applcation using our service. IWA functionality is not OS dependent. It is only dependent on the browser version, IP and government managed device criteria. [reference](https://www2.gov.bc.ca/gov/content/governments/services-for-government/information-management-technology/identity-and-authentication-services/login-best-practices/language-consistency)
  - **IDIR via Azure**
    * User Experience: IDIR account with the added the benefit of MFA (multi-factor authentication).
    * Architecture/Developer note: It is a step up security-wise from regular IDIR. [reference](https://intranet.gov.bc.ca/thehub/ocio/ocio-enterprise-services/information-security-branch/information-security-mfa/mfa-registration)

- **BCeID** BCeID Accounts enable people to access government services using a single identifier and password.[reference](https://www2.gov.bc.ca/gov/content/governments/services-for-government/information-management-technology/identity-and-authentication-services/bceid-authentication-service)

- **BCSC (BC Services Card)**	The BC Services Card provides access to government services for B.C. residents [reference](https://www2.gov.bc.ca/gov/content/governments/government-id/bc-services-card/log-in-with-card)

- **Digital Credential**	These are the digital equivalents of physical credentials and used with a secured digital wallet for managing and storing.[reference](https://digital.gov.bc.ca/digital-trust/about/what-are-digital-credentials/)


- **GitHub associated with BC Gov Org**	 Allows login of GitHub BC Gov Org member. At the time of writing, production approval for this requires you to obtain an exemption to the IM/IT standards. [IM/IT Standards Frequently Asked Questions](https://www2.gov.bc.ca/gov/content/governments/services-for-government/policies-procedures/im-it-standards/im-it-standards-faqs)


## IDIR via Azure
We offer integrations with IDIR via Azure and the benefit of MFA (multi-factor authentication). This is a step up security-wise from regular IDIR.

You may have to educate your end users on MFA and please take note if your IDIR is not tied to a gov.bc.ca email address, please use idir_username@gov.bc.ca when prompted for your email.

You can **learn** [here from our IDIR Partner](https://intranet.gov.bc.ca/thehub/ocio/ocio-enterprise-services/information-security-branch/information-security-mfa/mfa-registration)

Also note if you get an error message similar to the one below, please ensure the end user has an BC Gov Azure IDIR account in order to gain access.

![Azure IDIR error](./img/azureidir-error.png){: style="width:400px;height:500px"}

## Common Login Errors

### IDIR and BCeID in the same browser

As we partner with the BC Gov Identity Partners of IDIR and BCeID please note in the same browser, you cannot have one tab logged in with IDIR and another with BCeID.

Please use a private browser by either using incognito or clearing your cache.

### Other issues

Please ensure you have tested with an incognito browser as mentioned above. If it is still an issue, reachout to us on [rocketchat](https://chat.developer.gov.bc.ca/channel/sso).

## Digital Credential Configuration

This defines which credential (or combinations of credentials) will be requested at user authentication.

Please work with the DITP team ditp.support@gov.bc.ca to define whether an existing configuration can be used, or a new one should be created for the specific use-case. Additionally, some best practices that need to be implemented at the application level can be found [here](https://github.com/bcgov/vc-authn-oidc/blob/main/docs/BestPractices.md).

## BC Service Card Integration

*BC Services Card provides an Open ID Connect authentication server. Integration to this service is not available in the *standard* realms.*

The IDIM team that manages BCSC integration is responsible for safeguarding the personal information that is available in a login context. They have a business requirement that integrations to BCSC cannot be shared without IDIM approval. The standard realm is a shared environment -- if we enabled a BCSC integration in a standard realm it would be technically available to all the clients that are configured to use that realm, thus breaking the security model.

---------------------------------

### Options for Teams with BCSC Requirements

??? info "Join an Existing Dedicated Custom Realm"
    With approval from IDIM, it is possible to join an existing realm that shares the same security context as your application and already has BCSC set up. This generally means that the existing clients are all from the same ministry or sector and have the same requirements for personal information through the login process.

    There are very few instances of this pattern at this time, but it is an option that is possible with the help and approval of IDIM.

    Be that as it may, if there is a closely related project in your ministry or sector that you think would be a candidate for sharing a BCSC integration, you may wish to start the conversation with IDIM and see if it makes sense for your situation.

??? info "Integrate Directly with BCSC"

    Since IDIM provides an OIDC service for BCSC, your app can integrate directly with that service instead of brokering through Pathfinder SSO. Their security practices usually require a client per application in any case, so your architecture might not require using Pathfinder SSO as a proxy authentication service anyway. In addition, this pattern removes one possible point of failure from the application architecture.

    Be mindful however that the SSO (Keycloak) product does offer token and session management; integrating directly with BCSC would require another form of token/session management to be used in your application.


??? info "Configure and Manage Your Own Dedicated KeyCloak Server"

    KeyCloak runs on JBoss quite happily in a Docker container with a PostgreSQL backend. If you really need features provided by KeyCloak and you want to integrate with BCSC, it's possible to run your own KeyCloak server and configure your connection to BCSC by setting up your own OIDC IDP.

??? info "Obtain a Dedicated KeyCloak Realm on the Pathfinder SSO service"

    If the service gets to the point where there are "slots" to create new dedicated realms, a BCSC identity provider can be securely configured within a realm dedicated to your team. For now, we are unable to offer new realms while we work to reduce the number down to a manageable size.

??? info "Obtain a Dedicated KeyCloak Realm on the Pathfinder SSO service"

    Things are always evolving and the BC Government Open Source community is constantly innovating and solving problems together. Don't be afraid to jump into the #SSO RocketChat channel and see what the community recommends if you have an unusual use case or an innovative idea. Thank you for your collaboration!


<p align="center" markdown>
  ![Services Card](./img/services-card.png)
</p>

----------------------------
#### *Have any questions? We would love to hear from you.* [![Chat Bubble](./img/chat-bubble.png)][2]   <a href="mailto:bcgov.sso@gov.bc.ca">![Email](./img/email.png)</a>
[2]: https://chat.developer.gov.bc.ca/channel/sso
[3]: https://[mail](mailto:bcgov.sso@gov.bc.ca)[email](mailto:bcgov.sso@gov.bc.ca)
