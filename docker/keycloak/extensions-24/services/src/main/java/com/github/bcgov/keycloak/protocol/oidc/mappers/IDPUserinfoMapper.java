package com.github.bcgov.keycloak.protocol.oidc.mappers;

import com.fasterxml.jackson.databind.JsonNode;

import jakarta.ws.rs.ProcessingException;
import jakarta.ws.rs.client.Client;
import jakarta.ws.rs.client.ClientBuilder;

import org.jboss.logging.Logger;
import org.keycloak.broker.provider.IdentityBrokerException;
import org.keycloak.crypto.KeyWrapper;
import org.keycloak.crypto.SignatureProvider;
import org.keycloak.jose.JOSE;
import org.keycloak.jose.JOSEParser;
import org.keycloak.jose.jws.JWSInput;
import org.keycloak.keys.loader.PublicKeyStorageManager;
import org.keycloak.models.*;
import org.keycloak.protocol.oidc.OIDCLoginProtocol;
import org.keycloak.protocol.oidc.mappers.*;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.representations.AccessTokenResponse;
import org.keycloak.representations.IDToken;
import org.keycloak.util.JsonSerialization;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class IDPUserinfoMapper extends AbstractOIDCProtocolMapper
    implements OIDCAccessTokenMapper, OIDCIDTokenMapper, UserInfoTokenMapper {

  private static final Logger logger = Logger.getLogger(IDPUserinfoMapper.class);

  private static final List<ProviderConfigProperty> configProperties = new ArrayList<ProviderConfigProperty>();

  public static final String CLAIM_VALUE = "claim.value";

  public static final String USER_ATTRIBUTES = "userAttributes";

  public static final String SIGNATURE_EXPECTED = "signatureExpected";

  public static final String ENCRYPTION_EXPECTED = "encryptionExpected";

  static {
    configProperties.add(new ProviderConfigProperty(SIGNATURE_EXPECTED, "Signature Expected",
        "Whether the signature should be verified", ProviderConfigProperty.BOOLEAN_TYPE, false));

    configProperties.add(new ProviderConfigProperty(ENCRYPTION_EXPECTED, "Encryption Expected",
        "Whether the userinfo response requires decryption", ProviderConfigProperty.BOOLEAN_TYPE,
        false));

    configProperties.add(new ProviderConfigProperty(USER_ATTRIBUTES, "User Attributes",
        "List of user attributes returned from IDP userinfo endpoint", ProviderConfigProperty.STRING_TYPE, null));

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
    JsonNode userInfo;
    JWSInput jws;

    if (identityProviderConfig.isStoreToken()) {
      IdentityProviderModel identityProviderModel = realm.getIdentityProviderByAlias(idp);
      String userInfoUrl = identityProviderModel.getConfig().get("userInfoUrl");

      if (userInfoUrl != null) {
        FederatedIdentityModel identity = keycloakSession.users().getFederatedIdentity(realm, userSession.getUser(),
            idp);
        String brokerToken = identity.getToken();
        AccessTokenResponse brokerAccessToken = parseTokenString(brokerToken);
        Client httpClient = ClientBuilder.newClient();
        String userinfoResponse;

        try {
          userinfoResponse = httpClient
              .target(userInfoUrl)
              .request()
              .header("Authorization", "Bearer " + brokerAccessToken.getToken())
              .get(String.class);
        } catch (Exception e) {
          throw new ProcessingException("Failed to call userinfo endpoint", e);
        }

        Boolean signatureExpected = Boolean.parseBoolean(mappingModel.getConfig().get(SIGNATURE_EXPECTED));

        if (signatureExpected) {

          try {
            JOSE joseToken = JOSEParser.parse(userinfoResponse);

            // common signed JWS token
            jws = (JWSInput) joseToken;

          } catch (Exception e) {
            throw new IdentityBrokerException("Error parsing userinfo response", e);
          }

          // verify signature of the JWS
          if (!verify(keycloakSession, jws)) {
            throw new IdentityBrokerException("token signature validation failed");
          }

          try {
            userInfo = JsonSerialization.readValue(new String(jws.getContent(), StandardCharsets.UTF_8),
                JsonNode.class);
          } catch (IOException e) {
            throw new IdentityBrokerException("Error parsing userinfo content", e);
          }
        } else {
          userInfo = parseJson(userinfoResponse);
        }

        // process string value of user attributes
        String userAttributes = mappingModel.getConfig().get(USER_ATTRIBUTES);
        String[] userAttributesArr = userAttributes == null ? new String[0] : userAttributes.split(",");

        if (userAttributesArr.length > 0) {
          Map<String, Object> otherClaims = token.getOtherClaims();
          for (String userAttribute : userAttributesArr) {
            otherClaims.put(userAttribute, getJsonProperty(userInfo, userAttribute));
          }
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

  protected boolean verify(KeycloakSession session, JWSInput jws) {

    try {
      KeyWrapper key = PublicKeyStorageManager.getIdentityProviderKeyWrapper(session, session.getContext().getRealm(),
          getConfig(),
          jws);
      if (key == null) {
        logger.debugf("[IDP Userinfo] Failed to verify userinfo JWT signature, public key not found for algorithm %s",
            jws.getHeader().getRawAlgorithm());
        return false;
      }
      String algorithm = jws.getHeader().getRawAlgorithm();
      if (key.getAlgorithm() == null) {
        key.setAlgorithm(algorithm);
      }
      SignatureProvider signatureProvider = session.getProvider(SignatureProvider.class, algorithm);
      if (signatureProvider == null) {
        logger.debugf("Failed to verify userinfo JWT, signature provider not found for algorithm %s", algorithm);
        return false;
      }

      return signatureProvider.verifier(key).verify(jws.getEncodedSignatureInput().getBytes(StandardCharsets.UTF_8),
          jws.getSignature());
    } catch (Exception e) {
      logger.debug("Failed to verify signature of userinfo JWT", e);
      return false;
    }
  }

  public String getJsonProperty(JsonNode jsonNode, String name) {
    if (jsonNode.has(name) && !jsonNode.get(name).isNull()) {
      String s = jsonNode.get(name).asText();
      if (s != null && !s.isEmpty())
        return s;
      else
        return null;
    }

    return null;
  }
}
