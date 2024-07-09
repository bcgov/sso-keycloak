package com.github.bcgov.keycloak.protocol.oidc.mappers;

import org.keycloak.models.ProtocolMapperModel;
import org.keycloak.models.UserSessionModel;
import org.keycloak.protocol.oidc.OIDCLoginProtocol;
import org.keycloak.protocol.oidc.mappers.*;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.representations.IDToken;

import java.util.*;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class ClaimOmitterMapper extends AbstractOIDCProtocolMapper
    implements OIDCAccessTokenMapper, OIDCIDTokenMapper, UserInfoTokenMapper {

  public static final String IDP_ALIASES = "identity_provider_aliases";
  public static final String TOKEN_CLAIM_NAMES = "token_claim_names";

  private static final List<ProviderConfigProperty> configProperties =
      new ArrayList<>();

  static {
    ProviderConfigProperty config = new ProviderConfigProperty();
    config.setName(IDP_ALIASES);
    config.setLabel("Identity Provider Aliases");
    config.setHelpText("");
    config.setType(ProviderConfigProperty.STRING_TYPE);
    configProperties.add(config);

    config = new ProviderConfigProperty();
    config.setName(TOKEN_CLAIM_NAMES);
    config.setLabel("Token Claim Names");
    config.setHelpText("List of the token claim names to remove from the token.");
    config.setType(ProviderConfigProperty.STRING_TYPE);
    configProperties.add(config);

    OIDCAttributeMapperHelper.addIncludeInTokensConfig(configProperties, ClaimOmitterMapper.class);
  }

  public static final String PROVIDER_ID = "omit-claim-by-idp-mapper";

  public List<ProviderConfigProperty> getConfigProperties() {
    return configProperties;
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }

  @Override
  public String getDisplayType() {
    return "Omit Claims By IDPs";
  }

  @Override
  public String getDisplayCategory() {
    return TOKEN_MAPPER_CATEGORY;
  }

  @Override
  public String getHelpText() {
    return "Omit one or multiple token claims";
  }

  @Override
  protected void setClaim(
      IDToken token, ProtocolMapperModel mappingModel, UserSessionModel userSession) {
    String sessionIdpAlias = userSession.getNotes().get("identity_provider");
    String idpAliases = mappingModel.getConfig().get(IDP_ALIASES);
    String[] idpAliasArr = idpAliases == null ? new String[0] : idpAliases.split(" ");

    if (idpAliasArr.length > 0) {
      if (sessionIdpAlias == null || sessionIdpAlias.trim().isEmpty()) return;
      if (!Arrays.asList(idpAliasArr).contains(sessionIdpAlias)) return;
    }

    String tokenClaims = mappingModel.getConfig().get(TOKEN_CLAIM_NAMES);
    String[] tokenClaimArr = tokenClaims == null ? new String[0] : tokenClaims.split(" ");

    if (tokenClaimArr.length == 0) return;

    Map<String, Object> otherClaims = token.getOtherClaims();

    for (String claim : tokenClaimArr) {
      otherClaims.put(claim, "");
    }
  }

  public static ProtocolMapperModel create(
      String name, boolean accessToken, boolean idToken, boolean userInfo) {
    ProtocolMapperModel mapper = new ProtocolMapperModel();
    mapper.setName(name);
    mapper.setProtocolMapper(PROVIDER_ID);
    mapper.setProtocol(OIDCLoginProtocol.LOGIN_PROTOCOL);
    Map<String, String> config = new HashMap<>();
    if (accessToken) config.put(OIDCAttributeMapperHelper.INCLUDE_IN_ACCESS_TOKEN, "true");
    if (idToken) config.put(OIDCAttributeMapperHelper.INCLUDE_IN_ID_TOKEN, "true");
    if (userInfo) config.put(OIDCAttributeMapperHelper.INCLUDE_IN_USERINFO, "true");
    mapper.setConfig(config);
    return mapper;
  }

  @Override
  public int getPriority() {
    return 99;
  }
}
