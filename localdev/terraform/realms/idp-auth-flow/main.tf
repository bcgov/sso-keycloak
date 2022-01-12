resource "keycloak_authentication_flow" "flow" {
  realm_id = var.realm_id
  alias    = "idp stopper"
}

resource "keycloak_authentication_execution" "exec1" {
  realm_id          = var.realm_id
  parent_flow_alias = keycloak_authentication_flow.flow.alias
  authenticator     = "cookie-stopper"
  requirement       = "ALTERNATIVE"
}

resource "keycloak_authentication_execution" "exec2" {
  realm_id          = var.realm_id
  parent_flow_alias = keycloak_authentication_flow.flow.alias
  authenticator     = "identity-provider-stopper"
  requirement       = "ALTERNATIVE"
  depends_on        = [keycloak_authentication_execution.exec1]
}


resource "keycloak_authentication_execution" "exec3" {
  realm_id          = var.realm_id
  parent_flow_alias = keycloak_authentication_flow.flow.alias
  authenticator     = "identity-provider-stop-form"
  requirement       = "ALTERNATIVE"
  depends_on        = [keycloak_authentication_execution.exec2]
}
