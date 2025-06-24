FROM maven:3.9.9-eclipse-temurin-21 AS extensions-builder

COPY ./docker/keycloak/extensions-26 /tmp/
WORKDIR /tmp/
RUN mvn -B clean package --file pom.xml -Dmaven.test.skip=true

FROM registry.redhat.io/rhbk/keycloak-rhel9:26.0-3 AS builder

# Enable health and metrics support
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# Configure a database vendor
ENV KC_DB=postgres

COPY --from=extensions-builder /tmp/services/target/bcgov-services-1.0.0.jar /opt/keycloak/providers/

WORKDIR /opt/keycloak

# copy the theme directory to `/opt/keycloak/themes/` for now, but we can consider to archive to be deployed later.
COPY ./docker/keycloak/extensions-26/themes/src/main/resources/theme /opt/keycloak/themes/

COPY ./docker/keycloak/configuration/26/quarkus.properties /opt/keycloak/conf

COPY ./docker/keycloak/configuration/26/keycloak-default-user-profile.json /tmp

RUN /opt/keycloak/bin/kc.sh build

# change these values to point to a running postgres instance
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
