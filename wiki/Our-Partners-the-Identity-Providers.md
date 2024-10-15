
## Our Partners
We provide our service with the support of our Identity Provider Partners. An "Identity Provider" is the holder of the identity that is used to log in with. Learn more about our partners and relevant identity provider information.

Your technical team may need to know the identity provider attributes provided, [please visit here to learn more on what we get from our Identity Partners](https://github.com/bcgov/sso-keycloak/wiki/Identity-Provider-Attribute-Mapping)


## What are Identity Providers?

[Identity providers](Useful-References#identity-provider) are directories of user accounts with details about those users, called attributes. The ones available to Pathfinder SSO Clients are:
- **IDIR:** IDIR accounts are given to individuals who work for the B.C. government. Please note, your end users must have an IDIR account which can make use of one of the two ways to login based on your application needs:
  - **IDIR**
    * User Experience: use an IDIR username and password for logging in.
    * Architecture/Developer note: The authentication mechanisim via siteminder.
  - **IDIR with MFA**
    * User Experience: IDIR account with the added the benefit of MFA (multi-factor authentication). i.e use an IDIR username, password and mfa for logging in.
    * Architecture/Developer note: It is a step up security-wise from regular IDIR. The authentication mechanism is azure cloud [More on MFA registration](https://intranet.gov.bc.ca/thehub/ocio/ocio-enterprise-services/information-security-branch/information-security-mfa/mfa-registration)

- **BCeID** BCeID Accounts enable people to access government services using a single identifier and password.[More on BCeID ](https://www2.gov.bc.ca/gov/content/governments/services-for-government/information-management-technology/identity-and-authentication-services/bceid-authentication-service)

- **BCSC (BC Services Card)**	The BC Services Card provides access to government services for B.C. residents [More on BC Services Card App](https://www2.gov.bc.ca/gov/content/governments/government-id/bcservicescardapp)

- **Digital Credential**	Digital credentials are the digital equivalents of things like licenses, identities and permits. Use them for secure access, streamlined service delivery, and more. Learn more about [how digital credentials can improve your service](https://digital.gov.bc.ca/digital-trust/about/what-are-digital-credentials/)


- **GitHub associated with BC Gov Org**	 Allows login of GitHub BC Gov Org member. At the time of writing, production approval for this requires you to obtain an exemption to the IM/IT standards. [IM/IT Standards Frequently Asked Questions](https://www2.gov.bc.ca/gov/content/governments/services-for-government/policies-procedures/im-it-standards/im-it-standards-faqs)


Many times, our clients ask, which identity provider should we use for our product. We can't really make that decision for you and with our partners, can refer you to a few helpful links

* [Consistent wording and descriptions](https://www2.gov.bc.ca/gov/content/governments/services-for-government/information-management-technology/identity-and-authentication-services/login-best-practices/language-consistency)

*  [Identity providers comparison page](https://www2.gov.bc.ca/gov/content/governments/services-for-government/information-management-technology/id-services/compare-people)

## IDIR with MFA
We offer integrations with IDIR with the benefit of MFA (multi-factor authentication). This is a step up security-wise from regular IDIR.

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

*BC Services Card provides an Open ID Connect authentication server. Stay tuned as we hope to offer this in our standard service <ul><li><a href={"https://github.com/bcgov-c/pathfinder-sso-docs/discussions/26S"}>CSS App</a></li></ul></> in Autumn 2024.

The IDIM team that manages BCSC integration is responsible for safeguarding the personal information that is available in a login context. They have a business requirement that integrations to BCSC cannot be shared without IDIM approval.

---------------------------------

### Options for Teams with BCSC Requirements

??? info "Join an Existing Dedicated Custom Realm"
    With approval from IDIM, it is possible to join an existing realm that shares the same security context as your application and already has BCSC set up. This generally means that the existing clients are all from the same ministry or sector and have the same requirements for personal information through the login process.

    There are very few instances of this pattern at this time, but it is an option that is possible with the help and approval of IDIM.

    Be that as it may, if there is a closely related project in your ministry or sector that you think would be a candidate for sharing a BCSC integration, you may wish to start the conversation with IDIM and see if it makes sense for your situation.

??? info "Integrate Directly with BCSC"

    You can now integrate with our Standard Service and BC Services Card. Please follow the steps in the Common Hosted Single Sign On App <<https://bcgov.github.io/sso-requests>>. 
    If your ministry/sector is not available, please reach out the IDIM Consulting team as they will help you get sorted.

??? info "Configure and Manage Your Own Dedicated KeyCloak Server"

    KeyCloak runs on JBoss quite happily in a Docker container with a PostgreSQL backend. If you really need features provided by KeyCloak and you want to integrate with BCSC, it's possible to run your own KeyCloak server and configure your connection to BCSC by setting up your own OIDC IDP.

<p align="center" markdown>
  ![Services Card](./img/services-card.png)
</p>

----------------------------
#### *Have any questions? We would love to hear from you.* [![Chat Bubble](./img/chat-bubble.png)][2]   <a href="mailto:bcgov.sso@gov.bc.ca">![Email](./img/email.png)</a>
[2]: https://chat.developer.gov.bc.ca/channel/sso
[3]: https://[mail](mailto:bcgov.sso@gov.bc.ca)[email](mailto:bcgov.sso@gov.bc.ca)
