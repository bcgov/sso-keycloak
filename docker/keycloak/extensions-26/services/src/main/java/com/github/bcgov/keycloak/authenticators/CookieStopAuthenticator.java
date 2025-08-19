package com.github.bcgov.keycloak.authenticators;

import jakarta.ws.rs.core.MultivaluedMap;

import org.jboss.logging.Logger;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.Authenticator;
import org.keycloak.constants.AdapterConstants;
import org.keycloak.models.*;
import org.keycloak.protocol.LoginProtocol;
import org.keycloak.services.managers.AuthenticationManager;
import org.keycloak.services.messages.Messages;
import org.keycloak.sessions.AuthenticationSessionModel;

import java.util.Map;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class CookieStopAuthenticator implements Authenticator {

  private static final Logger logger = Logger.getLogger(CookieStopAuthenticator.class);

  @Override
  public boolean requiresUser() {
    return false;
  }

  @Override
  public void authenticate(AuthenticationFlowContext context) {

    AuthenticationManager.AuthResult authResult = AuthenticationManager.authenticateIdentityCookie(
        context.getSession(), context.getRealm(), true);

    // 1. If no Cookie session, proceed to login process
    if (authResult == null) {
      context.attempted();
      return;
    }

    AuthenticationSessionModel currentAuthSession = context.getAuthenticationSession();

    LoginProtocol protocol = context.getSession().getProvider(LoginProtocol.class, currentAuthSession.getProtocol());

    UserSessionModel parentAuthUserSession = context.getSession().sessions().getUserSession(context.getRealm(),
        context.getAuthenticationSession().getParentSession().getId());
    String clientUUID = currentAuthSession.getClient().getId();
    AuthenticatedClientSessionModel clientSessionModel = authResult.getSession()
        .getAuthenticatedClientSessionByClient(clientUUID);

    UserSessionProvider userSessionProvider = context.getSession().sessions();

    String existingSessionIdp = authResult.getSession().getNotes().get("identity_provider");

    Map<String, ClientScopeModel> clientScopes = context.getAuthenticationSession().getClient().getClientScopes(true);

    // Attach user to this flow only when user has a valid parent authentication
    // session and,
    // - Current client session exists or,
    // - Current client session does not exist and client scopes contains
    // authenticated IDP
    if (parentAuthUserSession != null && (clientSessionModel != null
        || (clientSessionModel == null && clientScopes.containsKey(existingSessionIdp)))) {
      context.setUser(authResult.getUser());
    }

    // 2. if re-authentication is required, proceed to login process
    if (protocol.requireReauthentication(authResult.getSession(), currentAuthSession)) {
      currentAuthSession.setAuthNote(AuthenticationManager.FORCED_REAUTHENTICATION, "true");
      context.setForwardedInfoMessage(Messages.REAUTHENTICATE);
      context.attempted();
      return;
    }

    MultivaluedMap<String, String> queryParams = context.getUriInfo().getQueryParameters();

    // 3. If a target IDP is passed via "kc_idp_hint" query param, and
    // i. the target IDP is enabled;
    // ii. the target IDP is allowed for the authenticating client;
    // iii. the target IDP is different one than the one in the user session;
    // then, logout the user from the current session and proceed to login process
    if (queryParams.containsKey(AdapterConstants.KC_IDP_HINT)) {
      String authIdp = queryParams.getFirst(AdapterConstants.KC_IDP_HINT);

      if (authIdp != null && !authIdp.trim().isEmpty()) {
        IdentityProviderModel idp = context.getSession().identityProviders().getByAlias(authIdp);

        if (idp != null
            && idp.isEnabled()
            && (clientScopes.containsKey(authIdp) || clientScopes.containsKey(authIdp + "-saml"))
            && !authIdp.equalsIgnoreCase(existingSessionIdp)) {

          userSessionProvider.removeUserSession(context.getRealm(), authResult.getSession());
          context.attempted();
          return;
        }
      }
    }

    // If parent authentication session is valid and client session exists or if
    // current client session does not exist but contains authenticated IDP
    if (parentAuthUserSession != null && (clientSessionModel != null
        || (clientSessionModel == null && clientScopes.containsKey(existingSessionIdp)))) {
      context.getAuthenticationSession().setAuthNote(AuthenticationManager.SSO_AUTH,
          "true");
      context.attachUserSession(authResult.getSession());
      context.success();
    } else {
      userSessionProvider.removeUserSession(context.getRealm(), authResult.getSession());
      context.attempted();
      return;
    }
  }

  @Override
  public void action(AuthenticationFlowContext context) {
    /* This is ok */ }

  @Override
  public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
    return true;
  }

  @Override
  public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {
    /* This is ok */ }

  @Override
  public void close() {
    /* This is ok */ }
}
