locals {
  keycloak_url             = "http://localhost:8080"
  standard_realm_name      = "onestopauth"
  idir_realm_name          = "idir"
  azureidir_realm_name     = "azureidir"
  bceidbasic_realm_name    = "bceidbasic"
  bceidbusiness_realm_name = "bceidbusiness"
  bceidboth_realm_name     = "bceidboth"
}

module "onestopauth" {
  source       = "./realms/realm-onestopauth"
  keycloak_url = local.keycloak_url

  standard_realm_name      = local.standard_realm_name
  idir_realm_name          = local.idir_realm_name
  azureidir_realm_name     = local.azureidir_realm_name
  bceidbasic_realm_name    = local.bceidbasic_realm_name
  bceidbusiness_realm_name = local.bceidbusiness_realm_name
  bceidboth_realm_name     = local.bceidboth_realm_name

  idir_client_id              = module.idir.standard_client_id
  idir_client_secret          = module.idir.standard_client_secret
  azureidir_client_id         = module.azureidir.standard_client_id
  azureidir_client_secret     = module.azureidir.standard_client_secret
  bceidbasic_client_id        = module.bceidbasic.standard_client_id
  bceidbasic_client_secret    = module.bceidbasic.standard_client_secret
  bceidbusiness_client_id     = module.bceidbusiness.standard_client_id
  bceidbusiness_client_secret = module.bceidbusiness.standard_client_secret
  bceidboth_client_id         = module.bceidboth.standard_client_id
  bceidboth_client_secret     = module.bceidboth.standard_client_secret
}

module "idir" {
  source              = "./realms/realm-idir"
  keycloak_url        = local.keycloak_url
  realm_name          = local.idir_realm_name
  standard_realm_name = local.standard_realm_name
}

module "azureidir" {
  source                 = "./realms/realm-azureidir"
  keycloak_url           = local.keycloak_url
  realm_name             = local.azureidir_realm_name
  standard_realm_name    = local.standard_realm_name
  azureidir_keycloak_url = var.azureidir_keycloak_url
}

module "bceidbasic" {
  source              = "./realms/realm-bceidbasic"
  keycloak_url        = local.keycloak_url
  realm_name          = local.bceidbasic_realm_name
  standard_realm_name = local.standard_realm_name
}


module "bceidbusiness" {
  source              = "./realms/realm-bceidbusiness"
  keycloak_url        = local.keycloak_url
  realm_name          = local.bceidbusiness_realm_name
  standard_realm_name = local.standard_realm_name
}

module "bceidboth" {
  source              = "./realms/realm-bceidboth"
  keycloak_url        = local.keycloak_url
  realm_name          = local.bceidboth_realm_name
  standard_realm_name = local.standard_realm_name
}
