package com.github.bcgov.keycloak.broker.saml;

import org.keycloak.models.IdentityProviderModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.broker.saml.SAMLIdentityProviderConfig;
import org.keycloak.broker.saml.SAMLIdentityProviderFactory;
import org.keycloak.saml.validators.DestinationValidator;

public class OverrideSAMLIdentityProviderFactory extends SAMLIdentityProviderFactory {

  public static final String PROVIDER_ID = "saml-custom";
  private DestinationValidator destinationValidator;

  @Override
  public String getId() {
    return PROVIDER_ID;
  }

  @Override
  public OverrideSAMLIdentityProvider create(KeycloakSession session, IdentityProviderModel model) {
    return new OverrideSAMLIdentityProvider(session, new SAMLIdentityProviderConfig(model), destinationValidator);
  }

  @Override
  public String getName() {
    return "Custom SAML Identity Provider";
  }
}
