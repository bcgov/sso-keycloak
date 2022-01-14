terraform {
  required_version = ">= 1.0.7"

  required_providers {
    keycloak = {
      source  = "mrparkers/keycloak"
      version = "3.6.0"
    }
  }
}
