#!/bin/bash

node keycloak-delete-no-idplink-users.js --env alpha --realm bceidbasic --auto
node keycloak-delete-no-idplink-users.js --env alpha --realm bceidbusiness --auto
node keycloak-delete-no-idplink-users.js --env alpha --realm bceidboth --auto
node keycloak-delete-no-idplink-users.js --env alpha --realm idir --auto
node keycloak-delete-no-idplink-users.js --env alpha --realm standard --auto

node keycloak-migrate-users.js --base-env dev --base-realm _bceidbasic --target-env alpha --target-realm bceidbasic --auto
node keycloak-migrate-users.js --base-env dev --base-realm _bceidbusiness --target-env alpha --target-realm bceidbusiness --auto
node keycloak-migrate-users.js --base-env dev --base-realm _bceidbasicbusiness --target-env alpha --target-realm bceidboth --auto
node keycloak-migrate-users.js --base-env dev --base-realm idir --target-env alpha --target-realm idir --auto

node keycloak-import-parent-users.js --env alpha --idp bceidbasic --parent-realm idir --target-realm standard --auto
node keycloak-import-parent-users.js --env alpha --idp bceidbusiness --parent-realm idir --target-realm standard --auto
node keycloak-import-parent-users.js --env alpha --idp bceidboth --parent-realm idir --target-realm standard --auto
node keycloak-import-parent-users.js --env alpha --idp idir --parent-realm idir --target-realm standard --auto
