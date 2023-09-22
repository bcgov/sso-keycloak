FROM maven:3.8.2-jdk-11-slim AS builder

COPY ./docker/keycloak/extensions-7.6/ /tmp/
WORKDIR /tmp/
RUN mvn -B clean package --file pom.xml -Dmaven.test.skip=true

# built using https://github.com/keycloak/keycloak-containers/blob/main/server/Dockerfile
FROM keycloak:18.0.2

ENV CONFIGURATION /opt/jboss/keycloak/standalone/configuration

COPY ./docker/keycloak/extensions-7.6/themes/src/main/resources/theme /opt/jboss/keycloak/themes/

# to deploy the archive, drop it into the `standalone/deployments/` directory and it will be automatically loaded.
COPY --from=builder /tmp/services/target/bcgov-services-1.0.0.jar /opt/jboss/keycloak/standalone/deployments/

COPY ./localdev/macs/standalone-ha.xml ${CONFIGURATION}/standalone-ha.xml
