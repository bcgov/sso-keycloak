package com.github.bcgov.keycloak.protocol.oidc.mappers;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.stream.Collectors;
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

import com.github.bcgov.keycloak.common.ApplicationProperties;

public class AMRAttributeMapper extends AbstractOIDCProtocolMapper
    implements OIDCAccessTokenMapper, OIDCIDTokenMapper, UserInfoTokenMapper {
  private static final Logger logger = Logger.getLogger(AMRAttributeMapper.class);

  public static final String AMR_VALUE = "amr.value";

  public static final String IDP_ALIAS = "idp.alias";

  private static final List<ProviderConfigProperty> configProperties = new ArrayList<ProviderConfigProperty>();

  static {
    ProviderConfigProperty amrValue = new ProviderConfigProperty();
    amrValue.setName(AMR_VALUE);
    amrValue.setLabel("AMR Value");
    amrValue.setType(ProviderConfigProperty.STRING_TYPE);
    amrValue.setDefaultValue("");
    amrValue.setHelpText("The AMR Value to put in the token");
    configProperties.add(amrValue);

    ProviderConfigProperty idpAlias = new ProviderConfigProperty();
    idpAlias.setName(IDP_ALIAS);
    idpAlias.setLabel("IDP Alias");
    idpAlias.setType(ProviderConfigProperty.STRING_TYPE);
    idpAlias.setDefaultValue("");
    idpAlias.setHelpText("The alias of the IDP to add the AMR to.");
    configProperties.add(idpAlias);

    OIDCAttributeMapperHelper.addIncludeInTokensConfig(configProperties, IDPUserinfoMapper.class);
  }


  public static final String PROVIDER_ID = "oidc-idp-amr-mapper";

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
    return "Add AMR for specific IDP";
  }

  @Override
  public String getDisplayCategory() {
    return TOKEN_MAPPER_CATEGORY;
  }

  @Override
  public String getHelpText() {
    return "Includes the provided AMR in the token when authenticating with the provided IDP.";
  }

  protected void setClaim(IDToken token,
      ProtocolMapperModel mappingModel,
      UserSessionModel userSession,
      KeycloakSession keycloakSession,
      ClientSessionContext clientSessionCtx) {
    String idpAlias = mappingModel.getConfig().get(IDP_ALIAS);
    String rawAMR = mappingModel.getConfig().get(AMR_VALUE);
    try {
      String idp = userSession.getNotes().get("identity_provider");
      if (idp != null && idp.equalsIgnoreCase(idpAlias) && rawAMR != null) {
        List<String> amr = Arrays.stream(rawAMR.split(","))
          .map(String::trim)
          .filter(s -> !s.isEmpty())
          .collect(Collectors.toList());

        if (!amr.isEmpty()) {
            token.getOtherClaims().put("amr", amr);
        }
      }
    } catch (Exception e) {
      logger.errorf("Failed to add amr claim to the token");
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
    return 10;
  }
}
