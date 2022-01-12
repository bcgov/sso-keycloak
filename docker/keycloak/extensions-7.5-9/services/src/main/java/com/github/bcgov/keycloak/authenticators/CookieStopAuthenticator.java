package com.github.bcgov.keycloak.authenticators;

import org.jboss.logging.Logger;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.Authenticator;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.protocol.LoginProtocol;
import org.keycloak.services.managers.AuthenticationManager;
import org.keycloak.sessions.AuthenticationSessionModel;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class CookieStopAuthenticator implements Authenticator {

  private static final Logger logger = Logger.getLogger(CookieStopAuthenticator.class);

  @Override
  public boolean requiresUser() {
    return false;
  }

  @Override
  public void authenticate(AuthenticationFlowContext context) {
    AuthenticationManager.AuthResult authResult =
        AuthenticationManager.authenticateIdentityCookie(
            context.getSession(), context.getRealm(), true);
    if (authResult == null) {
      context.attempted();
    } else {
      String broker = authResult.getSession().getBrokerSessionId();
      logger.warn("================");
      logger.warn(broker);
      logger.warn("================");
      AuthenticationSessionModel clientSession = context.getAuthenticationSession();
      LoginProtocol protocol =
          context.getSession().getProvider(LoginProtocol.class, clientSession.getProtocol());

      // Cookie re-authentication is skipped if re-authentication is required
      if (protocol.requireReauthentication(authResult.getSession(), clientSession)) {
        context.attempted();
      } else {
        context.getAuthenticationSession().setAuthNote(AuthenticationManager.SSO_AUTH, "true");

        context.setUser(authResult.getUser());
        context.attachUserSession(authResult.getSession());
        context.success();
      }
    }
  }

  @Override
  public void action(AuthenticationFlowContext context) {}

  @Override
  public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
    return true;
  }

  @Override
  public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {}

  @Override
  public void close() {}
}
