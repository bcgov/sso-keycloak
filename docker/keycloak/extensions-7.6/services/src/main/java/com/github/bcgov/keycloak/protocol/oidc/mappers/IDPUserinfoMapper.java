package com.github.bcgov.keycloak.protocol.oidc.mappers;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import org.jboss.logging.Logger;
import org.keycloak.models.ClientSessionContext;
import org.keycloak.models.FederatedIdentityModel;
import org.keycloak.models.IdentityProviderModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.ProtocolMapperModel;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserSessionModel;
import org.keycloak.protocol.oidc.OIDCLoginProtocol;
import org.keycloak.protocol.oidc.mappers.AbstractOIDCProtocolMapper;
import org.keycloak.protocol.oidc.mappers.OIDCAccessTokenMapper;
import org.keycloak.protocol.oidc.mappers.OIDCAttributeMapperHelper;
import org.keycloak.protocol.oidc.mappers.OIDCIDTokenMapper;
import org.keycloak.protocol.oidc.mappers.UserInfoTokenMapper;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.representations.AccessTokenResponse;
import org.keycloak.representations.IDToken;
import org.keycloak.util.JsonSerialization;
import java.util.Base64;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class IDPUserinfoMapper extends AbstractOIDCProtocolMapper
    implements OIDCAccessTokenMapper, OIDCIDTokenMapper, UserInfoTokenMapper {

  private static final Logger logger = Logger.getLogger(IDPUserinfoMapper.class);

  private static final String BEARER = "Bearer";

  private static final List<ProviderConfigProperty> configProperties = new ArrayList<ProviderConfigProperty>();

  public static final String CLAIM_VALUE = "claim.value";

  public static final String USER_ATTRIBUTE = "userAttribute";

  public static final String DECODE_USERINFO_RESPONSE = "decodeUserInfoResponse";

  static {
    configProperties.add(new ProviderConfigProperty(DECODE_USERINFO_RESPONSE, "Decode UserInfo Response",
        "Decode response returned from IDP userinfo endpoint", ProviderConfigProperty.BOOLEAN_TYPE, false));
    configProperties.add(new ProviderConfigProperty(USER_ATTRIBUTE, "User Attribute",
        "User Attribute returned from IDP userinfo endpoint", ProviderConfigProperty.STRING_TYPE, null));

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
      AccessTokenResponse token = JsonSerialization.readValue(tokenString, AccessTokenResponse.class);
      return token;
    } catch (Exception e) {
      return null;
    }
  }

  private static JsonNode parseJson(String json) {
    try {
      JsonNode jsonNode = JsonSerialization.mapper.readValue(json, JsonNode.class);
      return jsonNode;
    } catch (Exception e) {
      return null;
    }
  }

  private static String decodeUserInfoResponse(String token) {
    try {
      String[] tokenParts = token.split("\\.");
      Base64.Decoder decoder = Base64.getUrlDecoder();
      String payload = new String(decoder.decode(tokenParts[1]));
      return payload;
    } catch (Exception e) {
      return null;
    }
  }

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
        FederatedIdentityModel identity = keycloakSession.users().getFederatedIdentity(realm, userSession.getUser(),
            idp);
        String brokerToken = identity.getToken();
        AccessTokenResponse brokerAccessToken = parseTokenString(brokerToken);
        Client httpClient = ClientBuilder.newClient();
        String userinfoString = httpClient
            .target(userInfoUrl)
            .request()
            .header("Authorization", "Bearer " + brokerAccessToken.getToken())
            .get(String.class);
        boolean decode = Boolean.parseBoolean(mappingModel.getConfig().get(DECODE_USERINFO_RESPONSE));
        if (decode) {
          userinfoString = decodeUserInfoResponse(userinfoString);
        }
        try {
          JsonNode jsonNode = parseJson(userinfoString);
          if (jsonNode == null) {
            logger.error("null response returned from [" + idp + "] userinfo URL");
          }
          Map<String, Object> otherClaims = token.getOtherClaims();
          otherClaims.put(
              mappingModel.getConfig().get(OIDCAttributeMapperHelper.TOKEN_CLAIM_NAME),
              jsonNode.get(mappingModel.getConfig().get(OIDCAttributeMapperHelper.TOKEN_CLAIM_NAME)));
        } catch (NullPointerException e) {
          logger.errorf("'%s' returned invalid response", idp);
        } catch (Exception e) {
          logger.errorf("unable to fetch attributes from userinfo endpoint '%s'", userInfoUrl);
        }
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
    if (accessToken)
      config.put(OIDCAttributeMapperHelper.INCLUDE_IN_ACCESS_TOKEN, "true");
    if (idToken)
      config.put(OIDCAttributeMapperHelper.INCLUDE_IN_ID_TOKEN, "true");
    mapper.setConfig(config);
    return mapper;
  }
}
