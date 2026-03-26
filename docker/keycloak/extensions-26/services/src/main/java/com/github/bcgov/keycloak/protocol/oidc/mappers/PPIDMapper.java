package com.github.bcgov.keycloak.protocol.oidc.mappers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.jboss.logging.Logger;
import org.keycloak.models.ClientSessionContext;
import org.keycloak.models.IdentityProviderModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.ProtocolMapperModel;
import org.keycloak.models.UserSessionModel;
import org.keycloak.protocol.oidc.OIDCLoginProtocol;
import org.keycloak.protocol.oidc.mappers.AbstractOIDCProtocolMapper;
import org.keycloak.protocol.oidc.mappers.OIDCAccessTokenMapper;
import org.keycloak.protocol.oidc.mappers.OIDCAttributeMapperHelper;
import org.keycloak.protocol.oidc.mappers.OIDCIDTokenMapper;
import org.keycloak.protocol.oidc.mappers.UserInfoTokenMapper;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.representations.IDToken;
import org.keycloak.saml.common.util.StringUtil;

import com.github.bcgov.keycloak.common.PPID;

public class PPIDMapper extends AbstractOIDCProtocolMapper
    implements OIDCAccessTokenMapper, OIDCIDTokenMapper, UserInfoTokenMapper {
  private static final Logger logger = Logger.getLogger(PPIDMapper.class);

  public static final String CLAIM_NAME = "claim.name";

  public static final String CLAIM_VALUE = "claim.value";

  public static final String PRIVACY_ZONE = "privacy_zone";

  public static final String PREFERRED_USERNAME = "preferred_username";

  public static final String PPID_SERVICE_ACCOUNT_IDP_ALIAS = "ppid-service-account";

  private static final List<ProviderConfigProperty> configProperties = new ArrayList<ProviderConfigProperty>();

  static {
    ProviderConfigProperty property;
    property = new ProviderConfigProperty();
    property.setName(CLAIM_NAME);
    property.setLabel("Claim Name");
    property.setHelpText(
        "Token claim name containing the ppid identifier of the authenticated subject.");
    property.setType(ProviderConfigProperty.STRING_TYPE);
    property.setDefaultValue("sub");
    configProperties.add(property);

    property = new ProviderConfigProperty();
    property.setName(PRIVACY_ZONE);
    property.setLabel("Privacy Zone");
    property.setHelpText(
        "Client privacy zone required to fetch ppid identifier of the authenticated subject.");
    property.setType(ProviderConfigProperty.STRING_TYPE);
    property.setDefaultValue("");
    configProperties.add(property);

    OIDCAttributeMapperHelper.addIncludeInTokensConfig(configProperties, IDPUserinfoMapper.class);
  }

  public static final String PROVIDER_ID = "oidc-idp-ppid-mapper";

  public List<ProviderConfigProperty> getConfigProperties() {
    return configProperties;
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }

  @Override
  public String getDisplayType() {
    return "PPID";
  }

  @Override
  public String getDisplayCategory() {
    return TOKEN_MAPPER_CATEGORY;
  }

  @Override
  public String getHelpText() {
    return "Includes the ppid identifier of the authenticated subject in the token.";
  }

  protected void setClaim(IDToken token,
      ProtocolMapperModel mappingModel,
      UserSessionModel userSession,
      KeycloakSession keycloakSession,
      ClientSessionContext clientSessionCtx) {
    String tokenClaim = mappingModel.getConfig().get(CLAIM_NAME);
    try {
      String idp = userSession.getNotes().get("identity_provider");
      if (idp.equalsIgnoreCase("otp")) {

        Map<String, Object> otherClaims = token.getOtherClaims();

        IdentityProviderModel identityProviderModel = keycloakSession.identityProviders()
            .getByAlias(PPID_SERVICE_ACCOUNT_IDP_ALIAS);

        if (identityProviderModel == null) {
          logger.error("Identity provider with alias " + PPID_SERVICE_ACCOUNT_IDP_ALIAS + " not found.");
          return;
        }

        if (!StringUtil.isNullOrEmpty(mappingModel.getConfig().get(PRIVACY_ZONE))) {
          String ppid = PPID.getPpid(identityProviderModel.getConfig().get("tokenUrl"),
              identityProviderModel.getConfig().get("authorizationUrl"),
              identityProviderModel.getConfig().get("clientId"),
              identityProviderModel.getConfig().get("clientSecret"),
              identityProviderModel.getConfig().get("issuer"),
              userSession.getUser().getEmail(),
              mappingModel.getConfig().get(PRIVACY_ZONE));

          if (!StringUtil.isNullOrEmpty(ppid)) {
            otherClaims.put(tokenClaim, ppid);

            if (otherClaims.containsKey(PREFERRED_USERNAME)) {
              otherClaims.replace(PREFERRED_USERNAME, ppid);
            }
          } else {
            logger.error("Failed to fetch ppid for the user.");
          }
        } else
          logger.error("Privacy zone is required to fetch ppid.");
      }
    } catch (Exception e) {
      logger.errorf("Failed to add claim %s to the token", tokenClaim);
    }
  }

  public static ProtocolMapperModel create(
      String name, String tokenClaimName, boolean accessToken, boolean idToken, boolean userInfo,
      boolean introspectionEndpoint) {
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
    if (userInfo)
      config.put(OIDCAttributeMapperHelper.INCLUDE_IN_USERINFO, "true");
    if (introspectionEndpoint)
      config.put(OIDCAttributeMapperHelper.INCLUDE_IN_INTROSPECTION, "true");
    mapper.setConfig(config);
    return mapper;
  }

  @Override
  public int getPriority() {
    return 100;
  }
}
