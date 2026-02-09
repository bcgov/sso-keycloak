FROM eclipse-temurin:21

RUN apt-get update \
  && apt-get install -y wget tar gzip bash jq uuid-runtime curl

ENV KEYCLOAK_BENCHMARK_VERSION=keycloak-benchmark-26.4.0-SNAPSHOT

# Set working directory
WORKDIR /app

RUN wget https://github.com/keycloak/keycloak-benchmark/releases/download/26.4.0-SNAPSHOT/${KEYCLOAK_BENCHMARK_VERSION}.tar.gz

# Extract the archive
RUN tar -xzf ${KEYCLOAK_BENCHMARK_VERSION}.tar.gz

RUN rm ${KEYCLOAK_BENCHMARK_VERSION}.tar.gz

RUN chmod +x /app/${KEYCLOAK_BENCHMARK_VERSION}/bin/*.sh

RUN chmod -R 777 /app/${KEYCLOAK_BENCHMARK_VERSION}

WORKDIR /app/${KEYCLOAK_BENCHMARK_VERSION}

COPY ./entrypoint.sh ./

RUN chmod +x /app/${KEYCLOAK_BENCHMARK_VERSION}/entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
