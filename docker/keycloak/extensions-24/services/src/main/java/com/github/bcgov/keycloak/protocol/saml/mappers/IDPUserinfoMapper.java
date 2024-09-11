package com.github.bcgov.keycloak.protocol.saml.mappers;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import org.apache.http.HttpEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.jboss.logging.Logger;
import org.keycloak.broker.oidc.OIDCIdentityProviderConfig;
import org.keycloak.broker.provider.IdentityBrokerException;
import org.keycloak.crypto.KeyUse;
import org.keycloak.crypto.KeyWrapper;
import org.keycloak.crypto.SignatureProvider;
import org.keycloak.dom.saml.v2.assertion.AttributeStatementType;
import org.keycloak.dom.saml.v2.assertion.AttributeType;
import org.keycloak.jose.JOSE;
import org.keycloak.jose.JOSEParser;
import org.keycloak.jose.jwe.JWE;
import org.keycloak.jose.jwe.JWEException;
import org.keycloak.jose.jws.JWSInput;
import org.keycloak.keys.loader.PublicKeyStorageManager;
import org.keycloak.models.AuthenticatedClientSessionModel;
import org.keycloak.models.FederatedIdentityModel;
import org.keycloak.models.IdentityProviderModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.ProtocolMapperModel;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserSessionModel;
import org.keycloak.protocol.saml.mappers.AbstractSAMLProtocolMapper;
import org.keycloak.protocol.saml.mappers.AttributeStatementHelper;
import org.keycloak.protocol.saml.mappers.SAMLAttributeStatementMapper;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.representations.AccessTokenResponse;
import org.keycloak.saml.common.constants.JBossSAMLURIConstants;
import org.keycloak.util.JsonSerialization;
import com.fasterxml.jackson.databind.JsonNode;

public class IDPUserinfoMapper extends AbstractSAMLProtocolMapper implements SAMLAttributeStatementMapper {
  private static final Logger logger = Logger.getLogger(IDPUserinfoMapper.class);

  public static final String PROVIDER_ID = "saml-idp-userinfo-mapper";

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
        "List of comma separated user attributes returned from IDP userinfo endpoint. Example: email,firstName,lastName",

