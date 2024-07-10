package com.github.bcgov.keycloak.broker.oidc;

import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriBuilder;
import jakarta.ws.rs.core.UriInfo;
import org.jboss.logging.Logger;
import org.keycloak.broker.oidc.OIDCIdentityProvider;
import org.keycloak.broker.oidc.OIDCIdentityProviderConfig;
import org.keycloak.common.util.Time;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserSessionModel;
import org.keycloak.representations.AccessTokenResponse;
import org.keycloak.services.resources.IdentityBrokerService;
import org.keycloak.services.resources.RealmsResource;
import org.keycloak.util.JsonSerialization;

import java.io.IOException;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class OverrideOIDCIdentityProvider extends OIDCIdentityProvider {

  private static final Logger logger = Logger.getLogger(OverrideOIDCIdentityProvider.class);

  public OverrideOIDCIdentityProvider(KeycloakSession session, OIDCIdentityProviderConfig config) {
    super(session, config);
  }

  @Override
  public Response keycloakInitiatedBrowserLogout(
      KeycloakSession session, UserSessionModel userSession, UriInfo uriInfo, RealmModel realm) {
    if (getConfig().getLogoutUrl() == null || getConfig().getLogoutUrl().trim().equals(""))
      return null;

    String idToken = getIDTokenForLogout(session, userSession);
    if (idToken != null && getConfig().isBackchannelSupported()) {
      backchannelLogout(userSession, idToken);
      return null;
    }

    String sessionId = userSession.getId();
    UriBuilder logoutUri =
        UriBuilder.fromUri(getConfig().getLogoutUrl()).queryParam("state", sessionId);
    String redirect =
        RealmsResource.brokerUrl(uriInfo)
            .path(IdentityBrokerService.class, "getEndpoint")
            .path(OIDCEndpoint.class, "logoutResponse")
            .build(realm.getName(), getConfig().getAlias())
            .toString();

    if (idToken != null) {
      logoutUri.queryParam("id_token_hint", idToken);
      logoutUri.queryParam("post_logout_redirect_uri", redirect);
    } else {
      if (!isLegacyLogoutRedirectUriSupported()) {
        logger.warn("no id_token found and legacy logout redirect uri not supported: " + redirect);
        return null;
      }

      logger.warn("no id_token found; use legacy redirect_uri query param: " + redirect);
      logoutUri.queryParam("redirect_uri", redirect);
    }

    return Response.status(302).location(logoutUri.build()).build();
  }

  private String getIDTokenForLogout(KeycloakSession session, UserSessionModel userSession) {
    String tokenExpirationString = userSession.getNote(FEDERATED_TOKEN_EXPIRATION);
    long exp = tokenExpirationString == null ? 0 : Long.parseLong(tokenExpirationString);
    int currentTime = Time.currentTime();
    if (exp > 0 && currentTime > exp) {
      String response = refreshTokenForLogout(session, userSession);
      AccessTokenResponse tokenResponse = null;
      try {
        tokenResponse = JsonSerialization.readValue(response, AccessTokenResponse.class);
      } catch (IOException e) {
        throw new RuntimeException(e);
      }
      return tokenResponse.getIdToken();
    } else {
      return userSession.getNote(FEDERATED_ID_TOKEN);
    }
  }

  public boolean isLegacyLogoutRedirectUriSupported() {
    return Boolean.valueOf(getConfig().getConfig().get("legacyLogoutRedirectUriSupported"));
  }
}
