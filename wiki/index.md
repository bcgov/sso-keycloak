# SSO Pathfinder Knowledge Base 
>If you are intending to use the Pathfinder SSO service in order to provide authentication for your application, the SSO Pathfinder Knowledge Base is for you. You are in the right place. 

**>Get started now for your self serve experience to our [common hosted single sign on app](https://bcgov.github.io/sso-requests)**

* [Standard Service](#standard-service)
* [Our Partners](#our-partners)
* [Benefits](#benefits)
* [More on our Standard Service](#more-on-our-standard-service)
* [Limitations](#limitations)
* [History](#history)
* [For Additional Help](https://github.com/bcgov/sso-keycloak/wiki/Additional-Help)
* [Placeholder on Custom Realms](#placeholder-on-custom-realms)

<!-- <p align="center">
  <img width="380" height="300" src="https://user-images.githubusercontent.com/87393930/134059693-3b049537-1f5f-45e4-a31d-f6ab52b0431e.png">
</p>
-->
 <p align="center">
  <img width="380" height="300" src="https://user-images.githubusercontent.com/56739669/230499918-0a0f9454-0bb9-4e32-9582-0b47d435b45c.PNG">
</p>


<br>

<br>

#### *Have any questions? We would love to hear from you.* [![Semantic description of image](https://user-images.githubusercontent.com/87393930/133688357-09f82374-ba18-4402-8089-c0a989dde882.png)][2]   <a href="mailto:bcgov.sso@gov.bc.ca?"><img src="https://user-images.githubusercontent.com/87393930/133690650-b706e658-27bf-4066-92ba-3a7d8a4593ef.png"/></a>



[2]: https://chat.developer.gov.bc.ca/channel/sso
[3]: https://[mail](mailto:bcgov.sso@gov.bc.ca)[email](mailto:bcgov.sso@gov.bc.ca)



## Standard Service

The Pathfinder SSO service (also known as "KeyCloak" or "RedHat SSO") consists of two offerings: Standard and Custom. 

Over the years, we’ve engaged and learned that the majority of our clients can make use of our standard service, so we created the  [Common hosted Single Sign on (CSS) App](https://bcgov.github.io/sso-requests/). It’s a simple way for application development teams to set up login functionality for their app from approved [identity providers](https://github.com/bcgov/sso-keycloak/wiki/Useful-References#identity-provider) over a standard and secure protocol aka to help you obtain the technical details for your login component. Learn more about [onboarding with us here](https://github.com/bcgov/sso-keycloak/wiki/SSO-Onboarding).


## Our Partners

We provide our service with the support of our Identity Provider Partners. An "Identity Provider" is the holder of the identity that is used to log in with. [Learn more about our partners and relevant identity provider information](https://github.com/bcgov/sso-keycloak/wiki/Our-Partners-and-Useful-Information).

Note: It is totally possible for your application to integrate with any or all of the identity providers directly instead of using the Pathfinder SSO service.





## Benefits

Here’s some reasons as to why this might work for your digital product:

- **Easy setup.** We've made this the #1 feature of this service. You can get your DEV, TEST, and PROD instances running against most of the available identity providers right away. The Pathfinder SSO service already has integrations to the following identity providers: 
  - IDIR (BC Common Logon Page) 
      - [Learn about Azure IDIR ](https://github.com/bcgov/sso-keycloak/wiki/Useful-References#azure-idir-and-idir---whats-the-difference)
  - BCeID Basic (BC Common Logon Page) -- Allows login only with BCeID _Basic_
  - BCeID Business (BC Common Logon Page) -- Allows login only with BCeID _Business_
  - BCeID Basic & Business(BC Common Logon Page) -- Allows login with BCeID _Basic_ or BCeID _Business_
  - GitHub associated with BC Gov Org  -- Allows login of GitHub BC Gov Org members 

- **OIDC protocol.** Where certain identity providers (BCeID in particular) support SAML protocol when used directly, Pathfinder SSO brokers the SAML connection and lets you use OIDC instead. OIDC is more common and simpler to set up in modern programming stacks.
- **Session Management.** Some identity providers don't offer advanced session management capabilities.

- **High Availability Requirements.** The Pathfinder SSO service is working on a formal published service level agreements (see [BC Government SSO Service Definition](https://digital.gov.bc.ca/common-components/pathfinder-sso/). This service is available 24/7 with questions and answers addressed during business hours only. [Uptime Monitoring](https://github.com/bcgov/sso-keycloak/wiki/Pathfinder-Uptime-Monitoring)

#### More on our Standard Service

Our standard service makes use of one "standard" realm. When you complete a request in our [common hosted single sign on app](https://bcgov.github.io/sso-requests), you receive a pre-configured client inside an existing realm. 

* If you need authorization ie role based access controls, we allow for client level roles to be created. [Learn more](https://github.com/bcgov/sso-keycloak/wiki/Creating-a-Role)
* [Are you Part of GitHub BC Gov Org](https://github.com/bcgov/sso-keycloak/wiki/Are-you-part-of-the-GitHub-BC-Gov-Org-%3F)
* [Situations where you use our service](https://github.com/bcgov/sso-keycloak/wiki/Using-Your-SSO-Client#usecases)
* [If you need to interact with the CSS App in a RESTful way](https://github.com/bcgov/sso-keycloak/wiki/CSS-API-Account) 
* [CSS APP my Teams](https://github.com/bcgov/sso-keycloak/wiki/CSS-App-My-Teams)
* [CSS APP valid redirect URI Format](https://github.com/bcgov/sso-keycloak/wiki/CSS-App-Valid-Redirect-URI-Format)
* [Gold Migration Q&A](https://github.com/bcgov/sso-keycloak/discussions/categories/gold-q-a)

### Limitations
It is technically possible to integrate directly with the various identity providers instead of using SSO-KEYCLOAK(formerly OCP-SSO). Architectural reasons for direct integration include:


- **High Volume Expectations.** The service is shared by many dozens of applications. If one application starts sending millions of login requests, the service itself can experience service degradation which is felt by all the users of all the applications. Pathfinder SSO is managed on the OpenShift Platform and scales fluidly, but there are limits to the resources it can consume.
- **Unique Configuration Needs.** New customers no longer receive a dedicated realm where they can experiment and invent on top of the platform (see "What's Changed" below). 
- **BC Services Card Integration Requirements.** Because of the high-security nature of the BC Services Card identity and the private information that is available in the context of a login, BCSC is not allowed to be shared between applications. In a dedicated realm the BCSC integration, once approved and configured by IDIM, can be set up. Since we are not offering dedicated realms at this time, teams that need to integrate with BCSC will need to find another solution (see [BC Services Card Integration](https://github.com/bcgov/sso-keycloak/wiki/Our-Partners-and-Useful-Information#bc-service-card-integration) for useful advice).


## Placeholder on Custom Realms 
[Custom Realm ](https://github.com/bcgov/sso-keycloak/wiki/Understanding-the-Difference-Between-Custom-and-Standard-Realms)


## History

### 2022
•	In early 2022, we consulted with teams using our custom service and are working with them to migrate to our new keycloak instance. If you think you need our custom service, please be advised we will ask you a few questions as we do not take provisioning a new custom service lightly. Read more on the way we work with our [Custom Service/Custom Realm community](https://github.com/bcgov/sso-keycloak/wiki/Gold-Custom-Realm-Community-Ways-of-Working)

•	In mid 2022, we moved our services from the Platform Services Silver Openshift cluster to their Gold Openshift cluster. We have mechanism in place for disaster recovery and we are an enterprise service. We ensure that clients in our gold service have their service up 24/7.


### 2021

•	In 2021, we offered clients the ability to integrate with our specially configured standard service. Instead of receiving an entire realm per team, they will receive a pre-configured client inside an existing realm. There is no compromise to the security in this configuration, but it does mean that teams will no longer receive credentials to log on to the KeyCloak server and make changes to their configuration. Changes will be made by the operations team in response to requests for now (we're working on automations to solve this problem). Although this is a compromise in terms of the flexibility of the service, it actually makes setting up simpler and faster for teams.

### 2016-2019

•	Customers were provisioned their very own KeyCloak realm. A realm is like a security zone that is protected from the configuration changes made by other realms. Each team worked in their own realm and was given access to the KeyCloak administration console for their realm where they could make any changes they wanted to. We call this our "custom service".

•	In 2020, the SSO-KEYCLOAK(formerly OCP-SSO) service started to hit maximum capacity for realms in a way that was not possible to mitigate via the usual vertical and horizontal scaling approaches. The KeyCloak product was not designed to handle an unlimited number of realms and we managed to find the limit (unfortunately!)


--------------------



