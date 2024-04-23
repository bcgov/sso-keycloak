package com.github.bcgov.keycloak.authenticators;

import org.jboss.logging.Logger;
import org.keycloak.authentication.Authenticator;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.UserSessionProvider;
import org.keycloak.services.managers.AuthenticationManager;
import org.keycloak.authentication.AuthenticationFlowContext;

public class UserSessionRemover implements Authenticator {

  private static final Logger logger = Logger.getLogger(UserSessionRemover.class);

  @Override
  public boolean requiresUser() {
    return false;
  }

  @Override
  public void authenticate(AuthenticationFlowContext context) {

    AuthenticationManager.AuthResult authResult = AuthenticationManager.authenticateIdentityCookie(
        context.getSession(), context.getRealm(), true);

    if (authResult == null) {
      context.attempted();
      return;
    }

    UserSessionProvider userSessionProvider = context.getSession().sessions();
    userSessionProvider.removeUserSession(context.getRealm(), authResult.getSession());
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
