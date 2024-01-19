package com.github.bcgov.keycloak.protocol.oidc.mappers;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.ws.rs.client.Client;
import jakarta.ws.rs.client.ClientBuilder;
import org.jboss.logging.Logger;
import org.keycloak.models.*;
import org.keycloak.protocol.oidc.OIDCLoginProtocol;
import org.keycloak.protocol.oidc.mappers.*;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.representations.AccessTokenResponse;
import org.keycloak.representations.IDToken;
import org.keycloak.util.JsonSerialization;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class IDPUserinfoMapper extends AbstractOIDCProtocolMapper
    implements OIDCAccessTokenMapper, OIDCIDTokenMapper, UserInfoTokenMapper {

  private static final Logger logger = Logger.getLogger(IDPUserinfoMapper.class);

  private static final List<ProviderConfigProperty> configProperties = new ArrayList<>();

  public static final String CLAIM_VALUE = "claim.value";

  static {
    OIDCAttributeMapperHelper.addTokenClaimNameConfig(configProperties);
    OIDCAttributeMapperHelper.addIncludeInTokensConfig(configProperties, IDPUserinfoMapper.class);
  }

  public static final String PROVIDER_ID = "oidc-idp-userinfo-mapper";

  public List<ProviderConfigProperty> getConfigProperties() {
    return configProperties;
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }

  @Override
  public String getDisplayType() {
    return "IDP Userinfo";
  }

  @Override
  public String getDisplayCategory() {
    return TOKEN_MAPPER_CATEGORY;
  }

  @Override
  public String getHelpText() {
    return "Include the upstream IDP user info into the token.";
  }

  private static AccessTokenResponse parseTokenString(String tokenString) {
    try {
      return JsonSerialization.readValue(tokenString, AccessTokenResponse.class);
    } catch (Exception e) {
      return null;
    }
  }

  private static JsonNode parseJson(String json) {
    try {
      return JsonSerialization.mapper.readValue(json, JsonNode.class);
    } catch (Exception e) {
      return null;
    }
  }

  @Override
  protected void setClaim(
      IDToken token,
      ProtocolMapperModel mappingModel,
      UserSessionModel userSession,
      KeycloakSession keycloakSession,
      ClientSessionContext clientSessionCtx) {

    String idp = userSession.getNotes().get("identity_provider");
    RealmModel realm = userSession.getRealm();
    IdentityProviderModel identityProviderConfig = realm.getIdentityProviderByAlias(idp);

    if (identityProviderConfig.isStoreToken()) {
      IdentityProviderModel identityProviderModel = realm.getIdentityProviderByAlias(idp);
      String userInfoUrl = identityProviderModel.getConfig().get("userInfoUrl");

      if (userInfoUrl != null) {
        FederatedIdentityModel identity =
            keycloakSession.users().getFederatedIdentity(realm, userSession.getUser(), idp);
        String brokerToken = identity.getToken();
        AccessTokenResponse brokerAccessToken = parseTokenString(brokerToken);
        Client httpClient = ClientBuilder.newClient();
        String userinfoString =
            httpClient
                .target(userInfoUrl)
                .request()
                .header("Authorization", "Bearer " + brokerAccessToken.getToken())
                .get(String.class);

        JsonNode jsonNode = parseJson(userinfoString);
        Map<String, Object> otherClaims = token.getOtherClaims();
        otherClaims.put(
            mappingModel.getConfig().get(OIDCAttributeMapperHelper.TOKEN_CLAIM_NAME), jsonNode);
      } else {
        logger.error("Identity Provider [" + idp + "] does not have userinfo URL.");
      }
    } else {
      logger.error("Identity Provider [" + idp + "] does not store tokens.");
    }
  }

  public static ProtocolMapperModel create(
      String name, String tokenClaimName, boolean accessToken, boolean idToken) {
    ProtocolMapperModel mapper = new ProtocolMapperModel();
    mapper.setName(name);
    mapper.setProtocolMapper(PROVIDER_ID);
    mapper.setProtocol(OIDCLoginProtocol.LOGIN_PROTOCOL);
    Map<String, String> config = new HashMap<>();
    config.put(OIDCAttributeMapperHelper.TOKEN_CLAIM_NAME, tokenClaimName);
    if (accessToken) config.put(OIDCAttributeMapperHelper.INCLUDE_IN_ACCESS_TOKEN, "true");
    if (idToken) config.put(OIDCAttributeMapperHelper.INCLUDE_IN_ID_TOKEN, "true");
    mapper.setConfig(config);
    return mapper;
  }
}
