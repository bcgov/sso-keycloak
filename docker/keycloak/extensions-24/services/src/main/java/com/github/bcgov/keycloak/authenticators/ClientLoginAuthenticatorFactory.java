package com.github.bcgov.keycloak.authenticators;

import org.keycloak.Config;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.authenticators.browser.UsernamePasswordFormFactory;
import org.keycloak.models.AuthenticationExecutionModel.Requirement;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.provider.ProviderConfigProperty;

import java.util.ArrayList;
import java.util.List;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class ClientLoginAuthenticatorFactory extends UsernamePasswordFormFactory {

  protected static final Requirement[] REQUIREMENT_CHOICES = {
    Requirement.REQUIRED, Requirement.ALTERNATIVE, Requirement.DISABLED
  };

  public static final String MEMBER_ROLE_NAME = "memberRole";
  private static final List<ProviderConfigProperty> configProperties =  new ArrayList<>();

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
  public void init(Config.Scope config) { /* This is ok */ }

  @Override
  public void postInit(KeycloakSessionFactory factory) { /* This is ok */ }

  @Override
  public void close() { /* This is ok */ }
}
