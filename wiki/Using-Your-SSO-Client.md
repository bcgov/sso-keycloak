You can get started by making a request in our Common Hosted Single Sign On application.<embed link>. A few things to consider before making a request

1. The names of your product owner and technical contact
2. Someone on your team who knows about OpenID connect. You can learn here too [OIDC Explained by Pathfinder SSO](https://www.youtube.com/playlist?list=PL9CV_8JBQHirMRjBk62jeYUE_MpE4unU8)
3.  rough idea on the identity provider (IDIR or BCeID) that you want to use. Learn more here [Our Partners and Useful Information](https://github.com/bcgov/sso-keycloak/wiki/Our-Partners-and-Useful-Information#what-are-identity-providers)
4. There are some parts of the request where you may need to work with your developer/technical contact:
 a. Which usecase/scenario do you need a request for 
 b. Client type - do you want public or confidential
 c. which environments and test accounts?
 d. redirects
5. Through the request process, you will get a few emails updating you on the process.
6. When the request is complete, you can log in to access your installation json file. Your developer/technical contact will take the details in this file and make use of the details within your application code.
 a. [GitHub - bcgov/keycloak-example-apps: Example applications for integrating with keycloak ](https://github.com/bcgov/keycloak-example-apps/tree/dev)
 b. You can use roles to enable access to specific pages or data to only those users who connect, with efficiency, data security and simplicity under consideration. [Learn more](https://github.com/bcgov/sso-keycloak/wiki/Creating-a-Role)
 c. TLDR: here’s the [video](https://user-images.githubusercontent.com/56739669/231529538-0e1efa5a-51df-401a-99c2-dbc964e8cac6.mp4)
7. Here is a link to our [developer/technical documentation](https://bcgov.github.io/sso-docs/)


##  Some more details
- [Introduction to key concepts and terms (newbie guide)](#Introduction-to-key-concepts-and-terms)
- [Openshift Clusters](#openshift-clusters)
  - [RedHat SSO Version](#redhat-sso-version)
- [Environments and Accounts](#Environments-and-accounts)
  - [IDIR & GitHub Accounts](https://github.com/bcgov/sso-keycloak/wiki/Using-Your-SSO-Client#idir--github-accounts)
  - [BCeID Accounts](#bceid-accounts)

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


#### Usecases

**Browser Login** - A web based application requiring a login component

**Service Account** - A service account is a digital identity used by an application software or service to interact with other applications or the operating system. They are often used for machine to machine communication (M2M), for example for application programming interfaces (API).

**Browser Login and Service Account** - A combination of the above


#### Specifying an IDP to bypass the Keycloak login page

If there is more than one IDP in the realm, the Keycloak server directs your users into a login page to let them choose the IDP that they want to authenticate with. It is possible to skip the login page or override the default IDP in Keycloak by passing the optional query param" kc_idp_hint". [List of kc_idp_hints here](https://github.com/bcgov/sso-keycloak/wiki/Using-Your-SSO-Client#do-skip-the-keycloak-login-page)

- If using an adapter, there is an option for providing `idpHint`, and
- if not, please specify it in the `Authorization URL` in your code or configuration, i.e. `http://localhost:8080/auth?kc_idp_hint=<idp_name>`
- Please see [here](https://www.keycloak.org/docs/latest/server_admin/index.html#_client_suggested_idp) for more detail.

If the framework you are using prevents you from being able to pass through the _IDP hint_, please reach out to our team through rocket chat or email to ask about alternative options.

#
### CSS API

Through our engagements with our clients, we listened to your request to have an api so your apps can connect to our CSS App. Please go to [CSS API Account](https://github.com/bcgov/sso-keycloak/wiki/CSS-API-Account) of our wiki to learn more.

Note: Often times, you do not want to be the only person with access to your client details or you may want to create multiple clients. If this the case, please visit [CSS App and My Teams](https://github.com/bcgov/sso-keycloak/wiki/CSS-App-My-Teams) for more info on Team Admins and Team Members



<p align="center">
  <img width="300" height="300" src="https://user-images.githubusercontent.com/87393930/133833777-8b99fa68-4893-4d72-b5ed-32c8e8692e7d.png">
</p>

---
