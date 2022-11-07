package com.github.bcgov.keycloak.authenticators;

import java.util.Collections;
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
public class ClientLoginRoleBindingFactory
    implements AuthenticatorFactory, DisplayTypeAuthenticatorFactory {

  protected static final Requirement[] REQUIREMENT_CHOICES = {Requirement.REQUIRED};

  @Override
  public String getId() {
    return "client-login-role-binding";
  }

  @Override
  public String getDisplayType() {
    return "Client Login Role Binding";
  }

  @Override
  public String getHelpText() {
    return "assign the authenticated user the realm-level role for the client";
  }

  @Override
  public Authenticator create(KeycloakSession session) {
    return new ClientLoginRoleBinding();
  }

  @Override
  public Authenticator createDisplay(KeycloakSession session, String displayType) {
    if (displayType == null) return new ClientLoginRoleBinding();
    if (!OAuth2Constants.DISPLAY_CONSOLE.equalsIgnoreCase(displayType)) return null;
    return AttemptedAuthenticator.SINGLETON; // ignore this authenticator
  }

  @Override
  public Requirement[] getRequirementChoices() {
    return REQUIREMENT_CHOICES;
  }

  @Override
  public List<ProviderConfigProperty> getConfigProperties() {
    return Collections.emptyList();
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
  public void init(Config.Scope config) {}

  @Override
  public void postInit(KeycloakSessionFactory factory) {}

  @Override
  public void close() {}
}
