# What is keycloak?
Keycloak is an open source Identity and Access Management solution aimed at modern applications and services. It makes it easy to secure applications and services with little to no code. [Keycloak - About](https://www.keycloak.org/)

In BC Government, the Pathfinder SSO Keycloak server acts as an Open ID Connect [OIDC](https://openid.net/connect/) based Identity Provider, mediating with an enterprise user directory or 3rd-party SSO providers for identity information and applications via standards-based tokens and identity assertions.
![Service Overview](./img/css-overview.png)

## As a digital delivery team, what do i need to know about Keycloak?

Keycloak is organized by _realms_ which manages discrete sets of users that are logically isolated from one another and provides a linkage between the client application and a BC Government Identity Provider.

BC Pathfinder SSO Clients are configured to be part of a Standard Realm where certain realm parameters can be configured by clients and users can only authenticate to the realm in which they belong.

## Why a Standard Realm?
The KeyCloak product was not designed to handle an unlimited number of realms and we managed to find the limit (unfortunately!).

New customers will now be added to one of the specially configured standard realms to help us continue to offer this great common component.

![Standard vs Custom Realm](./img/standard-vs-custom.png){: style="width:65%;height:50%"}

![Standard vs Custom Realm](./img/standard-realm.png){: style="width:65%;height:50%"}


## Why a Custom Realm?
![Standard vs Custom Realm](./img/custom-realm.png){: style="width:65%;height:50%"}

# Authentication vs Authorization
[Useful terms can be found here](https://github.com/bcgov/sso-keycloak/wiki/Useful-References#intro-to-terms)


# Learn More
The Pathfinder SSO service is build on the foundations of Keycloak /Redhat SSO.

* [Request an integration](https://bcgov.github.io/sso-requests/)
* [An overview of our CSS App](index)
* [Additional References](Useful-References)
