package com.github.bcgov.keycloak.broker.oidc;

import org.jboss.logging.Logger;
import org.keycloak.broker.oidc.OIDCIdentityProvider;
import org.keycloak.broker.oidc.OIDCIdentityProviderConfig;
import org.keycloak.broker.provider.AuthenticationRequest;
import org.keycloak.models.ClientModel;
import org.keycloak.models.KeycloakSession;

import jakarta.ws.rs.core.UriBuilder;

/** OIDC Identity Provider that appends the initiating Keycloak client's Home URL
 *  as a {@code client_home_url} query parameter on every upstream authorization request.
 *  The parameter is omitted when the client has no Home URL configured.
 */
public class ClientHomeUrlOIDCIdentityProvider extends OIDCIdentityProvider {

  private static final Logger logger = Logger.getLogger(ClientHomeUrlOIDCIdentityProvider.class);

  static final String CLIENT_HOME_URL_PARAM = "client_home_url";

  public ClientHomeUrlOIDCIdentityProvider(KeycloakSession session, OIDCIdentityProviderConfig config) {
    super(session, config);
  }

  @Override
  public UriBuilder createAuthorizationUrl(AuthenticationRequest request) {
    UriBuilder ub = super.createAuthorizationUrl(request);

    ClientModel client = request.getAuthenticationSession() != null
        ? request.getAuthenticationSession().getClient()
        : null;
    String homeUrl = client != null ? client.getBaseUrl() : null;

    if (homeUrl != null && !homeUrl.isBlank()) {
      ub.queryParam(CLIENT_HOME_URL_PARAM, homeUrl);
    }

    return ub;
  }
}
