
# Gold Service Uptime
* [Keycloak End User uptime aka can a keycloak user log in to the Gold Service? ](https://uptime.com/s/bcgov-sso-gold/1391032)
* [Keycloak Service Uptime aka is the Gold Keycloak service up?](https://uptime.com/s/bcgov-sso-gold/1389409)
* [Keycloak SSO Prod & IDIR Service Uptime aka can an IDIR user log into the Gold Service?](https://uptime.com/s/bcgov-sso-gold/1391029)
## DNS Checks 
If one these DNS checks fails while the other uptime checks pass for an environment, then the app may be running in Disaster Recovery mode.
* [Dev DNS Check aka DNS Dev Passes if dev.loginproxy.gov.bc.ca points to the Gold Cluster ](https://uptime.com/statuspage/bcgov-sso-gold/1719406)
* [Test DNS Check aka DNS Test Passes if test.loginproxy.gov.bc.ca points to the Gold Cluster ](https://uptime.com/statuspage/bcgov-sso-gold/1719409)
* [Prod DNS Check aka DNS Prod Passes if loginproxy.gov.bc.ca points to the Gold Cluster ](https://uptime.com/statuspage/bcgov-sso-gold/1581586)

[Full Listing of Uptime Monitoring](https://uptime.com/s/bcgov-sso-gold)

[Our Service Level](https://github.com/bcgov/sso-keycloak/wiki/Alerts-and-Us#service-levels)


# Situations when we go into Business Continuity Mode

## Openshift Upgrade.

We know in advance the week Gold work will happen. Will notify community members in Rocketchat on what to expect. If during this upgrade, there is a need to cut over to our Fail Over site, we will send an email communication blast

## Incident on Gold

Going from our primary to fail over is something we are prepared for. You can expect us to send an email commuincation blast as well as updates in the appropriate rocketchat channels on our progress. 


## Example Messaging

1. The Gold Keycloak _environment_  instance is in the process of failing over to the DR cluster

* The CSS APP is being put in Maintenance mode. Please check our [Uptime](https://uptime.com/statuspage/bcgov-sso-gold) before using our service.

2. The Gold Keycloak  _environment_  instance has failed over to the DR cluster

* DR deployment is complete, end users continue to login to your apps using the Pathfinder SSO Service (standard or custom).
* Any changes made to a project's config using the Pathfinder SSO Service (standard or custom realm) while the app is in its failover state will be lost when the app is restored to the Primary cluster. (aka your config changes will be lost).
* The priority of this service is to maximize availability to the end users and automation.

3. The Gold Keycloak  _environment_  instance has been restored to the Primary cluster (aka back to normal).

* We are be back to normal operations of the Pathfinder SSO Service (standard and custom).
* Changes made to a project's config using the Pathfinder SSO Service (standard or custom realm) during Disaster Recovery will be missing.
* The priority of this service is to maximize availability to the end users and automation.