        ProviderConfigProperty.STRING_TYPE, null));
  }

  public String callUserInfo(String userInfoUrl, String brokerToken) throws IOException {
    CloseableHttpClient httpClient = HttpClients.createDefault();
    try {
      CloseableHttpResponse response;
      HttpGet getRqst = new HttpGet(userInfoUrl);
      getRqst.addHeader("Authorization", "Bearer " + brokerToken);
      response = httpClient.execute(getRqst);
      int status = response.getStatusLine().getStatusCode();
      if (!(status >= 200 && status < 400)) {
        throw new RuntimeException("Invalid status received from userinfo endpoint= " + status);
      }
      try {
        HttpEntity entity = response.getEntity();
        return EntityUtils.toString(entity);
      } finally {
        response.close();
      }
    } catch (Exception e) {
      throw new RuntimeException(e);
    } finally {
      httpClient.close();
    }
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
  public String getDisplayCategory() {
    return AttributeStatementHelper.ATTRIBUTE_STATEMENT_CATEGORY;
  }

  @Override
  public String getDisplayType() {
    return "IDP Userinfo";
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }

  @Override
  public String getHelpText() {
    return "Include the upstream IDP user info attributes into the SAML Assertion.";
  }

  @Override
  public List<ProviderConfigProperty> getConfigProperties() {
    return configProperties;
  }

  @Override
  public void transformAttributeStatement(AttributeStatementType attributeStatement, ProtocolMapperModel mappingModel,
      KeycloakSession keycloakSession, UserSessionModel userSession, AuthenticatedClientSessionModel clientSession) {
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
        String userinfoResponse;

        try {
          userinfoResponse = callUserInfo(userInfoUrl, brokerAccessToken.getToken());
        } catch (IOException e) {
          throw new IdentityBrokerException("Failed to call userinfo endpoint");
        }

        Boolean encryptionExpected = Boolean.parseBoolean(mappingModel.getConfig().get(ENCRYPTION_EXPECTED));

        if (encryptionExpected) {
          JOSE joseToken = JOSEParser.parse(userinfoResponse);
          if (joseToken instanceof JWE) {
            // encrypted JWE token
            JWE jwe = (JWE) joseToken;
            try {
              KeyWrapper key;
              if (jwe.getHeader().getKeyId() == null) {
                key = keycloakSession.keys().getActiveKey(keycloakSession.getContext().getRealm(), KeyUse.ENC,
                    jwe.getHeader().getRawAlgorithm());
              } else {
                key = keycloakSession.keys().getKey(keycloakSession.getContext().getRealm(), jwe.getHeader().getKeyId(),
                    KeyUse.ENC,
                    jwe.getHeader().getRawAlgorithm());
              }
              if (key == null || key.getPrivateKey() == null) {
                throw new IdentityBrokerException("Private key not found in the realm to decrypt token algorithm "
                    + jwe.getHeader().getRawAlgorithm());
              }

              jwe.getKeyStorage().setDecryptionKey(key.getPrivateKey());
              jwe.verifyAndDecodeJwe();
              userinfoResponse = new String(jwe.getContent(), StandardCharsets.UTF_8);
            } catch (JWEException e) {
              throw new IdentityBrokerException("Failed to decrypt userinfo JWT", e);
            }
          }
        }

        Boolean signatureExpected = Boolean.parseBoolean(mappingModel.getConfig().get(SIGNATURE_EXPECTED));

        if (signatureExpected) {

          OIDCIdentityProviderConfig oidcIdpConfig = new OIDCIdentityProviderConfig(identityProviderConfig);

          JOSE joseToken = JOSEParser.parse(userinfoResponse);

          // common signed JWS token
          jws = (JWSInput) joseToken;

          // verify signature of the JWS
          if (!verify(keycloakSession, oidcIdpConfig, jws)) {
            throw new IdentityBrokerException("Failed to verify userinfo JWT signature");
          }

          try {
            userInfo = JsonSerialization.readValue(new String(jws.getContent(), StandardCharsets.UTF_8),
                JsonNode.class);
          } catch (IOException e) {
            throw new IdentityBrokerException("Failed to parse userinfo JWT", e);
          }
        } else {
          userInfo = parseJson(userinfoResponse);
        }

        if (userInfo != null) {
          // process string value of user attributes
          String userAttributes = mappingModel.getConfig().get(USER_ATTRIBUTES);
          String[] userAttributesArr = userAttributes == null ? new String[0] : userAttributes.split(",");

          if (userAttributesArr.length > 0) {
            for (String userAttribute : userAttributesArr) {
              AttributeType attribute = new AttributeType(userAttribute.trim());
              attribute.setNameFormat(JBossSAMLURIConstants.ATTRIBUTE_FORMAT_BASIC.get());
              JsonNode attributeValue = deepFetchAttributes(userInfo, userAttribute, attributeStatement);
              if (attributeValue != null) {
                attribute.setNameFormat(JBossSAMLURIConstants.ATTRIBUTE_FORMAT_BASIC.get());
                attribute.addAttributeValue(attributeValue.asText());
                attributeStatement.addAttribute(new AttributeStatementType.ASTChoiceType(attribute));
              }
            }
          }
        } else {
          logger.error("The payload received from userinfo is null");
        }

      } else {
        logger.error("Identity Provider [" + idp + "] does not have userinfo URL.");
      }
    } else {
      logger.error("Identity Provider [" + idp + "] does not store tokens.");
    }
  }

  protected boolean verify(KeycloakSession session, OIDCIdentityProviderConfig idpConfig, JWSInput jws) {

    try {
      KeyWrapper key = PublicKeyStorageManager.getIdentityProviderKeyWrapper(session, session.getContext().getRealm(),
          idpConfig,
          jws);

      if (key == null) {
        logger.errorf("Failed to verify userinfo JWT signature, public key not found for algorithm %s",
            jws.getHeader().getRawAlgorithm());
        return false;
      }
      String algorithm = jws.getHeader().getRawAlgorithm();
      if (key.getAlgorithm() == null) {
        key.setAlgorithm(algorithm);
      }
      SignatureProvider signatureProvider = session.getProvider(SignatureProvider.class, algorithm);
      if (signatureProvider == null) {
        logger.errorf("Failed to verify userinfo JWT, signature provider not found for algorithm %s", algorithm);
        return false;
      }

      return signatureProvider.verifier(key).verify(jws.getEncodedSignatureInput().getBytes(StandardCharsets.UTF_8),
          jws.getSignature());
    } catch (Exception e) {
      logger.error("Failed to verify signature of userinfo JWT", e);
      return false;
    }
  }

  protected JsonNode deepFetchAttributes(JsonNode json, String entityName, AttributeStatementType attributeStatement) {
    if (json == null) {
      return null;
    }
    if (json.has(entityName)) {
      if (!json.get(entityName).isContainerNode())
        return json.get(entityName);
      else
        return null;
    }
    if (!json.isContainerNode()) {
      return null;
    }
    for (JsonNode child : json) {
      if (child.isContainerNode()) {
        JsonNode childResult = deepFetchAttributes(child, entityName,
            attributeStatement);
        if (childResult != null && !childResult.isMissingNode()) {
          return childResult;
        }
      }
    }
    return null;
  }

}
