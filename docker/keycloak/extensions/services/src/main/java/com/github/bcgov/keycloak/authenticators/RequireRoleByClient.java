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

import java.io.ByteArrayInputStream;
import javax.json.Json;
import javax.json.JsonObject;
import javax.json.JsonReader;
import javax.json.JsonString;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.ResponseBuilder;
import javax.ws.rs.core.UriBuilder;
import org.jboss.logging.Logger;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.AuthenticationFlowError;
import org.keycloak.models.AuthenticatorConfigModel;
import org.keycloak.models.ClientModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.RoleModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.utils.KeycloakModelUtils;
import org.keycloak.services.messages.Messages;
import org.keycloak.sessions.AuthenticationSessionModel;

/**
 * @author <a href="mailto:bill@burkecentral.com">Bill Burke</a>
 * @version $Revision: 1 $
 */
public class RequireRoleByClient implements org.keycloak.authentication.Authenticator {
  private static Logger logger = Logger.getLogger(RequireRoleByClient.class);

  @Override
  public void authenticate(AuthenticationFlowContext context) {
    AuthenticatorConfigModel config = context.getAuthenticatorConfig();
    String client = config.getConfig().get(RequireRoleByClientFactory.CLIENT_NAME);
    String roleName = config.getConfig().get(RequireRoleByClientFactory.ROLE_NAME);
    String errorUrl = config.getConfig().get(RequireRoleByClientFactory.ERROR_URL);

    AuthenticationSessionModel authSession = context.getAuthenticationSession();
    String identityProviderId = null;

    String brokeredIdentityContext = authSession.getAuthNote("PBL_BROKERED_IDENTITY_CONTEXT");
    if (brokeredIdentityContext != null) {
      JsonReader reader =
          Json.createReader(
              new ByteArrayInputStream(
                  authSession.getAuthNote("PBL_BROKERED_IDENTITY_CONTEXT").getBytes()));
      JsonObject jsonst = (JsonObject) reader.read();
      identityProviderId = ((JsonString) jsonst.get("identityProviderId")).getString();
    }

    // brokerContext.getIdpConfig().getAlias()

    ClientModel sessionClient = context.getAuthenticationSession().getClient();
    boolean authShouldFail = false;

    if (hasAuthenticatorConfig(context)
        && client != null
        && roleName != null
        && client.length() > 0
        && roleName.length() > 0) {
      logger.infof(
          "Validating if user has role '%s' when coming from client '%s'", roleName, client);
      logger.infof("Expected client '%s', found client '%s'", client, sessionClient.getClientId());
      if ((client.equalsIgnoreCase(sessionClient.getClientId()))) {
        RoleModel role = KeycloakModelUtils.getRoleFromString(context.getRealm(), roleName);

        if (role == null || (context.getUser() != null && !context.getUser().hasRole(role))) {
          authShouldFail = true;
        }
      }
    } else {
      Response challengeResponse =
          context
              .form()
              .setError(Messages.INTERNAL_SERVER_ERROR)
              .createErrorPage(Response.Status.INTERNAL_SERVER_ERROR);
      context.challenge(challengeResponse);
      return;
    }

    if (authShouldFail) {
      logger.infof("User does not have required role '%s'", roleName, client);
      UriBuilder uriBuilder = null;
      if (errorUrl != null && errorUrl.length() > 0) {
        if (identityProviderId != null) {
          errorUrl = errorUrl.replace("${idp_alias}", identityProviderId);
        } else {
          errorUrl = errorUrl.replace("${idp_alias}", "null");
        }
        // errorUrl=errorUrl.replace("${client_id}", sessionClient.getClientId());
        uriBuilder = UriBuilder.fromUri(errorUrl);
      } else {
        uriBuilder = UriBuilder.fromUri(sessionClient.getBaseUrl());
        // uriBuilder.queryParam("error", "Access Denied (Missing Required Role)");
      }

      ResponseBuilder responseBuilder = Response.temporaryRedirect(uriBuilder.build());
      responseBuilder.type(MediaType.TEXT_PLAIN_TYPE);
      context.failure(AuthenticationFlowError.INVALID_USER, responseBuilder.build());
      return;
    }

    context.success();
  }

  private boolean hasAuthenticatorConfig(AuthenticationFlowContext context) {
    return context != null
        && context.getAuthenticatorConfig() != null
        && context.getAuthenticatorConfig().getConfig() != null
        && !context.getAuthenticatorConfig().getConfig().isEmpty();
  }

  @Override
  public void close() {
    // no-op
  }

  @Override
  public void action(AuthenticationFlowContext context) {
    authenticate(context);
  }

  @Override
  public boolean requiresUser() {
    return false;
  }

  @Override
  public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
    return true;
  }

  @Override
  public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {
    // no-op
  }
}
