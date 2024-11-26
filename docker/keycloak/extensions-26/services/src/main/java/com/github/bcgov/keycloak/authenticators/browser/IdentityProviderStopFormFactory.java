package com.github.bcgov.keycloak.authenticators.browser;

import org.keycloak.Config;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.authenticators.browser.UsernamePasswordFormFactory;
import org.keycloak.models.AuthenticationExecutionModel.Requirement;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.provider.ProviderConfigProperty;

import java.util.List;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class IdentityProviderStopFormFactory extends UsernamePasswordFormFactory {
  protected static final Requirement[] REQUIREMENT_CHOICES = {
    Requirement.REQUIRED, Requirement.ALTERNATIVE, Requirement.DISABLED
  };
  public static final IdentityProviderStopForm SINGLETON = new IdentityProviderStopForm();

  @Override
  public String getId() {
    return "identity-provider-stop-form";
  }

  @Override
  public String getDisplayType() {
    return "Identity Provider Stop Form";
  }

  @Override
  public String getHelpText() {
    return "Display allowed IDPs for the authenticating client";
  }

  @Override
  public Authenticator create(KeycloakSession session) {
    return SINGLETON;
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
    return false;
  }

  @Override
  public void init(Config.Scope config) { /* This is ok */ }

  @Override
  public void postInit(KeycloakSessionFactory factory) { /* This is ok */ }

  @Override
  public void close() { /* This is ok */ }
}
