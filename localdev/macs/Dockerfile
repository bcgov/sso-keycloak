FROM maven:3.8.5-openjdk-17-slim AS extensions-builder

COPY ./docker/keycloak/extensions-24/ /tmp/
WORKDIR /tmp/
RUN mvn -B clean package --file pom.xml -Dmaven.test.skip=true

# built using https://github.com/keycloak/keycloak-containers/blob/main/server/Dockerfile
FROM keycloak:24.0.5

ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true
ENV KC_DB=postgres

COPY --from=extensions-builder /tmp/services/target/bcgov-services-1.0.0.jar /opt/keycloak/providers/

COPY ./docker/keycloak/extensions-24/themes/src/main/resources/theme /opt/keycloak/themes/

RUN /opt/keycloak/bin/kc.sh build

WORKDIR /opt/keycloak

COPY ./docker/keycloak/configuration/24/quarkus.properties /opt/keycloak/conf

COPY ./docker/keycloak/configuration/24/keycloak-default-user-profile.json /tmp

# change these values to point to a running postgres instance
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
