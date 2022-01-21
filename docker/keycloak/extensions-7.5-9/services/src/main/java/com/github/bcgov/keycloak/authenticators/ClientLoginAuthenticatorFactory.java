package com.github.bcgov.keycloak.authenticators;

import java.util.ArrayList;
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
public class ClientLoginAuthenticatorFactory
    implements AuthenticatorFactory, DisplayTypeAuthenticatorFactory {

  protected static final Requirement[] REQUIREMENT_CHOICES = {
    Requirement.REQUIRED, Requirement.ALTERNATIVE, Requirement.DISABLED
  };

  public static final String MEMBER_ROLE_NAME = "memberRole";
  private static final List<ProviderConfigProperty> configProperties =
      new ArrayList<ProviderConfigProperty>();

  static {
    ProviderConfigProperty property;
    property = new ProviderConfigProperty();
    property.setName(MEMBER_ROLE_NAME);
    property.setLabel("Client Member Role");
    property.setType(ProviderConfigProperty.STRING_TYPE);
    property.setHelpText("Role name to grant to user. default to 'member'");
    configProperties.add(property);
  }

  @Override
  public String getId() {
    return "client-login-authenticator";
  }

  @Override
  public String getDisplayType() {
    return "Client Login Authenticator";
  }

  @Override
  public String getHelpText() {
    return "Associates the authenticating/authenticated users to the client";
  }

  @Override
  public Authenticator create(KeycloakSession session) {
    return new ClientLoginAuthenticator();
  }

  @Override
  public Authenticator createDisplay(KeycloakSession session, String displayType) {
    if (displayType == null) return new ClientLoginAuthenticator();
    if (!OAuth2Constants.DISPLAY_CONSOLE.equalsIgnoreCase(displayType)) return null;
    return AttemptedAuthenticator.SINGLETON; // ignore this authenticator
  }

  @Override
  public Requirement[] getRequirementChoices() {
    return REQUIREMENT_CHOICES;
  }

  @Override
  public List<ProviderConfigProperty> getConfigProperties() {
    return configProperties;
  }

  @Override
  public String getReferenceCategory() {
    return null;
  }

  @Override
  public boolean isConfigurable() {
    return true;
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
