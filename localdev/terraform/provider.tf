provider "keycloak" {
  realm     = "master"
  client_id = "admin-cli"
  username  = "admin"
  password  = "admin"
  url       = "http://localhost:8080"
}
