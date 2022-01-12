package com.github.bcgov.keycloak.authenticators;

import java.util.List;
import org.keycloak.Config;
import org.keycloak.OAuth2Constants;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.AuthenticatorFactory;
import org.keycloak.authentication.DisplayTypeAuthenticatorFactory;
import org.keycloak.authentication.authenticators.AttemptedAuthenticator;
import org.keycloak.models.AuthenticationExecutionModel.Requirement;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.provider.ProviderConfigProperty;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class CookieStopAuthenticatorFactory
    implements AuthenticatorFactory, DisplayTypeAuthenticatorFactory {
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
  public Authenticator createDisplay(KeycloakSession session, String displayType) {
    if (displayType == null) return new CookieStopAuthenticator();
    if (!OAuth2Constants.DISPLAY_CONSOLE.equalsIgnoreCase(displayType)) return null;
    return AttemptedAuthenticator.SINGLETON; // ignore this authenticator
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
  public void init(Config.Scope config) {}

  @Override
  public void postInit(KeycloakSessionFactory factory) {}

  @Override
  public void close() {}
}
