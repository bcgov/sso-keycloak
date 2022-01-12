locals {
  idp_public_attrs = tomap({
    "${local.idir_idp_name}"          = ["display_name", "idir_user_guid", "idir_username"],
    "${local.azureidir_idp_name}"     = ["display_name", "idir_user_guid", "idir_username"],
    "${local.bceidbasic_idp_name}"    = ["display_name", "bceid_user_guid"],
    "${local.bceidbusiness_idp_name}" = ["display_name", "bceid_user_guid", "bceid_user_name", "bceid_business_guid", "bceid_business_name"],
    "${local.bceidboth_idp_name}"     = ["display_name", "bceid_user_guid", "bceid_user_name", "bceid_business_guid", "bceid_business_name"],
  })

  idp_names = keys(local.idp_public_attrs)

  all_idp_public_attrs = distinct(flatten([
    for idp in local.idp_names : [
      for attr in local.idp_public_attrs[idp] : {
        attr = attr
        idp  = idp
      }
    ]
  ]))
}

resource "keycloak_openid_client" "idp_clients" {
  for_each = toset(local.idp_names)

  realm_id = keycloak_realm.this.id

  client_id = "${var.standard_realm_name}_${each.key}"
  name      = "${var.standard_realm_name}_${each.key}"

  enabled                      = true
  standard_flow_enabled        = true
  implicit_flow_enabled        = false
  direct_access_grants_enabled = false
  service_accounts_enabled     = false

  access_type   = "CONFIDENTIAL"
  client_secret = "<UPDATE_ME>"

  valid_redirect_uris = ["http://${var.keycloak_url}/auth/realms/${var.standard_realm_name}/broker/${each.key}/endpoint"]
  web_origins         = []

  authentication_flow_binding_overrides {
    browser_id = module.idp_auth_flow.flow_id
    # direct_grant_id =
  }
}

resource "keycloak_generic_client_protocol_mapper" "idp_client_attribute_mappers" {
  for_each = { for entry in local.all_idp_public_attrs : "${entry.idp}.${entry.attr}" => entry }

  realm_id  = keycloak_realm.this.id
  client_id = keycloak_openid_client.idp_clients[each.value.idp].id

  name            = each.value.attr
  protocol        = "openid-connect"
  protocol_mapper = "oidc-usermodel-attribute-mapper"
  config = {
    "user.attribute" : each.value.attr,
    "claim.name" : each.value.attr,
    "jsonType.label" : "String",
    "id.token.claim" : "true",
    "access.token.claim" : "true",
    "userinfo.token.claim" : "true"
  }
}

resource "keycloak_openid_client_scope" "idp_client_scopes" {
  for_each = toset(local.idp_names)

  realm_id               = keycloak_realm.this.id
  name                   = each.key
  description            = "${each.key} idp client scope"
  include_in_token_scope = false
}

resource "keycloak_openid_client_default_scopes" "idp_client_default_scopes" {
  for_each = toset(local.idp_names)

  realm_id  = keycloak_realm.this.id
  client_id = keycloak_openid_client.idp_clients[each.key].id

  default_scopes = [
    "profile",
    "email",
    keycloak_openid_client_scope.idp_client_scopes[each.key].name,
  ]
}
