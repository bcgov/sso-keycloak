package com.github.bcgov.keycloak.authenticators;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriBuilder;
import org.jboss.logging.Logger;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.AuthenticationFlowError;
import org.keycloak.authentication.Authenticator;
import org.keycloak.models.*;
import org.keycloak.sessions.AuthenticationSessionModel;
import org.keycloak.util.JsonSerialization;

import java.net.URI;
import java.util.Map;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class UserAttributeAuthenticator implements Authenticator {

  private static final Logger logger = Logger.getLogger(UserAttributeAuthenticator.class);

  @Override
  public void authenticate(AuthenticationFlowContext context) {
    AuthenticationSessionModel session = context.getAuthenticationSession();
    AuthenticatorConfigModel authConfig = context.getAuthenticatorConfig();
    if (authConfig == null) {
      context.failure(AuthenticationFlowError.ACCESS_DENIED, redirectResponse(session, null));
      return;
    }

    Map<String, String> config = authConfig.getConfig();
    if (config == null) {
      context.failure(AuthenticationFlowError.ACCESS_DENIED, redirectResponse(session, null));
      return;
    }

    String attributeKey = config.get(UserAttributeAuthenticatorFactory.ATTRIBUTE_KEY);
    String attributeValue = config.get(UserAttributeAuthenticatorFactory.ATTRIBUTE_VALUE);
    String errorUrl = config.get(UserAttributeAuthenticatorFactory.ERROR_URL);

    UserModel user = session.getAuthenticatedUser();
    RealmModel realm = session.getRealm();

    if (!user.getAttributes().get(attributeKey).contains(attributeValue)) {
      context.failure(AuthenticationFlowError.ACCESS_DENIED, redirectResponse(session, errorUrl));
      context.getSession().users().removeUser(realm, user);
      return;
    }

    context.success();
  }

  private Response redirectResponse(AuthenticationSessionModel session, String redirectUri) {
    ClientModel client = session.getClient();
    String clientBaseUrl = client.getBaseUrl();
    String clientId = client.getClientId();
    String idp = null;

    try {
      String authNote = session.getAuthNote("PBL_BROKERED_IDENTITY_CONTEXT");
      BrokeredIdentityContext brokeredIdentityContext =
          JsonSerialization.readValue(authNote.getBytes(), BrokeredIdentityContext.class);

      idp = brokeredIdentityContext.getIdentityProviderId();
    } catch (Exception e) {
      logger.warn("error parsing auth note: ", e);
    }

    String url = "";
    if (isValidString(redirectUri)) url = redirectUri;
    else if (isValidString(clientBaseUrl)) url = clientBaseUrl;
    else return null;

    url = url.replace("${idp_alias}", isValidString(idp) ? idp : "");
    url = url.replace("${client_id}", isValidString(clientId) ? clientId : "");

    URI redirect = UriBuilder.fromUri(url).build();
    return Response.status(302).location(redirect).build();
  }

  private boolean isValidString(String string) {
    return string != null && !string.trim().isEmpty();
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
