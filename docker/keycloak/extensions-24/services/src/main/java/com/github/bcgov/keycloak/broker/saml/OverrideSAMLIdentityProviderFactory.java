package com.github.bcgov.keycloak.broker.saml;

import org.keycloak.models.IdentityProviderModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.Config.Scope;
import org.keycloak.broker.saml.SAMLIdentityProviderConfig;
import org.keycloak.broker.saml.SAMLIdentityProviderFactory;
import org.keycloak.saml.validators.DestinationValidator;

public class OverrideSAMLIdentityProviderFactory extends SAMLIdentityProviderFactory {

  private DestinationValidator destinationValidator;

  @Override
  public OverrideSAMLIdentityProvider create(KeycloakSession session, IdentityProviderModel model) {
    return new OverrideSAMLIdentityProvider(session, new SAMLIdentityProviderConfig(model), destinationValidator);
  }

  @Override
  public String getName() {
    return "SAML v2.0 - Custom";
  }

  @Override
  public void init(Scope config) {
    super.init(config);
    this.destinationValidator = DestinationValidator.forProtocolMap(config.getArray("knownProtocols"));
  }
}
