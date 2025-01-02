package com.github.bcgov.keycloak.broker.saml;

import org.jboss.logging.Logger;
import org.keycloak.broker.saml.SAMLIdentityProvider;
import org.keycloak.broker.saml.SAMLIdentityProviderConfig;
import org.keycloak.events.EventBuilder;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.saml.validators.DestinationValidator;

public class OverrideSAMLIdentityProvider extends SAMLIdentityProvider {

  protected static final Logger logger = Logger.getLogger(OverrideSAMLIdentityProvider.class);

  private final DestinationValidator destinationValidator;

  public OverrideSAMLIdentityProvider(KeycloakSession session, SAMLIdentityProviderConfig config,
      DestinationValidator destinationValidator) {
    super(session, config, destinationValidator);
    this.destinationValidator = destinationValidator;
  }

  @Override
  public Object callback(RealmModel realm, AuthenticationCallback callback, EventBuilder event) {
    return new CustomSAMLEndpoint(session, this, getConfig(), callback, destinationValidator);
  }
}
