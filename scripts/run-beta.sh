#!/bin/bash

node keycloak-delete-no-idplink-users.js --env beta --realm bceidbasic --auto
node keycloak-delete-no-idplink-users.js --env beta --realm bceidbusiness --auto
node keycloak-delete-no-idplink-users.js --env beta --realm bceidboth --auto
node keycloak-delete-no-idplink-users.js --env beta --realm idir --auto
node keycloak-delete-no-idplink-users.js --env beta --realm standard --auto

node keycloak-migrate-users.js --base-env test --base-realm _bceidbasic --target-env beta --target-realm bceidbasic --auto
node keycloak-migrate-users.js --base-env test --base-realm _bceidbusiness --target-env beta --target-realm bceidbusiness --auto
node keycloak-migrate-users.js --base-env test --base-realm _bceidbasicbusiness --target-env beta --target-realm bceidboth --auto
node keycloak-migrate-users.js --base-env test --base-realm idir --target-env beta --target-realm idir --auto

node keycloak-import-parent-users.js --env beta --idp bceidbasic --parent-realm idir --target-realm standard --auto
node keycloak-import-parent-users.js --env beta --idp bceidbusiness --parent-realm idir --target-realm standard --auto
node keycloak-import-parent-users.js --env beta --idp bceidboth --parent-realm idir --target-realm standard --auto
node keycloak-import-parent-users.js --env beta --idp idir --parent-realm idir --target-realm standard --auto
