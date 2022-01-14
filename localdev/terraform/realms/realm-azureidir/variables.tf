variable "keycloak_url" {
  default = "http://localhost:8080"
}

variable "azureidir_keycloak_url" {
  default = "https://login.microsoftonline.com/abcde/oauth2/v2.0"
}

variable "realm_name" {
  default = "azureidir"
}

variable "standard_realm_name" {
  default = "onestopauth"
}
