variable "keycloak_url" {
  default = "http://localhost:8080"
}

variable "idp_realm_name" {
  default = "idps"
}

variable "standard_realm_name" {
  default = "onestopauth"
}

variable "idir_client_id" {}
variable "idir_client_secret" {}

variable "azureidir_client_id" {}
variable "azureidir_client_secret" {}

variable "bceidbasic_client_id" {}
variable "bceidbasic_client_secret" {}

variable "bceidbusiness_client_id" {}
variable "bceidbusiness_client_secret" {}

variable "bceidboth_client_id" {}
variable "bceidboth_client_secret" {}
