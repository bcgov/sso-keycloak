locals {
  idp_names = [
    var.idir_realm_name,
    var.azureidir_realm_name,
    var.bceidbasic_realm_name,
    var.bceidbusiness_realm_name,
    var.bceidboth_realm_name,
  ]
}

resource "keycloak_openid_client_scope" "idp_client_scopes" {
  for_each = toset(local.idp_names)

  realm_id               = keycloak_realm.this.id
  name                   = each.key
  description            = "${each.key} idp client scope"
  include_in_token_scope = false
}

resource "keycloak_openid_client" "test_client" {
  realm_id = keycloak_realm.this.id

  client_id = "test_client"
  name      = "test_client"

  enabled                      = true
  standard_flow_enabled        = true
  implicit_flow_enabled        = false
  direct_access_grants_enabled = false
  service_accounts_enabled     = false

  access_type   = "PUBLIC"
  client_secret = "<UPDATE_ME>"

  valid_redirect_uris = ["*"]
  web_origins         = ["*"]

  authentication_flow_binding_overrides {
    browser_id = module.idp_auth_flow.flow_id
    # direct_grant_id =
  }
}
