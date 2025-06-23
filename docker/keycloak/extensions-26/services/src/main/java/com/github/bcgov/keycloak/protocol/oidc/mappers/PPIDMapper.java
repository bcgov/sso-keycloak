package com.github.bcgov.keycloak.protocol.oidc.mappers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.jboss.logging.Logger;
import org.keycloak.models.ClientSessionContext;
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

import com.github.bcgov.keycloak.common.ApplicationProperties;
import com.github.bcgov.keycloak.common.PPID;

public class PPIDMapper extends AbstractOIDCProtocolMapper
    implements OIDCAccessTokenMapper, OIDCIDTokenMapper, UserInfoTokenMapper {
  private static final Logger logger = Logger.getLogger(PPIDMapper.class);

  public static final String CLAIM_NAME = "claim.name";

  public static final String CLAIM_VALUE = "claim.value";

  public static final String PRIVACY_ZONE_MAPPER = "privacy_zone";

  private static final List<ProviderConfigProperty> configProperties = new ArrayList<ProviderConfigProperty>();

  static {
    configProperties.add(new ProviderConfigProperty(CLAIM_NAME, "Claim Name",
        "Token claim name containing the ppid identifier of the authenticated subject.",
        ProviderConfigProperty.STRING_TYPE, "ppid"));

    OIDCAttributeMapperHelper.addIncludeInTokensConfig(configProperties, IDPUserinfoMapper.class);
  }

  public static final String PROVIDER_ID = "oidc-idp-ppid-mapper";

  public List<ProviderConfigProperty> getConfigProperties() {
    return configProperties;
  }

  ApplicationProperties applicationProperties = new ApplicationProperties();

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

      ProtocolMapperModel pzMapper = clientSessionCtx.getClientSession().getClient()
          .getProtocolMapperByName(OIDCLoginProtocol.LOGIN_PROTOCOL, PRIVACY_ZONE_MAPPER);

      if (pzMapper != null) {
        String ppid = PPID.getPpid(applicationProperties.getIssuer(idp), userSession.getUser().getEmail(),
            pzMapper.getConfig().get(CLAIM_VALUE));

        if (!StringUtil.isNullOrEmpty(ppid)) {
          Map<String, Object> otherClaims = token.getOtherClaims();
          otherClaims.put(tokenClaim, ppid);
        }
      } else
        logger.errorf("Could not find %s mapper", PRIVACY_ZONE_MAPPER);

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

}
