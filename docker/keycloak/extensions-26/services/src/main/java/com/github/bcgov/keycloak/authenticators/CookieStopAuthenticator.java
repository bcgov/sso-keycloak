package com.github.bcgov.keycloak.authenticators;

import jakarta.ws.rs.core.MultivaluedMap;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.Authenticator;
import org.keycloak.constants.AdapterConstants;
import org.keycloak.models.*;
import org.keycloak.protocol.LoginProtocol;
import org.keycloak.services.managers.AuthenticationManager;
import org.keycloak.sessions.AuthenticationSessionModel;

import java.util.Map;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class CookieStopAuthenticator implements Authenticator {

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

    AuthenticationSessionModel authSession = context.getAuthenticationSession();
    LoginProtocol protocol = context.getSession().getProvider(LoginProtocol.class, authSession.getProtocol());
    context.setUser(authResult.getUser());

    // 2. if re-authentication is required, proceed to login process
    if (protocol.requireReauthentication(authResult.getSession(), authSession)) {
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
      String sessIdp = authResult.getSession().getNotes().get("identity_provider");

      if (authIdp != null && !authIdp.trim().isEmpty()) {
        IdentityProviderModel idp = context.getRealm().getIdentityProviderByAlias(authIdp);
        Map<String, ClientScopeModel> scopes = context.getAuthenticationSession().getClient().getClientScopes(true);

        if (idp != null
            && idp.isEnabled()
            && (scopes.containsKey(authIdp) || scopes.containsKey(authIdp + "-saml"))
            && authIdp != sessIdp) {
          UserSessionProvider userSessionProvider = context.getSession().sessions();
          userSessionProvider.removeUserSession(context.getRealm(), authResult.getSession());
          context.attempted();
          return;
        }
      }
    }

    String clientUUID = authSession.getClient().getId();
    AuthenticatedClientSessionModel clientSessionModel = authResult.getSession()
        .getAuthenticatedClientSessionByClient(clientUUID);

    // 4. If no Cookie session with the authenticating client, proceed to login
    // process
    if (clientSessionModel == null) {
      context.attempted();
      return;
    }

    // 5. Otherwise, attach the exisiting session to the user
    context.getAuthenticationSession().setAuthNote(AuthenticationManager.SSO_AUTH, "true");
    context.setUser(authResult.getUser());
    context.attachUserSession(authResult.getSession());
    context.success();
  }

  @Override
  public void action(AuthenticationFlowContext context) { /* This is ok */ }

  @Override
  public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
    return true;
  }

  @Override
  public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) { /* This is ok */ }

  @Override
  public void close() { /* This is ok */ }
}
