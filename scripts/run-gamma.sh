#!/bin/bash

node keycloak-delete-no-idplink-users.js --env gamma --realm bceidbasic --auto
node keycloak-delete-no-idplink-users.js --env gamma --realm bceidbusiness --auto
node keycloak-delete-no-idplink-users.js --env gamma --realm bceidboth --auto
node keycloak-delete-no-idplink-users.js --env gamma --realm idir --auto
node keycloak-delete-no-idplink-users.js --env gamma --realm standard --auto

node keycloak-migrate-users.js --base-env prod --base-realm _bceidbasic --target-env gamma --target-realm bceidbasic --auto
node keycloak-migrate-users.js --base-env prod --base-realm _bceidbusiness --target-env gamma --target-realm bceidbusiness --auto
node keycloak-migrate-users.js --base-env prod --base-realm _bceidbasicbusiness --target-env gamma --target-realm bceidboth --auto
node keycloak-migrate-users.js --base-env prod --base-realm idir --target-env gamma --target-realm idir --auto

node keycloak-import-parent-users.js --env gamma --idp bceidbasic --parent-realm idir --target-realm standard --auto
node keycloak-import-parent-users.js --env gamma --idp bceidbusiness --parent-realm idir --target-realm standard --auto
node keycloak-import-parent-users.js --env gamma --idp bceidboth --parent-realm idir --target-realm standard --auto
node keycloak-import-parent-users.js --env gamma --idp idir --parent-realm idir --target-realm standard --auto
