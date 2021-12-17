locals {
  override_authentication_flow = true
}

resource "keycloak_realm" "realm" {
  realm             = "my-realm"
  enabled           = true
  display_name      = "my realm"
  display_name_html = "<b>my realm</b>"

  login_theme = "bcgov-idp-stopper"
}

# see https://registry.terraform.io/providers/mrparkers/keycloak/latest/docs/resources/oidc_identity_provider
resource "keycloak_oidc_identity_provider" "idir" {
  realm             = keycloak_realm.realm.id
  alias             = "idir"
  enabled           = true
  store_token       = true
  authorization_url = "https://dev.oidc.gov.bc.ca/auth/realms/onestopauth/protocol/openid-connect/auth?kc_idp_hint=idir"
  token_url         = "https://dev.oidc.gov.bc.ca/auth/realms/onestopauth/protocol/openid-connect/token"
  user_info_url     = "https://dev.oidc.gov.bc.ca/auth/realms/onestopauth/protocol/openid-connect/userinfo"
  client_id         = var.idir_client_id
  client_secret     = var.idir_client_secret

  extra_config = {
    "clientAuthMethod" = "client_secret_post"
  }
}

resource "keycloak_oidc_identity_provider" "azureidir" {
  realm             = keycloak_realm.realm.id
  alias             = "azureidir"
  enabled           = true
  store_token       = true
  authorization_url = "https://dev.oidc.gov.bc.ca/auth/realms/onestopauth/protocol/openid-connect/auth?kc_idp_hint=_azureidir"
  token_url         = "https://dev.oidc.gov.bc.ca/auth/realms/onestopauth/protocol/openid-connect/token"
  user_info_url     = "https://dev.oidc.gov.bc.ca/auth/realms/onestopauth/protocol/openid-connect/userinfo"
  client_id         = var.idir_client_id
  client_secret     = var.idir_client_secret

  extra_config = {
    "clientAuthMethod" = "client_secret_post"
  }
}

resource "keycloak_oidc_identity_provider" "github" {
  realm             = keycloak_realm.realm.id
  alias             = "github"
  enabled           = true
  store_token       = true
  authorization_url = "https://dev.oidc.gov.bc.ca/auth/realms/onestopauth/protocol/openid-connect/auth?kc_idp_hint=github"
  token_url         = "https://dev.oidc.gov.bc.ca/auth/realms/onestopauth/protocol/openid-connect/token"
  user_info_url     = "https://dev.oidc.gov.bc.ca/auth/realms/onestopauth/protocol/openid-connect/userinfo"
  client_id         = var.idir_client_id
  client_secret     = var.idir_client_secret

  extra_config = {
    "clientAuthMethod" = "client_secret_post"
  }
}

resource "keycloak_openid_client_scope" "idir" {
  realm_id               = keycloak_realm.realm.id
  name                   = "idir"
  description            = "idir idp client scope"
  include_in_token_scope = false
}

resource "keycloak_openid_client_scope" "azureidir" {
  realm_id               = keycloak_realm.realm.id
  name                   = "azureidir"
  description            = "azureidir idp client scope"
  include_in_token_scope = false
}

resource "keycloak_openid_client_scope" "github" {
  realm_id               = keycloak_realm.realm.id
  name                   = "github"
  description            = "github idp client scope"
  include_in_token_scope = false
}

resource "keycloak_authentication_flow" "flow" {
  realm_id = keycloak_realm.realm.id
  alias    = "browser idp"
}

resource "keycloak_authentication_execution" "execution1" {
  realm_id          = keycloak_realm.realm.id
  parent_flow_alias = keycloak_authentication_flow.flow.alias
  authenticator     = "auth-cookie"
  requirement       = "ALTERNATIVE"
}

resource "keycloak_authentication_execution" "execution2" {
  realm_id          = keycloak_realm.realm.id
  parent_flow_alias = keycloak_authentication_flow.flow.alias
  authenticator     = "identity-provider-stopper"
  requirement       = "ALTERNATIVE"
  depends_on        = [keycloak_authentication_execution.execution1]
}


resource "keycloak_authentication_execution" "execution3" {
  realm_id          = keycloak_realm.realm.id
  parent_flow_alias = keycloak_authentication_flow.flow.alias
  authenticator     = "identity-provider-stop-form"
  requirement       = "ALTERNATIVE"
  depends_on        = [keycloak_authentication_execution.execution2]
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

  valid_redirect_uris = ["http://localhost:3000/*"]
  web_origins         = ["*"]


  dynamic "authentication_flow_binding_overrides" {
    for_each = toset(local.override_authentication_flow ? ["1"] : [])
    content {
      browser_id      = data.keycloak_authentication_flow.flow.id
      direct_grant_id = ""
    }
  }
}
