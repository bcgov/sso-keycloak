package com.github.bcgov.keycloak.authenticators;

import org.keycloak.Config;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.authenticators.browser.UsernamePasswordFormFactory;
import org.keycloak.models.AuthenticationExecutionModel.Requirement;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.provider.ProviderConfigProperty;

import java.util.List;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class IdentityProviderStopAuthenticatorFactory extends UsernamePasswordFormFactory {

  protected static final Requirement[] REQUIREMENT_CHOICES = {
    Requirement.REQUIRED, Requirement.ALTERNATIVE, Requirement.DISABLED
  };

  @Override
  public String getId() {
    return "identity-provider-stopper";
  }

  @Override
  public String getDisplayType() {
    return "Identity Provider Stopper";
  }

  @Override
  public String getHelpText() {
    return "Redirects to allowed Identity Provider or Identity Provider specified with kc_idp_hint query parameter";
  }

  @Override
  public Authenticator create(KeycloakSession session) {
    return new IdentityProviderStopAuthenticator();
  }

  @Override
  public Requirement[] getRequirementChoices() {
    return REQUIREMENT_CHOICES;
  }

  @Override
  public List<ProviderConfigProperty> getConfigProperties() {
    return null;
  }

  @Override
  public String getReferenceCategory() {
    return null;
  }

  @Override
  public boolean isConfigurable() {
    return false;
  }

  @Override
  public boolean isUserSetupAllowed() {
    return true;
  }

  @Override
  public void init(Config.Scope config) { /* This is ok */ }

  @Override
  public void postInit(KeycloakSessionFactory factory) { /* This is ok */ }

  @Override
  public void close() { /* This is ok */ }
}
