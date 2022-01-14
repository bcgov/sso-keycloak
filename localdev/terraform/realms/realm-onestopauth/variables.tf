variable "keycloak_url" {
  default = "http://localhost:8080"
}

variable "standard_realm_name" {
  default = "onestopauth"
}

variable "idir_realm_name" {}
variable "azureidir_realm_name" {}
variable "bceidbasic_realm_name" {}
variable "bceidbusiness_realm_name" {}
variable "bceidboth_realm_name" {}

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
