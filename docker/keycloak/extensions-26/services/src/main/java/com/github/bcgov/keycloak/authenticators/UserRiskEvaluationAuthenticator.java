package com.github.bcgov.keycloak.authenticators;

import java.io.IOException;
import java.time.Instant;
import java.util.Optional;

import org.apache.http.HttpEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.jboss.logging.Logger;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.AuthenticationFlowError;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.authenticators.access.DenyAccessAuthenticatorFactory;
import org.keycloak.models.AuthenticatorConfigModel;
import org.keycloak.models.ClientModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.services.messages.Messages;
import org.keycloak.sessions.AuthenticationSessionModel;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.bcgov.keycloak.common.ApplicationProperties;
import com.github.bcgov.keycloak.common.RBA;

import jakarta.ws.rs.core.Response;

public class UserRiskEvaluationAuthenticator implements Authenticator {

  private static final Logger logger = Logger.getLogger(UserRiskEvaluationAuthenticator.class);
  private static final ObjectMapper MAPPER = new ObjectMapper();
  ApplicationProperties applicationProperties = new ApplicationProperties();

  @Override
  public boolean requiresUser() {
    return false;
  }

  @Override
  public void authenticate(AuthenticationFlowContext context) {
    AuthenticationSessionModel authSession = context.getAuthenticationSession();
    String realm = context.getRealm().getName();
    ClientModel client = authSession.getClient();
    String clientId = client != null ? client.getClientId() : null;

    UserModel user = context.getUser();
    String username = user != null ? user.getUsername() : null;
    String userId = user != null ? user.getId() : null;

    // get remote IP (Keycloak's context provides this)
    String userIp = context.getConnection().getRemoteAddr();

    ObjectNode payload = MAPPER.createObjectNode();

    ObjectNode dataNode = payload.putObject("data");
    payload.put("event", "login");
    dataNode.put("clientId", clientId);
    dataNode.put("account", username);
    dataNode.put("userId", userId);
    dataNode.put("ip", userIp);
    dataNode.put("timestamp", Instant.now().toString());
    dataNode.put("authMethod", authSession.getProtocol()); // e.g., "openid-connect"
    dataNode.put("sessionId", authSession.getParentSession().getId());

    double riskScore;
    try {
      riskScore = fetchRiskScore(payload);
    } catch (IOException e) {
      logger.error("Could not fetch risk score");
      context.failure(AuthenticationFlowError.INTERNAL_ERROR);
      return;
    }

    if (riskScore != -1 && riskScore < 0.5) {
      context.attempted();
    } else {
      String errorMessage = Optional.ofNullable(context.getAuthenticatorConfig())
          .map(AuthenticatorConfigModel::getConfig)
          .map(f -> f.get(DenyAccessAuthenticatorFactory.ERROR_MESSAGE))
          .orElse(Messages.ACCESS_DENIED);
      Response challenge = context.form()
          .setError(errorMessage)
          .createErrorPage(Response.Status.UNAUTHORIZED);
      context.failure(AuthenticationFlowError.ACCESS_DENIED, challenge);
    }
  }

  @Override
  public void action(AuthenticationFlowContext context) {

  }

  @Override
  public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
    return true;
  }

  @Override
  public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {
  }

  @Override
  public void close() {

  }

  public double fetchRiskScore(ObjectNode payload) throws IOException {

    String token = RBA.getAccessToken();
    CloseableHttpClient httpClient = HttpClients.createDefault();
    CloseableHttpResponse response;
    HttpPost postRqst = new HttpPost(applicationProperties.getRbaApiUrl());
    postRqst.addHeader("Authorization", "Bearer " + token);
    String json = MAPPER.writeValueAsString(payload);
    postRqst.setEntity(new StringEntity(json, "UTF-8"));
    response = httpClient.execute(postRqst);
    int status = response.getStatusLine().getStatusCode();
    if (!(status >= 200 && status < 400)) {
      throw new RuntimeException("Invalid status received from userinfo endpoint= " + status);
    }
    try {
      try {
        HttpEntity entity = response.getEntity();
        JsonNode jsonResponse = MAPPER.readTree(EntityUtils.toString(entity));
        JsonNode riskScoreNode = jsonResponse.get("risk");
        if (riskScoreNode == null || !riskScoreNode.isNumber()) {
          return -1;
        }
        return riskScoreNode.asDouble();
      } finally {
        response.close();
      }
    } catch (Exception e) {
      logger.errorf("Error fetching risk score from RBA API : %s", e.getMessage());
      return -1;
    } finally {
      httpClient.close();
    }
  }
}
