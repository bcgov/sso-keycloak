package com.github.bcgov.keycloak.authenticators;

import java.util.List;

import org.keycloak.Config;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.AuthenticatorFactory;
import org.keycloak.models.AuthenticationExecutionModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.provider.ProviderConfigProperty;

public class UserRiskEvaluationAuthenticatorFactory implements AuthenticatorFactory {

  public static final String PROVIDER_ID = "user-risk-evaluator";

  static UserRiskEvaluationAuthenticator SINGLETON = new UserRiskEvaluationAuthenticator();

  @Override
  public Authenticator create(KeycloakSession session) {
    return SINGLETON;
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

  @Override
  public String getId() {
    return PROVIDER_ID;
  }

  @Override
  public String getReferenceCategory() {
    return "user-risk-evaluator";
  }

  @Override
  public boolean isConfigurable() {
    return false;
  }

  @Override
  public AuthenticationExecutionModel.Requirement[] getRequirementChoices() {
    return REQUIREMENT_CHOICES;
  }

  @Override
  public String getDisplayType() {
    return "User Risk Evaluator";
  }

  @Override
  public String getHelpText() {
    return "Calculates the risk score for the user attempting to login.";
  }

  @Override
  public List<ProviderConfigProperty> getConfigProperties() {
    return null;
  }

  @Override
  public boolean isUserSetupAllowed() {
    return false;
  }
}
