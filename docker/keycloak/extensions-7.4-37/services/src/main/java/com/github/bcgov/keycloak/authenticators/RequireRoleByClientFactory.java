/*
 * Copyright 2016 Red Hat, Inc. and/or its affiliates
 * and other contributors as indicated by the @author tags.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.github.bcgov.keycloak.authenticators;

import java.util.ArrayList;
import java.util.List;
import org.keycloak.Config;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.AuthenticatorFactory;
import org.keycloak.models.AuthenticationExecutionModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.provider.ProviderConfigProperty;

/** @author <a href="mailto:mposolda@redhat.com">Marek Posolda</a> */
public class RequireRoleByClientFactory implements AuthenticatorFactory {

  public static final String PROVIDER_ID = "bcgov-required-role-by-client";
  public static final String CLIENT_NAME = PROVIDER_ID + ".client";
  public static final String ROLE_NAME = PROVIDER_ID + ".role";
  public static final String ERROR_URL = PROVIDER_ID + ".error-url";

  static RequireRoleByClient SINGLETON = new RequireRoleByClient();

  private static final List<ProviderConfigProperty> configProperties =
      new ArrayList<ProviderConfigProperty>();

  static {
    ProviderConfigProperty property;
    property = new ProviderConfigProperty();
    property.setName(CLIENT_NAME);
    property.setLabel("Client/Application");
    property.setType(ProviderConfigProperty.STRING_TYPE);
    property.setHelpText("Select a client this action will be applied");
    configProperties.add(property);

    property = new ProviderConfigProperty();
    property.setName(ROLE_NAME);
    property.setLabel("Required Role");
    property.setType(ProviderConfigProperty.ROLE_TYPE);
    property.setHelpText("Select a role a user must have when requested by the defined client");
    configProperties.add(property);

    property = new ProviderConfigProperty();
    property.setName(ERROR_URL);
    property.setLabel("Error URL");
    property.setType(ProviderConfigProperty.STRING_TYPE);
    property.setHelpText(
        "Error URL to redirect user when role is missing. (Defaults to client base URL)");
    configProperties.add(property);
  }

  @Override
  public Authenticator create(KeycloakSession session) {
    return SINGLETON;
  }

  @Override
  public void init(Config.Scope config) {
    // no-op
  }

  @Override
  public void postInit(KeycloakSessionFactory factory) {
    // no-op
  }

  @Override
  public void close() {
    // no-op
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }

  @Override
  public String getReferenceCategory() {
    return "custom";
  }

  @Override
  public boolean isConfigurable() {
    return true;
  }

  public static final AuthenticationExecutionModel.Requirement[] REQUIREMENT_CHOICES = {
    AuthenticationExecutionModel.Requirement.REQUIRED
  };

  @Override
  public AuthenticationExecutionModel.Requirement[] getRequirementChoices() {
    return REQUIREMENT_CHOICES;
  }

  @Override
  public String getDisplayType() {
    return "Required Role By Client";
  }

  @Override
  public String getHelpText() {
    return "Validates that a user MUST have a specific role when logging in from a specific client. If it fails, it redirects to the client's base URL";
  }

  @Override
  public boolean isUserSetupAllowed() {
    return false;
  }

  @Override
  public List<ProviderConfigProperty> getConfigProperties() {
    return configProperties;
  }
}
