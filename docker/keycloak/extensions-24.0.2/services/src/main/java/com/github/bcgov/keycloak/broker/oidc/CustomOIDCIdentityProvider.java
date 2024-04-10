package com.github.bcgov.keycloak.broker.oidc;

import org.keycloak.broker.oidc.OIDCIdentityProvider;
import org.keycloak.broker.oidc.OIDCIdentityProviderConfig;
import org.keycloak.models.KeycloakSession;
import org.keycloak.representations.JsonWebToken;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class CustomOIDCIdentityProvider extends OIDCIdentityProvider {

  public CustomOIDCIdentityProvider(KeycloakSession session, OIDCIdentityProviderConfig config) {
    super(session, config);
  }

  @Override
  protected JsonWebToken validateToken(String encodedToken, boolean ignoreAudience) {
    // logger.warn(encodedToken);
    // logger.warn(ignoreAudience);

    return super.validateToken(encodedToken, ignoreAudience);
  }
}
