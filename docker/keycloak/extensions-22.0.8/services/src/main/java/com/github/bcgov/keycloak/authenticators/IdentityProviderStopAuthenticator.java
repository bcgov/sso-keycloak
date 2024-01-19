package com.github.bcgov.keycloak.authenticators;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriBuilder;
import org.jboss.logging.Logger;
import org.keycloak.OAuth2Constants;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.AuthenticationProcessor;
import org.keycloak.authentication.Authenticator;
import org.keycloak.constants.AdapterConstants;
import org.keycloak.models.*;
import org.keycloak.protocol.oidc.OIDCLoginProtocol;
import org.keycloak.services.Urls;
import org.keycloak.services.managers.ClientSessionCode;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class IdentityProviderStopAuthenticator implements Authenticator {

  private static final Logger logger = Logger.getLogger(IdentityProviderStopAuthenticator.class);

  protected static final String ACCEPTS_PROMPT_NONE = "acceptsPromptNoneForwardFromClient";

  @Override
  public void authenticate(AuthenticationFlowContext context) {
    List<IdentityProviderModel> allowedIdps = new ArrayList<>();
    List<IdentityProviderModel> realmIdps = context.getRealm().getIdentityProvidersStream().toList();
    Map<String, ClientScopeModel> scopes =
        context.getAuthenticationSession().getClient().getClientScopes(true);

    for (IdentityProviderModel ridp : realmIdps) {
      String oidcAlias = ridp.getAlias();
      String samlAlias = ridp.getAlias() + "-saml";

      if (ridp.isEnabled() && (scopes.containsKey(oidcAlias) || scopes.containsKey(samlAlias))) {
        allowedIdps.add(ridp);
      }
    }

    if (allowedIdps.size() == 1) {
      IdentityProviderModel firstIdp = allowedIdps.get(0);
      logger.tracef("Single IDP found, Redirecting to %s", firstIdp.getAlias());
      redirect(context, firstIdp);
    } else if (allowedIdps.size() > 1) {
      if (context.getUriInfo().getQueryParameters().containsKey(AdapterConstants.KC_IDP_HINT)) {
        String hintIdp =
            context.getUriInfo().getQueryParameters().getFirst(AdapterConstants.KC_IDP_HINT);

        if (hintIdp != null && !hintIdp.equals("")) {
          for (IdentityProviderModel aidp : allowedIdps) {
            if (hintIdp.equals(aidp.getAlias())) {
              logger.tracef("Hint IDP found, Redirecting to %s", hintIdp);
              redirect(context, aidp);
              return;
            }
          }
        }
      }

      logger.tracef("Multiple IDP found, Navigating to login page");
      context.attempted();
    } else {
      logger.tracef("Zero IDP found, Navigating to login page");
      context.attempted();
    }
  }

  private void redirect(AuthenticationFlowContext context, IdentityProviderModel idp) {
    String accessCode =
        new ClientSessionCode<>(
                context.getSession(), context.getRealm(), context.getAuthenticationSession())
            .getOrGenerateCode();
    String clientId = context.getAuthenticationSession().getClient().getClientId();
    String tabId = context.getAuthenticationSession().getTabId();
    URI location =
        Urls.identityProviderAuthnRequest(
            context.getUriInfo().getBaseUri(),
            idp.getAlias(),
            context.getRealm().getName(),
            accessCode,
            clientId,
            tabId);
    if (context.getAuthenticationSession().getClientNote(OAuth2Constants.DISPLAY) != null) {
      location =
          UriBuilder.fromUri(location)
              .queryParam(
                  OAuth2Constants.DISPLAY,
                  context.getAuthenticationSession().getClientNote(OAuth2Constants.DISPLAY))
              .build();
    }

    Response response = Response.seeOther(location).build();

    // will forward the request to the IDP with prompt=none if the IDP accepts forwards with
    // prompt=none.
    if ("none"
            .equals(
                context.getAuthenticationSession().getClientNote(OIDCLoginProtocol.PROMPT_PARAM))
        && Boolean.valueOf(idp.getConfig().get(ACCEPTS_PROMPT_NONE))) {
      context
          .getAuthenticationSession()
          .setAuthNote(AuthenticationProcessor.FORWARDED_PASSIVE_LOGIN, "true");
    }

    context.forceChallenge(response);
  }

  @Override
  public void action(AuthenticationFlowContext context) { /* This is ok */ }

  @Override
  public boolean requiresUser() {
    return false;
  }

  @Override
  public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
    return true;
  }

  @Override
  public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) { /* This is ok */ }

  @Override
  public void close() { /* This is ok */ }
}
