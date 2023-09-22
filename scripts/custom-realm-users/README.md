# Script to migrate users from custom realm in silver cluster to a custom realm in gold

## Pre-requisites

- Request a custom realm by creating an issue [here](https://github.com/bcgov/sso-keycloak/issues/new?assignees=tzhang200%2Czsamji&labels=gold%2Ccustom&template=silver-custom-gold-custom-request.yml&title=%5BGold+Custom%5D%3A+)

- Create an integration request [here](https://bcgov.github.io/sso-requests) to access idps of your choice

- After your custom realm is approved, follow this [guide](https://stackoverflow.developer.gov.bc.ca/questions/864/891) to add required idps to your realm

- Create `admin user account` or a `service account` in your silver and gold custom realms which need to have permissions to manage realm. If using service account, then navigate to `role-mapping` tab and choose client `realm-management` and assign required permissions. If using an user account then set a password and add the user to `Realm Administrator` group

- Create `.env` from `.env.example` and update your service account or admin user credentials for connecting to your silver and gold custom realms in the script root directory

- Optional: If the `idir` or `bceid` users in your custom realm in silver do not have respective `idir_userid` and `bceid_userid`, the users cannot be migrated. In this case do reach out to SSO team to fetch those `userids` before starting the migration

- Optional: If you are trying to migrate `github` users, you would need a github personal access token (PAT) that has permissions to read `users profile data`

## Steps to run the script

### Install the dependencies

```sh
yarn install
```

### Run the migration script

#### Checks before running the script:

- Please have your idps created in your custom realm
- Ensure `kc_idp_hint` query param is passed to the `authorization_url` of your idp

```sh
cd ./scripts/custom-realm-users

export SSO_SILVER_ENVIRONMENT=
export SSO_GOLD_ENVIRONMENT=
export SSO_SILVER_REALM=
export SSO_GOLD_REALM=

node script --base-env=$SSO_SILVER_ENVIRONMENT --base-realm=$SSO_SILVER_REALM --target-env=$SSO_GOLD_ENVIRONMENT --target-realm=$SSO_GOLD_REALM
```

## References

- [Setup IDPs in your custom realm](https://stackoverflow.developer.gov.bc.ca/questions/864)
- [Migrating users](https://stackoverflow.developer.gov.bc.ca/questions/915)
- [IDIR Username format](https://github.com/bcgov/sso-keycloak/discussions/138)
