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
public class CookieStopAuthenticatorFactory extends UsernamePasswordFormFactory {
  protected static final Requirement[] REQUIREMENT_CHOICES = {
    Requirement.REQUIRED, Requirement.ALTERNATIVE, Requirement.DISABLED
  };

  @Override
  public String getId() {
    return "cookie-stopper";
  }

  @Override
  public String getDisplayType() {
    return "Cookie Stopper";
  }

  @Override
  public String getHelpText() {
    return "Validates the SSO cookie set by the auth server.";
  }

  @Override
  public Authenticator create(KeycloakSession session) {
    return new CookieStopAuthenticator();
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
    return "cookie";
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
