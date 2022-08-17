# How to modify the keycloak config file for more detailed logs.

There are two areas of the keycloak config that users can modify to generate more detailed logs.  The first is the log level, the second involves configuring the `RequestDumping handler`.

## Where and how to configure log output.

The keycloak configuration can be located in the [configuration folder](../docker/keycloak/configuration). Presently it is part of the image we deploy, meaning the image needs to be rebuilt before the logging change can take effect.  For testing purposes, there is a keycloak deployment that allows users to edit the config in openshift and preview the effect by restarting the keycloak pod. Without the need to rebuild the image.

The test instance config is `sso-keycloak-4-sso-config` found in the `b861c7-test` namespace and is the associated with the `sso-keycloak-4` deployment. Making changes to the config will only be reflected in the `sso-keycloak-4` app after restarting the `sso-keyclaok-4` pod. (Note this config is valid as of Aug 17 2022, the configuration may change as the product is under development.)

Note this keycloak instance is used as a test environment for the CSS app's Gold-dev integrations.  So taking it offline for config changes may effect other developers' tests.

## Log Levels

The log levels for keycloak are documented [here](https://www.keycloak.org/server/logging).

When working with the root-logger, the highest level of logging that still allows keycloak to start is `DEBUG`.  Attempting to use `TRACE` or `ALL` leads to the app being unable to get into a healthy state.  The xml block we modify to increase or decrease the root-logging is:

```
            <root-logger>
                <level name="INFO" />
                <handlers>
                    <handler name="CONSOLE" />
                </handlers>
            </root-logger>
```

`DEBUG` logging provides enough detail to see the incoming responses.  Letting the logs display a returned SAML payload. However, it won't log the outgoing requests. If `DEBUG` does not generate the logs you require look into Request Dumping.

## Request Dumping

**Warning: do not use this in a production environment.  It can expose sensitive information.**

Request dumping is documented [here](https://access.redhat.com/solutions/2429371). It will require a redhat account to view. General documentation can be found [here](https://access.redhat.com/documentation/en-us/red_hat_jboss_enterprise_application_platform/7.2/html/configuration_guide/configuring_the_web_server_undertow#undertow-config-requestDumping-handler).

Instead of using the JBoss EAP Cli tool.  We manually modify our config.  Adding the request dumping requires 4 lines added to our existing config.  Note there is pre-existing subsystem for `jboss:undertow` configured.:

```
 <subsystem xmlns="urn:jboss:domain:undertow:12.0" ... >
    <server name="default-server">
        ...
        <host name="default-host" alias="localhost">
            ...
            <filter-ref name="requestDumperExpression"/>
        </host>
    </server>
    ...
    <filters>
        <expression-filter name="requestDumperExpression" expression="dump-request"/>
    </filters>
</subsystem>
```

This configuration will output the requests and responses in the format:

```
----------------------------REQUEST---------------------------
            URI=...
            ...
--------------------------RESPONSE--------------------------
    contentLength= ...
    contentType= ...
==============================================================
```

To access these logs, navigate to the keycloak pod logs in the openshift cluster.  It should be possible to query them using Kibana.

When the desired logging is done, it is a good practice to turn off the request dumping as it can expose sensitive content.


## Troubleshooting

If we are loging the request and responses of a SAML IDP. It is nessary to ensure the SPID is correct in the keycloak deployment. (Check <realm of interest>/Identity Providers/<idp of interest>/Service Provider Entity ID).
