variable "keycloak_url" {
  default = "http://localhost:8080"
}

variable "azureidir_keycloak_url" {
  default = "https://login.microsoftonline.com/abcde/oauth2/v2.0"
}

variable "idp_realm_name" {
  default = "idps"
}

variable "standard_realm_name" {
  default = "onestopauth"
}
