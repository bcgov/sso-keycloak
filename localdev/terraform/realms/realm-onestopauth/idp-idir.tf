# see https://registry.terraform.io/providers/mrparkers/keycloak/latest/docs/resources/oidc_identity_provider
resource "keycloak_oidc_identity_provider" "onestopauth_idir" {
  realm        = keycloak_realm.this.id
  alias        = local.idir_idp_name
  display_name = "IDIR"

  enabled           = true
  store_token       = true
  authorization_url = "${var.keycloak_url}/auth/realms/${var.idp_realm_name}/protocol/openid-connect/auth"
  token_url         = "${var.keycloak_url}/auth/realms/${var.idp_realm_name}/protocol/openid-connect/token"
  user_info_url     = "${var.keycloak_url}/auth/realms/${var.idp_realm_name}/protocol/openid-connect/userinfo"
  jwks_url          = "${var.keycloak_url}/auth/realms/${var.idp_realm_name}/protocol/openid-connect/certs"
  client_id         = var.idir_client_id
  client_secret     = var.idir_client_secret

  validate_signature = true

  extra_config = {
    "clientAuthMethod" = "client_secret_post"
  }
}

resource "keycloak_custom_identity_provider_mapper" "onestopauth_idir_mapper_displayname" {
  realm                    = keycloak_realm.this.id
  name                     = "display_name"
  identity_provider_alias  = keycloak_oidc_identity_provider.onestopauth_idir.alias
  identity_provider_mapper = "oidc-user-attribute-idp-mapper"

  extra_config = {
    syncMode         = "INHERIT"
    "claim"          = "display_name"
    "user.attribute" = "display_name"
  }
}

resource "keycloak_custom_identity_provider_mapper" "onestopauth_idir_mapper_idir_userid" {
  realm                    = keycloak_realm.this.id
  name                     = "idir_userid"
  identity_provider_alias  = keycloak_oidc_identity_provider.onestopauth_idir.alias
  identity_provider_mapper = "oidc-user-attribute-idp-mapper"

  extra_config = {
    syncMode         = "INHERIT"
    "claim"          = "idir_userid"
    "user.attribute" = "idir_userid"
  }
}

resource "keycloak_custom_identity_provider_mapper" "onestopauth_idir_mapper_idir_guid" {
  realm                    = keycloak_realm.this.id
  name                     = "idir_guid"
  identity_provider_alias  = keycloak_oidc_identity_provider.onestopauth_idir.alias
  identity_provider_mapper = "oidc-user-attribute-idp-mapper"

  extra_config = {
    syncMode         = "INHERIT"
    "claim"          = "idir_guid"
    "user.attribute" = "idir_guid"
  }
}
