locals {
  idp_public_attrs = ["display_name", "bceid_user_guid"]
}

resource "keycloak_openid_client" "standard" {
  realm_id = keycloak_realm.this.id

  client_id = var.standard_realm_name
  name      = var.standard_realm_name

  enabled                      = true
  standard_flow_enabled        = true
  implicit_flow_enabled        = false
  direct_access_grants_enabled = false
  service_accounts_enabled     = false

  access_type = "CONFIDENTIAL"

  valid_redirect_uris = ["${var.keycloak_url}/auth/realms/${var.standard_realm_name}/broker/${var.realm_name}/endpoint"]
  web_origins         = []
}

resource "keycloak_generic_client_protocol_mapper" "client_standard_mappers" {
  for_each = toset(local.idp_public_attrs)

  realm_id  = keycloak_realm.this.id
  client_id = keycloak_openid_client.standard.id

  name            = each.key
  protocol        = "openid-connect"
  protocol_mapper = "oidc-usermodel-attribute-mapper"
  config = {
    "user.attribute" : each.key,
    "claim.name" : each.key,
    "jsonType.label" : "String",
    "id.token.claim" : "true",
    "access.token.claim" : "true",
    "userinfo.token.claim" : "true"
  }
}

resource "keycloak_openid_client_default_scopes" "client_standard_default_scopes" {
  realm_id  = keycloak_realm.this.id
  client_id = keycloak_openid_client.standard.id

  default_scopes = [
    "profile",
    "email",
    keycloak_openid_client_scope.idp_scope.name,
  ]
}
