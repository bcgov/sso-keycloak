# Setup

- Keycloak images built using arm64 processors does not exist to we need to build a base image
- Build base keycloak image

  ```
  export KC_VERSION=18.0.2

  git clone https://github.com/keycloak/keycloak-containers.git

  git checkout ${KC_VERSION}

  docker build -f ./server/Dockerfile -t keycloak:${KC_VERSION} .
  ```

- Build new keycloak image with custom extensions and themes from root of the `sso-keycloak` repository

  ```
  docker build -t sso-keycloak:${KC_VERSION} -f ./localdev/macs/Dockerfile . --no-cache

  docker-compose -f ./localdev/macs/docker-compose.yml up -d
  ```
