package com.github.bcgov.keycloak.broker.oidc;

import org.jboss.logging.Logger;
import org.keycloak.broker.oidc.OIDCIdentityProvider;
import org.keycloak.broker.oidc.OIDCIdentityProviderConfig;
import org.keycloak.broker.provider.AuthenticationRequest;
import org.keycloak.constants.AdapterConstants;
import org.keycloak.models.ClientModel;
import org.keycloak.models.KeycloakSession;

import jakarta.ws.rs.core.UriBuilder;

/** OIDC Identity Provider that replaces the {@code kc_idp_hint} query parameter with the
 *  initiating Keycloak client's client ID before sending the authorization request upstream,
 *  but only when the realm is {@link #STANDARD_REALM}, the incoming request was originally
 *  hinted for {@link #BCGOVIDIR_HINT}, and the client has {@link #BCGOVIDIR_HINT} assigned
 *  as a default scope.
 */
public class ClientIdKcHintOIDCIdentityProvider extends OIDCIdentityProvider {

  private static final Logger logger = Logger.getLogger(ClientIdKcHintOIDCIdentityProvider.class);

  static final String KC_IDP_HINT_PARAM = "kc_idp_hint";
  static final String BCGOVIDIR_HINT = "bcgovidir";
  static final String STANDARD_REALM = "standard";

  public ClientIdKcHintOIDCIdentityProvider(KeycloakSession session, OIDCIdentityProviderConfig config) {
    super(session, config);
  }

  @Override
  public UriBuilder createAuthorizationUrl(AuthenticationRequest request) {
    UriBuilder ub = super.createAuthorizationUrl(request);

    String originalHint = request.getUriInfo().getQueryParameters().getFirst(AdapterConstants.KC_IDP_HINT);
    if (!STANDARD_REALM.equals(request.getRealm().getName()) || !BCGOVIDIR_HINT.equals(originalHint)) {
      return ub;
    }

    ClientModel client = request.getAuthenticationSession() != null
        ? request.getAuthenticationSession().getClient()
        : null;
    if (client == null || !client.getClientScopes(true).containsKey(BCGOVIDIR_HINT)) {
      return ub;
    }

    String clientId = client.getClientId();
    if (clientId != null && !clientId.isBlank()) {
      ub.replaceQueryParam(KC_IDP_HINT_PARAM, clientId);
    }

    return ub;
  }
}
