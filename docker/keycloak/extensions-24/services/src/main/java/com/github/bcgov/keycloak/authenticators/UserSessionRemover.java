package com.github.bcgov.keycloak.authenticators;

import org.jboss.logging.Logger;
import org.keycloak.authentication.Authenticator;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.UserSessionProvider;
import org.keycloak.models.AuthenticatedClientSessionModel;
import org.keycloak.services.managers.AuthenticationManager;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.sessions.AuthenticationSessionModel;
import org.keycloak.models.UserSessionModel;

import java.util.Map;

public class UserSessionRemover implements Authenticator {

  private static final Logger logger = Logger.getLogger(UserSessionRemover.class);

  @Override
  public boolean requiresUser() {
    return false;
  }

  @Override
  public void authenticate(AuthenticationFlowContext context) {
    UserSessionModel userSessionModel;
    AuthenticationManager.AuthResult authResult = AuthenticationManager.authenticateIdentityCookie(context.getSession(), context.getRealm(), true);

    // 1. If no Cookie session, proceed to next step
    if (authResult == null) {
      context.attempted();
      return;
    }

    userSessionModel = authResult.getSession();

    String authenticatingClientUUID = context.getSession().getContext().getClient().getId();
    UserSessionProvider userSessionProvider = context.getSession().sessions();

    // Must fetch sessions from the user session model, user session provider has all session in the realm
    Map<String, AuthenticatedClientSessionModel> authenticatedClientSessions = userSessionModel.getAuthenticatedClientSessions();

    for (String activeSessionClientUUID : authenticatedClientSessions.keySet()) {
      if (!activeSessionClientUUID.equals(authenticatingClientUUID)) {
        userSessionProvider.removeUserSession(context.getRealm(), userSessionModel);
      }
    }

    context.attempted();
    return;
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
