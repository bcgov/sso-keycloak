locals {
  keycloak_url        = "http://localhost:8080"
  idp_realm_name      = "idps"
  standard_realm_name = "onestopauth"
}

module "idps" {
  source                 = "./realms/realm-idps"
  keycloak_url           = local.keycloak_url
  idp_realm_name         = local.idp_realm_name
  standard_realm_name    = local.standard_realm_name
  azureidir_keycloak_url = var.azureidir_keycloak_url
}

module "onestopauth" {
  source                      = "./realms/realm-onestopauth"
  keycloak_url                = local.keycloak_url
  idp_realm_name              = local.idp_realm_name
  standard_realm_name         = local.standard_realm_name
  idir_client_id              = module.idps.idir_client_id
  idir_client_secret          = module.idps.idir_client_secret
  azureidir_client_id         = module.idps.azureidir_client_id
  azureidir_client_secret     = module.idps.azureidir_client_secret
  bceidbasic_client_id        = module.idps.bceidbasic_client_id
  bceidbasic_client_secret    = module.idps.bceidbasic_client_secret
  bceidbusiness_client_id     = module.idps.bceidbusiness_client_id
  bceidbusiness_client_secret = module.idps.bceidbusiness_client_secret
  bceidboth_client_id         = module.idps.bceidboth_client_id
  bceidboth_client_secret     = module.idps.bceidboth_client_secret
}
