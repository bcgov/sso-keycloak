package com.github.bcgov.keycloak.authenticators;

import java.util.List;
import org.keycloak.Config;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.AuthenticatorFactory;
import org.keycloak.models.AuthenticationExecutionModel.Requirement;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.provider.ProviderConfigProperty;

public class UserSessionRemoverFactory implements AuthenticatorFactory {

  protected static final Requirement[] REQUIREMENT_CHOICES = {
      Requirement.REQUIRED, Requirement.ALTERNATIVE, Requirement.DISABLED
  };

  private static final Authenticator AUTHENTICATOR_INSTANCE = new UserSessionRemover();

  @Override
  public String getId() {
    return "user-session-remover";
  }

  @Override
  public String getDisplayType() {
    return "User Session Remover";
  }

  @Override
  public String getHelpText() {
    return "Checks if the user session is realted to any other client, and removes it if so.";
  }

  @Override
  public Authenticator create(KeycloakSession session) {
    return AUTHENTICATOR_INSTANCE;
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
  public void init(Config.Scope config) {
  }

  @Override
  public void postInit(KeycloakSessionFactory factory) {
  }

  @Override
  public void close() {
  }
}
