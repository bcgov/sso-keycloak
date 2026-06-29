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
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.List;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class UserAttributeAuthenticator implements Authenticator {

  private static final Logger logger = Logger.getLogger(UserAttributeAuthenticator.class);
  private static final String BROKERED_IDENTITY_CONTEXT_NOTE = "PBL_BROKERED_IDENTITY_CONTEXT";
  private static final String TEMPLATE_IDP_ALIAS = "${idp_alias}";
  private static final String TEMPLATE_CLIENT_ID = "${client_id}";

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
    if (user == null || !isValidString(attributeKey) || !isValidString(attributeValue)) {
      denyAccess(context, session, errorUrl);
      return;
    }

    RealmModel realm = session.getRealm();

    List<String> values = user.getAttributes().get(attributeKey);
    if (values == null || !values.contains(attributeValue)) {
      logger.debugf("Access denied for user %s due to missing required attribute", user.getId());
      denyAccess(context, session, errorUrl);
      context.getSession().users().removeUser(realm, user);
      return;
    }

    context.success();
  }

  private void denyAccess(AuthenticationFlowContext context, AuthenticationSessionModel session,
      String redirectUri) {
    Response response = redirectResponse(session, redirectUri);
    if (response != null) {
      context.failure(AuthenticationFlowError.ACCESS_DENIED, response);
      return;
    }

    context.failure(AuthenticationFlowError.ACCESS_DENIED);
  }

  private Response redirectResponse(AuthenticationSessionModel session, String redirectUri) {
    ClientModel client = session.getClient();
    String clientBaseUrl = client.getBaseUrl();
    String clientRootUrl = client.getRootUrl();
    String clientId = client.getClientId();
    String idp = null;

    try {
      String authNote = session.getAuthNote(BROKERED_IDENTITY_CONTEXT_NOTE);
      if (isValidString(authNote)) {
        BrokeredIdentityContext brokeredIdentityContext = JsonSerialization.readValue(
            authNote.getBytes(StandardCharsets.UTF_8),
            BrokeredIdentityContext.class);
        idp = brokeredIdentityContext.getIdentityProviderId();
      }
    } catch (Exception e) {
      logger.debug("Unable to parse brokered identity context note", e);
    }

    URI redirect = buildSafeRedirectUri(redirectUri, clientBaseUrl, clientRootUrl, clientId, idp);
    if (redirect == null) {
      return null;
    }

    return Response.status(Response.Status.FOUND).location(redirect).build();
  }

  private URI buildSafeRedirectUri(String configuredRedirectUri, String clientBaseUrl, String clientRootUrl,
      String clientId, String idpAlias) {
    String candidateUrl = null;
    if (isValidString(configuredRedirectUri)) {
      candidateUrl = configuredRedirectUri;
    } else if (isValidString(clientBaseUrl)) {
      candidateUrl = clientBaseUrl;
    } else if (isValidString(clientRootUrl)) {
      candidateUrl = clientRootUrl;
    }

    if (!isValidString(candidateUrl)) {
      return null;
    }

    String url = candidateUrl
        .replace(TEMPLATE_IDP_ALIAS, encodeUrlComponent(idpAlias))
        .replace(TEMPLATE_CLIENT_ID, encodeUrlComponent(clientId));

    URI parsed;
    try {
      parsed = UriBuilder.fromUri(url).build();
    } catch (IllegalArgumentException ex) {
      logger.warn("Invalid redirect URL configured; falling back to default client URL");
      parsed = null;
    }

    URI fallbackBase = parseUri(clientBaseUrl);
    if (fallbackBase == null) {
      fallbackBase = parseUri(clientRootUrl);
    }

    if (parsed == null) {
      if (fallbackBase == null) {
        return null;
      }
      return fallbackBase;
    }

    URI resolved = parsed;
    if (!parsed.isAbsolute()) {
      if (fallbackBase == null) {
        logger.warn("Relative redirect URL is not allowed without a valid client base/root URL");
        return null;
      }
      resolved = fallbackBase.resolve(parsed);
    }

    if (!isSafeHttpUri(resolved)) {
      logger.warn("Blocked unsafe redirect URL");
      return fallbackBase;
    }

    return resolved;
  }

  private String encodeUrlComponent(String value) {
    if (!isValidString(value)) {
      return "";
    }
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }

  private boolean isValidString(String string) {
    return string != null && !string.trim().isEmpty();
  }

  private boolean isSafeHttpUri(URI uri) {
    if (uri == null || !uri.isAbsolute()) {
      return false;
    }

    String scheme = uri.getScheme();
    if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
      return false;
    }

    return isValidString(uri.getHost());
  }

  private URI parseUri(String value) {
    if (!isValidString(value)) {
      return null;
    }

    try {
      URI parsed = UriBuilder.fromUri(value).build();
      return isSafeHttpUri(parsed) ? parsed : null;
    } catch (IllegalArgumentException ex) {
      return null;
    }
  }

  @Override
  public void action(AuthenticationFlowContext context) {
    /* This is ok */ }

  @Override
  public boolean requiresUser() {
    return false;
  }

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
