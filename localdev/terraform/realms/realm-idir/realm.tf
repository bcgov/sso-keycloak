resource "keycloak_realm" "this" {
  realm             = var.realm_name
  enabled           = true
  display_name      = var.realm_name
  display_name_html = "<b>${var.realm_name}</b>"

  login_with_email_allowed = false
  duplicate_emails_allowed = true

  sso_session_idle_timeout                 = "30m"  # SSO Session Idle
  sso_session_max_lifespan                 = "10h"  # SSO Session Max
  offline_session_idle_timeout             = "720h" # Offline Session Idle
  offline_session_max_lifespan_enabled     = false  # Offline Session Max Limited
  access_token_lifespan                    = "5m"   # Access Token Lifespan
  access_token_lifespan_for_implicit_flow  = "15m"  # Access Token Lifespan For Implicit Flow
  access_code_lifespan                     = "1m"   # Client login timeout
  access_code_lifespan_login               = "30m"  # Login timeout
  access_code_lifespan_user_action         = "5m"   # Login action timeout
  action_token_generated_by_user_lifespan  = "5m"   # User-Initiated Action Lifespan
  action_token_generated_by_admin_lifespan = "12h"  # Default Admin-Initiated Action Lifespan
}

resource "keycloak_openid_client_scope" "idp_scope" {
  realm_id               = keycloak_realm.this.id
  name                   = var.realm_name
  description            = "${var.realm_name} idp client scope"
  include_in_token_scope = false
}
