# see https://registry.terraform.io/providers/mrparkers/keycloak/latest/docs/resources/oidc_identity_provider
resource "keycloak_oidc_identity_provider" "onestopauth_azureidir" {
  realm        = keycloak_realm.this.id
  alias        = local.azureidir_idp_name
  display_name = "AZURE IDIR"

  enabled           = true
  store_token       = true
  authorization_url = "${var.keycloak_url}/auth/realms/${var.idp_realm_name}/protocol/openid-connect/auth"
  token_url         = "${var.keycloak_url}/auth/realms/${var.idp_realm_name}/protocol/openid-connect/token"
  user_info_url     = "${var.keycloak_url}/auth/realms/${var.idp_realm_name}/protocol/openid-connect/userinfo"
  jwks_url          = "${var.keycloak_url}/auth/realms/${var.idp_realm_name}/protocol/openid-connect/certs"
  client_id         = var.azureidir_client_id
  client_secret     = var.azureidir_client_secret

  validate_signature = true

  extra_config = {
    "clientAuthMethod" = "client_secret_post"
  }
}

resource "keycloak_custom_identity_provider_mapper" "onestopauth_azureidir_mapper_displayname" {
  realm                    = keycloak_realm.this.id
  name                     = "display_name"
  identity_provider_alias  = keycloak_oidc_identity_provider.onestopauth_azureidir.alias
  identity_provider_mapper = "oidc-user-attribute-idp-mapper"

  extra_config = {
    syncMode         = "INHERIT"
    "claim"          = "display_name"
    "user.attribute" = "display_name"
  }
}

resource "keycloak_custom_identity_provider_mapper" "onestopauth_azureidir_mapper_azureidir_userid" {
  realm                    = keycloak_realm.this.id
  name                     = "azureidir_userid"
  identity_provider_alias  = keycloak_oidc_identity_provider.onestopauth_azureidir.alias
  identity_provider_mapper = "oidc-user-attribute-idp-mapper"

  extra_config = {
    syncMode         = "INHERIT"
    "claim"          = "azureidir_userid"
    "user.attribute" = "azureidir_userid"
  }
}

resource "keycloak_custom_identity_provider_mapper" "onestopauth_azureidir_mapper_azureidir_guid" {
  realm                    = keycloak_realm.this.id
  name                     = "azureidir_guid"
  identity_provider_alias  = keycloak_oidc_identity_provider.onestopauth_azureidir.alias
  identity_provider_mapper = "oidc-user-attribute-idp-mapper"

  extra_config = {
    syncMode         = "INHERIT"
    "claim"          = "azureidir_guid"
    "user.attribute" = "azureidir_guid"
  }
}
