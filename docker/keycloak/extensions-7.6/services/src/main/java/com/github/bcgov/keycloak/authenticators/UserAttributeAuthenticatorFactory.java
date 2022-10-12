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
public class UserAttributeAuthenticatorFactory
    implements AuthenticatorFactory, DisplayTypeAuthenticatorFactory {

  protected static final Requirement[] REQUIREMENT_CHOICES = {Requirement.REQUIRED};

  public static final String ATTRIBUTE_KEY = "attributeKey";
  public static final String ATTRIBUTE_VALUE = "attributeValue";
  public static final String ERROR_URL = "errorUrl";
  private static final List<ProviderConfigProperty> configProperties =
      new ArrayList<ProviderConfigProperty>();

  static {
    ProviderConfigProperty property;
    property = new ProviderConfigProperty();
    property.setName(ATTRIBUTE_KEY);
    property.setLabel("Attribute Key");
    property.setType(ProviderConfigProperty.STRING_TYPE);
    property.setHelpText("Attribute key to look for the value");
    configProperties.add(property);

    property = new ProviderConfigProperty();
    property.setName(ATTRIBUTE_VALUE);
    property.setLabel("Attribute Value");
    property.setType(ProviderConfigProperty.STRING_TYPE);
    property.setHelpText("Attribute value to match with");
    configProperties.add(property);

    property = new ProviderConfigProperty();
    property.setName(ERROR_URL);
    property.setLabel("Error URL");
    property.setType(ProviderConfigProperty.STRING_TYPE);
    property.setHelpText(
        "Error URL to redirect the request when the attribute does not match. (Defaults to client base URL)");
    configProperties.add(property);
  }

  @Override
  public String getId() {
    return "user-attribute-authenticator";
  }

  @Override
  public String getDisplayType() {
    return "User Attribute Authenticator";
  }

  @Override
  public String getHelpText() {
    return "Authenticate user based on it's attribute";
  }

  @Override
  public Authenticator create(KeycloakSession session) {
    return new UserAttributeAuthenticator();
  }

  @Override
  public Authenticator createDisplay(KeycloakSession session, String displayType) {
    if (displayType == null) return new UserAttributeAuthenticator();
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
