# Overview

This is a folder for testing themes and services locally with podman-compose. Podman commands can be replaced with docker compose using the same syntax. It is currently setup to test the 7.6 extension.

## Setup

Ensure you have mvn installed to recompile.

Run `podman-compose up`.

This will run the build of the [7.6 extensions](../docker/keycloak/extensions-7.6/) locally. The dockerfile is altered to disable theme caching for easier theme development, and use a compiled .jar file mounted as a volume. If working with themes, you can update them diretly now. If you are working with the java code, you will need the following to recompile:
- `mvn -B clean package --file ../docker/keycloak/extensions-7.6`
- `../docker/keycloak/extensions-7.6/services/target/bcgov-services-1.0.0.jar .`

If you would like to recompile on the fly, you can run ./local.sh in a terminal window, which will watch for file changes and run the above for you.

**Modules**
If you would like to add realm configuration to mimic our environments, run the local setup from sso-terraform-modules repo. Note that this is also useful for quickly finding our current configurations for authentication flows and mappers by searching for the relevant id.
