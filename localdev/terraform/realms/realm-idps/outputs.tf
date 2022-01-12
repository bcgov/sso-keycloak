output "idir_client_id" {
  value = keycloak_openid_client.idp_clients[local.idir_idp_name].client_id
}

output "idir_client_secret" {
  value = keycloak_openid_client.idp_clients[local.idir_idp_name].client_secret
}

output "azureidir_client_id" {
  value = keycloak_openid_client.idp_clients[local.azureidir_idp_name].client_id
}

output "azureidir_client_secret" {
  value = keycloak_openid_client.idp_clients[local.azureidir_idp_name].client_secret
}

output "bceidbasic_client_id" {
  value = keycloak_openid_client.idp_clients[local.bceidbasic_idp_name].client_id
}

output "bceidbasic_client_secret" {
  value = keycloak_openid_client.idp_clients[local.bceidbasic_idp_name].client_secret
}

output "bceidbusiness_client_id" {
  value = keycloak_openid_client.idp_clients[local.bceidbusiness_idp_name].client_id
}

output "bceidbusiness_client_secret" {
  value = keycloak_openid_client.idp_clients[local.bceidbusiness_idp_name].client_secret
}

output "bceidboth_client_id" {
  value = keycloak_openid_client.idp_clients[local.bceidboth_idp_name].client_id
}

output "bceidboth_client_secret" {
  value = keycloak_openid_client.idp_clients[local.bceidboth_idp_name].client_secret
}
