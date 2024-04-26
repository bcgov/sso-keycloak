package com.github.bcgov.keycloak.authenticators;

import org.jboss.logging.Logger;
import org.keycloak.authentication.Authenticator;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.UserSessionProvider;
import org.keycloak.services.managers.AuthenticationManager;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.sessions.AuthenticationSessionModel;

import java.util.Map;

public class UserSessionRemover implements Authenticator {

  private static final Logger logger = Logger.getLogger(UserSessionRemover.class);

  @Override
  public boolean requiresUser() {
    return false;
  }

  @Override
  public void authenticate(AuthenticationFlowContext context) {
    AuthenticationSessionModel session = context.getAuthenticationSession();
    AuthenticationManager.AuthResult authResult = AuthenticationManager.authenticateIdentityCookie(
      context.getSession(),
      context.getRealm(),
      true
    );

    // 1. If no Cookie session, proceed to next step
    if (authResult == null) {
      context.attempted();
      return;
    }

    // Need to use the KeycloakSession context to get the authenticating client ID. Not available on the AuthenticationFlowContext.
    KeycloakSession keycloakSession = context.getSession();
    String authenticatingClientUUID = keycloakSession.getContext().getClient().getId();

    // Get all existing sessions. If any session is associated with a different client, clear all user sessions.
    UserSessionProvider userSessionProvider = keycloakSession.sessions();
    Map<String, Long> activeClientSessionStats = userSessionProvider.getActiveClientSessionStats(context.getRealm(), false);

    for (String activeSessionClientUUID : activeClientSessionStats.keySet()) {
      if (!activeSessionClientUUID.equals(authenticatingClientUUID)) {
        userSessionProvider.removeUserSession(context.getRealm(), authResult.getSession());
      }
    }

    context.attempted();
  }

  @Override
  public void action(AuthenticationFlowContext context) {
  }

  @Override
  public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
    return true;
  }

  @Override
  public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {
  }

  @Override
  public void close() {
  }
}
