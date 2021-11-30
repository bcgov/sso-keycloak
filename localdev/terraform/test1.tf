locals {
  override_authentication_flow = false
}

resource "keycloak_realm" "realm" {
  realm             = "my-realm"
  enabled           = true
  display_name      = "my realm"
  display_name_html = "<b>my realm</b>"
}

resource "keycloak_authentication_flow" "flow" {
  realm_id = keycloak_realm.realm.id
  alias    = "my-flow-alias"
}

resource "keycloak_authentication_execution" "execution1" {
  realm_id          = keycloak_realm.realm.id
  parent_flow_alias = keycloak_authentication_flow.flow.alias
  authenticator     = "identity-provider-redirector"
  requirement       = "REQUIRED"
}

data "keycloak_authentication_flow" "flow" {
  realm_id = keycloak_realm.realm.id
  alias    = keycloak_authentication_flow.flow.alias
}

resource "keycloak_openid_client" "this" {
  realm_id = keycloak_realm.realm.id

  client_id = "my-client"
  name      = "my-client"

  enabled                      = true
  standard_flow_enabled        = true
  implicit_flow_enabled        = false
  direct_access_grants_enabled = false
  service_accounts_enabled     = false

  access_type   = "PUBLIC"
  client_secret = "secret"

  valid_redirect_uris = ["http://localhost:3000"]

  dynamic "authentication_flow_binding_overrides" {
    for_each = toset(local.override_authentication_flow ? ["1"] : [])
    content {
      browser_id      = data.keycloak_authentication_flow.flow.id
      direct_grant_id = ""
    }
  }
}
