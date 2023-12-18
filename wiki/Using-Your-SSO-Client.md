## Using your SSO Client

You can get started by making a request in our Common Hosted Single Sign On application.<embed link>. A few things to consider before making a request

1. The names of your product owner and technical contact
2. Someone on your team who knows about OpenID connect. You can learn here too [OIDC Explained by Pathfinder SSO](https://www.youtube.com/playlist?list=PL9CV_8JBQHirMRjBk62jeYUE_MpE4unU8)
3.  rough idea on the identity provider (IDIR or BCeID) that you want to use. Learn more here [Our Partners](Our-Partners:-the-Identity-Providers#what-are-identity-providers)
4. There are some parts of the request where you may need to work with your developer/technical contact:

 a. Which usecase/scenario do you need a request for?
 b. Client type - do you want public or confidential?
 c. which environments and test accounts?
 d. redirects

5. Through the request process, you will get a few emails updating you on the process.
6. When the request is complete, you can log in to access your installation json file. Your developer/technical contact will take the details in this file and make use of the details within your application code.

 a. [GitHub - bcgov/keycloak-example-apps: Example applications for integrating with keycloak ](https://github.com/bcgov/keycloak-example-apps/tree/dev)
 b. You can use roles to enable access to specific pages or data to only those users who connect, with efficiency, data security and simplicity under consideration. [Learn more](Creating-a-Role)
 c. TLDR: here’s the [video](https://user-images.githubusercontent.com/56739669/231529538-0e1efa5a-51df-401a-99c2-dbc964e8cac6.mp4)

7. Here is a link to our [developer/technical documentation](https://bcgov.github.io/sso-docs/)



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



<p align="center">
  <img width="300" height="300" src="https://user-images.githubusercontent.com/87393930/133833777-8b99fa68-4893-4d72-b5ed-32c8e8692e7d.png">
</p>

---
