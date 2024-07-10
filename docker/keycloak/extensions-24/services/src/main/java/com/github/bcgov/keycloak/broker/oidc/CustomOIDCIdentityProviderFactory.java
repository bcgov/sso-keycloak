package com.github.bcgov.keycloak.broker.oidc;

import org.keycloak.broker.oidc.OIDCIdentityProvider;
import org.keycloak.broker.oidc.OIDCIdentityProviderConfig;
import org.keycloak.broker.oidc.OIDCIdentityProviderFactory;
import org.keycloak.models.IdentityProviderModel;
import org.keycloak.models.KeycloakSession;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class CustomOIDCIdentityProviderFactory extends OIDCIdentityProviderFactory {

  public static final String PROVIDER_ID = "oidc-custom";

  @Override
  public String getName() {
    return "OpenID Connect v1.0 - Custom";
  }

  @Override
  public OIDCIdentityProvider create(KeycloakSession session, IdentityProviderModel model) {
    return new CustomOIDCIdentityProvider(session, new OIDCIdentityProviderConfig(model));
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }
}
