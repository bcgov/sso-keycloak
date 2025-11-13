package com.github.bcgov.keycloak.protocol.oidc.mappers;

import java.util.ArrayList;
import java.util.List;

import org.keycloak.broker.oidc.KeycloakOIDCIdentityProviderFactory;
import org.keycloak.broker.oidc.OIDCIdentityProviderFactory;
import org.keycloak.broker.provider.AbstractIdentityProviderMapper;
import org.keycloak.models.IdentityProviderMapperModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.protocol.oidc.mappers.OIDCAttributeMapperHelper;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.broker.provider.BrokeredIdentityContext;

import com.github.bcgov.keycloak.broker.oidc.CustomOIDCIdentityProviderFactory;

public class IDPAliasModifierMapper extends AbstractIdentityProviderMapper {

  public static final String PROVIDER_ID = "idp-alias-modifier-mapper";
  private static final List<ProviderConfigProperty> configProperties = new ArrayList<>();
  public static final String[] COMPATIBLE_PROVIDERS = {
      KeycloakOIDCIdentityProviderFactory.PROVIDER_ID,
      OIDCIdentityProviderFactory.PROVIDER_ID,
      CustomOIDCIdentityProviderFactory.PROVIDER_ID
  };

  static {
    ProviderConfigProperty config = new ProviderConfigProperty();
    config.setName("idpAlias");
    config.setLabel("Identity Provider Alias");
    config.setHelpText("Alias of the identity provider to be used in the federated identity link.");
    config.setType(ProviderConfigProperty.STRING_TYPE);
    configProperties.add(config);

    OIDCAttributeMapperHelper.addIncludeInTokensConfig(configProperties, ClaimOmitterMapper.class);
  }

  @Override
  public String getDisplayCategory() {
    return "Custom IDentity Provider Mappers";
  }

  @Override
  public String getDisplayType() {
    return "IDP Alias Modifier";
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }

  @Override
  public String getHelpText() {
    return "Changes IdP alias before creating the federated identity link (first broker login).";
  }

  @Override
  public List<ProviderConfigProperty> getConfigProperties() {
    return configProperties;
  }

  @Override
  public String[] getCompatibleProviders() {
    return COMPATIBLE_PROVIDERS;
  }

  @Override
  public void preprocessFederatedIdentity(KeycloakSession session, RealmModel realm,
      IdentityProviderMapperModel mapperModel, BrokeredIdentityContext context) {
    context.getIdpConfig().setAlias(mapperModel.getConfig().get("idpAlias"));
  }
}
