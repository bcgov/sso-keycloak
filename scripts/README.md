# Scripts

Scripts to manage Keycloak realms and configurations

## Directories

- `base-objects`: base Keycloak object data
- `client-mappers`: in IDP realms, client mappers for the clients associated with custom realms
- `idp-mappers`: in custom realms, mappers for the target IDPs
- `meta`: metadata used for Keycloak scripts

## Environment Vairables

- It requires setting the corresponding environment variables after copying `.env.example` to `.env`.
- The request `grant_type` is determined based on the existence of `client_secret` and
  the `client_secret` is required if the target `client`'s `access_type` is `confidential`,
  otherwise, `username` and `password` are required to access the client.

  - `<ENV>_KEYCLOAK_CLIENT_ID`: The client_id for the Keycloak client in Master Realm
  - `<ENV>_KEYCLOAK_CLIENT_SECRET`: The client_secret for the Keycloak client in Master Realm
  - `<ENV>_KEYCLOAK_URL`: The URL of the Keycloak instance
  - `<ENV>_KEYCLOAK_USERNAME`: The username of the user used by the provider for authentication via the password grant
  - `<ENV>_KEYCLOAK_PASSWORD`: The password of the user used by the provider for authentication via the password grant

## Use Cases

- Create a custom realm

  - Workflow

    1.  Check if the realm name already exists
    1.  Create the realm

  - Usage

    ```sh
    node keycloak-create-realm.js --env <env> --realm <realm> [--totp <totp>]
    ```

  - Examples

    ```sh
    node keycloak-create-realm.js --env dev --realm qerasdf
    node keycloak-create-realm.js --env prod --realm qerasdf --totp 123456
    ```

- Delete a custom realm

  **WARNING: This is almost impossible to revert. Before deleting a custom realm, deactivate it in the dev test an and prod environments for a few days as a final safeguard to make sure it's not in use by other projects.**

  - Workflow

    1.  Find all IDPs associated with this realm
    1.  Delete the IDP clients
    1.  Delete the realm

  - Usage

    ```sh
    node keycloak-delete-realm.js --env <env> --realm <realm> [--totp <totp>]
    ```

  - Examples

    ```sh
    node keycloak-delete-realm.js --env dev --realm qerasdf
    node keycloak-delete-realm.js --env prod --realm qerasdf --totp 123456
    ```

- Link IDP to a custom realm

  - Workflow

    1.  Check if the idp name already exists
    1.  Create a confidential client in the idp realm to use for the target realm's IDP connection
    1.  Create the idp
    1.  Create IDP mappers

  - Usage

    ```sh
    node keycloak-link-idp.js --env <env> --realm <realm> --idp <idp> [--totp <totp>]
    ```

  - Examples

    ```sh
    node keycloak-link-idp.js --env dev --realm qerasdf --idp idir
    node keycloak-link-idp.js --env prod --realm qerasdf --idp bceid-basic-and-business --totp 123456
    ```

- Unlink IDP from a custom realm

  - Workflow

    1.  Check if the idp name exists
    1.  Delete the idp from the target realm
    1.  Delete the idp client from the idp realm

  - Usage

    ```sh
    node keycloak-unlink-idp.js --env <env> --realm <realm> --idp <idp> [--totp <totp>]
    ```

  - Examples

    ```sh
    node keycloak-unlink-idp.js --env dev --realm qerasdf --idp idir
    node keycloak-unlink-idp.js --env prod --realm qerasdf --idp bceid-basic-and-business --totp 123456
    ```
