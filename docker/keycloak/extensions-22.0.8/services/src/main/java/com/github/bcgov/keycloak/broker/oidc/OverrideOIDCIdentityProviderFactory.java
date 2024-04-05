package com.github.bcgov.keycloak.broker.oidc;

import java.util.List;

import org.keycloak.broker.oidc.OIDCIdentityProvider;
import org.keycloak.broker.oidc.OIDCIdentityProviderConfig;
import org.keycloak.broker.oidc.OIDCIdentityProviderFactory;
import org.keycloak.models.IdentityProviderModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.provider.ProviderConfigurationBuilder;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class OverrideOIDCIdentityProviderFactory extends OIDCIdentityProviderFactory {

  public static final String PROVIDER_ID = "oidc";

  @Override
  public String getName() {
    return "OpenID Connect v1.0";
  }

  @Override
  public OIDCIdentityProvider create(KeycloakSession session, IdentityProviderModel model) {
    return new OverrideOIDCIdentityProvider(session, new OIDCIdentityProviderConfig(model));
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }

  public List<ProviderConfigProperty> getConfigProperties() {
    return ProviderConfigurationBuilder.create().property()
        .name("legacyLogoutRedirectUriSupported").label("Legacy Logout Redirect URI")
        .helpText("Does the external IDP support legacy logout redirect URI (redirect_uri)?")
        .type(ProviderConfigProperty.BOOLEAN_TYPE).add().build();
  }
}
