package com.github.bcgov.keycloak.broker.saml;

import org.keycloak.models.IdentityProviderModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.broker.provider.AbstractIdentityProviderFactory;
import org.keycloak.broker.saml.SAMLIdentityProvider;
import org.keycloak.broker.saml.SAMLIdentityProviderConfig;
import org.keycloak.broker.saml.SAMLIdentityProviderFactory;
import org.keycloak.saml.validators.DestinationValidator;

import java.io.InputStream;
import java.util.Map;

import org.keycloak.Config;

public class OverrideSAMLIdentityProviderFactory extends AbstractIdentityProviderFactory<SAMLIdentityProvider> {

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
    return "SAML v2.0 - Custom";
  }

  @Override
  public void init(Config.Scope config) {
    super.init(config);
    this.destinationValidator = DestinationValidator.forProtocolMap(config.getArray("knownProtocols"));
  }

  @Override
  public SAMLIdentityProviderConfig createConfig() {
    return new SAMLIdentityProviderConfig();
  }

  public Map<String, String> parseConfig(KeycloakSession session, InputStream inputStream) {
    return new SAMLIdentityProviderFactory().parseConfig(session, inputStream);
  }
}
