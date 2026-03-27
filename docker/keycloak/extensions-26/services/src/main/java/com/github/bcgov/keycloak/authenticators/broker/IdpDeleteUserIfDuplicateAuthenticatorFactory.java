package com.github.bcgov.keycloak.authenticators.broker;

import org.keycloak.Config;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.AuthenticatorFactory;
import org.keycloak.models.AuthenticationExecutionModel.Requirement;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.provider.ProviderConfigProperty;

import java.util.ArrayList;
import java.util.List;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class IdpDeleteUserIfDuplicateAuthenticatorFactory implements AuthenticatorFactory {

  protected static final Requirement[] REQUIREMENT_CHOICES = {
      Requirement.REQUIRED, Requirement.ALTERNATIVE, Requirement.DISABLED
  };

  private static final List<ProviderConfigProperty> configProperties = new ArrayList<ProviderConfigProperty>();

  static {
    ProviderConfigProperty property;
    property = new ProviderConfigProperty();
    property.setName("preserveClientRoles");
    property.setLabel("Preserve Client Roles");
    property.setType(ProviderConfigProperty.BOOLEAN_TYPE);
    property.setHelpText("Preserve client roles assigned to the user");
    property.setDefaultValue(false);
    configProperties.add(property);

    property = new ProviderConfigProperty();
    property.setName("preserveRealmRoles");
    property.setLabel("Preserve Realm Roles");
    property.setType(ProviderConfigProperty.BOOLEAN_TYPE);
    property.setHelpText("Preserve realm roles assigned to the user");
    property.setDefaultValue(false);
    configProperties.add(property);
  }

  @Override
  public String getId() {
    return "idp-delete-user-if-duplicate";
  }

  @Override
  public String getDisplayType() {
    return "Delete User If Duplicate";
  }

  @Override
  public String getHelpText() {
    return "Delete old user if there is duplicate Keycloak account with the same username";
  }

  @Override
  public Authenticator create(KeycloakSession session) {
    return new IdpDeleteUserIfDuplicateAuthenticator();
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
    return "deleteUserIfDuplicate";
  }

  @Override
  public boolean isConfigurable() {
    return true;
  }

  @Override
  public boolean isUserSetupAllowed() {
    return false;
  }

  @Override
  public void init(Config.Scope config) {
    /* This is ok */ }

  @Override
  public void postInit(KeycloakSessionFactory factory) {
    /* This is ok */ }

  @Override
  public void close() {
    /* This is ok */ }
}
