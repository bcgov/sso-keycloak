package com.github.bcgov.keycloak.protocol.oidc.ext.endpoints;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriBuilder;
import org.keycloak.events.EventBuilder;
import org.keycloak.models.KeycloakSession;
import org.keycloak.protocol.oidc.OIDCLoginProtocol;
import org.keycloak.protocol.oidc.OIDCLoginProtocolService;
import org.keycloak.protocol.oidc.ext.OIDCExtProvider;
import org.keycloak.protocol.oidc.ext.OIDCExtProviderFactory;
import org.keycloak.provider.EnvironmentDependentProviderFactory;
import org.keycloak.services.managers.AuthenticationManager;
import org.keycloak.urls.UrlType;

import java.net.URI;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class LegacyEndpoint
    implements OIDCExtProvider, OIDCExtProviderFactory, EnvironmentDependentProviderFactory {

  public static final String PROVIDER_ID = "legacy";

  private EventBuilder event;

  private final KeycloakSession session;

  public LegacyEndpoint() {
    // for reflection
    this(null);
  }

  public LegacyEndpoint(KeycloakSession session) {
    this.session = session;
  }

  /**
   * This endpoint parses the query params and regenerates them to redirect back to the OIDC logout
   * endpoint. `id_token_hint`, `state`, `ui_locales`, and `initiating_idp` are passed through as
   * they are.
   *
   * <p>1. if `id_token_hint` exists, it sets the redirect uri to `post_logout_redirect_uri`.<br>
   * 2. if `id_token_hint` omitted, it sets the redirect uri to `redirect_uri` (legacy).
   *
   * @param deprecatedRedirectUri "redirect_uri"
   * @param encodedIdToken "id_token_hint"
   * @param postLogoutRedirectUri "post_logout_redirect_uri"
   * @param state "state"
   * @param uiLocales "ui_locales"
   * @param initiatingIdp "initiating_idp"
   * @return a redirect Response with the regenerated query params.
   */
  @GET
  @Path("/logout")
  public Response logout(
      @QueryParam(OIDCLoginProtocol.REDIRECT_URI_PARAM) String deprecatedRedirectUri, // deprecated
      @QueryParam(OIDCLoginProtocol.ID_TOKEN_HINT) String encodedIdToken,
      @QueryParam(OIDCLoginProtocol.POST_LOGOUT_REDIRECT_URI_PARAM) String postLogoutRedirectUri,
      @QueryParam(OIDCLoginProtocol.STATE_PARAM) String state,
      @QueryParam(OIDCLoginProtocol.UI_LOCALES_PARAM) String uiLocales,
      @QueryParam(AuthenticationManager.INITIATING_IDP_PARAM) String initiatingIdp) {
    String realmName = session.getContext().getRealm().getName();
    UriBuilder uriBuilder =
        OIDCLoginProtocolService.logoutUrl(session.getContext().getUri(UrlType.FRONTEND));

    if (encodedIdToken != null) {
      uriBuilder = uriBuilder.queryParam(OIDCLoginProtocol.ID_TOKEN_HINT, encodedIdToken);
    }

    if (state != null) {
      uriBuilder = uriBuilder.queryParam(OIDCLoginProtocol.STATE_PARAM, state);
    }

    if (uiLocales != null) {
      uriBuilder = uriBuilder.queryParam(OIDCLoginProtocol.UI_LOCALES_PARAM, uiLocales);
    }

    if (initiatingIdp != null) {
      uriBuilder = uriBuilder.queryParam(AuthenticationManager.INITIATING_IDP_PARAM, initiatingIdp);
    }

    String redirectUri =
        postLogoutRedirectUri != null ? postLogoutRedirectUri : deprecatedRedirectUri;

    if (redirectUri != null) {
      if (encodedIdToken != null) {
        uriBuilder =
            uriBuilder.queryParam(OIDCLoginProtocol.POST_LOGOUT_REDIRECT_URI_PARAM, redirectUri);
      } else {
        uriBuilder = uriBuilder.queryParam(OIDCLoginProtocol.REDIRECT_URI_PARAM, redirectUri);
      }
    }

    URI redirect = uriBuilder.build(realmName);

    return Response.status(302).location(redirect).build();
  }

  @Override
  public OIDCExtProvider create(KeycloakSession session) {
    return new LegacyEndpoint(session);
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }

  @Override
  public void setEvent(EventBuilder event) {
    this.event = event;
  }

  @Override
  public void close() { /* This is ok */ }

  @Override
  public boolean isSupported() {
    return true;
  }
}
