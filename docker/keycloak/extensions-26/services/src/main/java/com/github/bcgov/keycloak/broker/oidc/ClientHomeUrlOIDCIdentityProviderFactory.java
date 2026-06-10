package com.github.bcgov.keycloak.broker.oidc;

import org.keycloak.broker.oidc.OIDCIdentityProvider;
import org.keycloak.broker.oidc.OIDCIdentityProviderConfig;
import org.keycloak.broker.oidc.OIDCIdentityProviderFactory;
import org.keycloak.models.IdentityProviderModel;
import org.keycloak.models.KeycloakSession;

public class ClientHomeUrlOIDCIdentityProviderFactory extends OIDCIdentityProviderFactory {

  public static final String PROVIDER_ID = "oidc-client-home";

  @Override
  public String getName() {
    return "OpenID Connect v1.0 - Client Home URL";
  }

  @Override
  public OIDCIdentityProvider create(KeycloakSession session, IdentityProviderModel model) {
    return new ClientHomeUrlOIDCIdentityProvider(session, new OIDCIdentityProviderConfig(model));
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }
}
