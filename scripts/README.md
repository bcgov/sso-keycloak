# Scripts

Scripts to manage Keycloak realms and configurations

## Use Cases

1. Create a custom realm

   - usage

   ```sh
   node keycloak-create-realm.js --env <env> --realm <realm> [--totp <totp>]
   ```

   - examples

   ```sh
   node keycloak-create-realm.js --env dev --realm qerasdf
   node keycloak-create-realm.js --env prod --realm qerasdf --totp 123456
   ```

1. Delete a custom realm

   - usage

   ```sh
   node keycloak-delete-realm.js --env <env> --realm <realm> [--totp <totp>]
   ```

   - examples

   ```sh
   node keycloak-delete-realm.js --env dev --realm qerasdf
   node keycloak-delete-realm.js --env prod --realm qerasdf --totp 123456
   ```

1. Create an IDP in a custom realm
1. Delete an IDP in a custom realm
