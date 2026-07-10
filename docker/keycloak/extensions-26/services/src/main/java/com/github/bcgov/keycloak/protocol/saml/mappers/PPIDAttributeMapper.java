package com.github.bcgov.keycloak.protocol.saml.mappers;

import org.keycloak.dom.saml.v2.assertion.AttributeStatementType;
import org.keycloak.models.AuthenticatedClientSessionModel;
import org.keycloak.models.ClientScopeModel;
import org.keycloak.models.IdentityProviderModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.ProtocolMapperModel;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserSessionModel;
import org.keycloak.protocol.saml.mappers.AbstractSAMLProtocolMapper;
import org.keycloak.protocol.saml.mappers.AttributeStatementHelper;
import org.keycloak.protocol.saml.mappers.SAMLAttributeStatementMapper;
import org.keycloak.saml.common.constants.JBossSAMLURIConstants;
import org.keycloak.saml.common.util.StringUtil;

import com.github.bcgov.keycloak.common.PPID;

import org.keycloak.dom.saml.v2.assertion.AttributeType;

import java.util.ArrayList;
import java.util.List;

import org.jboss.logging.Logger;
import org.keycloak.provider.ProviderConfigProperty;

public class PPIDAttributeMapper extends AbstractSAMLProtocolMapper implements SAMLAttributeStatementMapper {

  private static final Logger logger = Logger.getLogger(PPIDAttributeMapper.class);

  public static final String PROVIDER_ID = "saml-idp-ppid-mapper";

  private static final List<ProviderConfigProperty> configProperties = new ArrayList<ProviderConfigProperty>();

  public static final String ATTRIBUTE_VALUE = "attribute.value";

  public static final String ATTRIBUTE_NAME = "attribute.name";

  public static final String PRIVACY_ZONE = "privacy_zone";

  public static final String PPID_SERVICE_ACCOUNT_IDP_ALIAS = "ppid-service-account";

  static {
    ProviderConfigProperty property;

    property = new ProviderConfigProperty();
    property.setName(ATTRIBUTE_NAME);
    property.setLabel("Attribute Name");
    property.setType(ProviderConfigProperty.STRING_TYPE);
    property.setDefaultValue("sub");
    property.setHelpText("Assertion attribute name containing the ppid identifier of the authenticated subject.");
    configProperties.add(property);
  }

  @Override
  public String getDisplayCategory() {
    return AttributeStatementHelper.ATTRIBUTE_STATEMENT_CATEGORY;
  }

  @Override
  public String getDisplayType() {
    return "PPID";
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }

  @Override
  public String getHelpText() {
    return "Includes the ppid identifier of the authenticated subject in the SAML Assertion.";
  }

  @Override
  public List<ProviderConfigProperty> getConfigProperties() {
    return configProperties;
  }

  @Override
  public void transformAttributeStatement(AttributeStatementType attributeStatement, ProtocolMapperModel mappingModel,
      KeycloakSession keycloakSession, UserSessionModel userSession, AuthenticatedClientSessionModel clientSession) {
    String ppidKey = mappingModel.getConfig().get(ATTRIBUTE_NAME);
    try {
      String idp = userSession.getNotes().get("identity_provider");
      IdentityProviderModel authIdpConfig = keycloakSession.identityProviders().getByAlias(idp);
      if (idp.equalsIgnoreCase("otp") || authIdpConfig.getDisplayName().equalsIgnoreCase("bc services card")) {

        String authIdp = null;

        String sub = null;

        IdentityProviderModel identityProviderModel = keycloakSession.identityProviders()
            .getByAlias(PPID_SERVICE_ACCOUNT_IDP_ALIAS);

        if (identityProviderModel == null) {
          logger.error("Identity provider with alias " + PPID_SERVICE_ACCOUNT_IDP_ALIAS + " not found.");
          return;
        }

        RealmModel realm = keycloakSession.getContext().getRealm();

        logger.info("Searching for mapper with id: " + mappingModel.getId() + " and name: " + mappingModel.getName());

        realm.getClientScopesStream().forEach(scope -> {
            scope.getProtocolMappersStream().forEach(pm -> {
                if (pm.getId().equals(mappingModel.getId())) {
                    logger.info(
                        "Found mapper '" + pm.getName() +
                        "' in scope '" + scope.getName() +
                        "' with id=" + pm.getId());
                }
            });
        });

        realm.getClientScopesStream().forEach(scope -> {
            logger.info("Scope: " + scope.getName());

            scope.getProtocolMappersStream().forEach(pm -> {
                logger.info("   " + pm.getId() + " -> " + pm.getName());
            });
        });

        // Fetch saml privacy zone scopes
        ClientScopeModel scope = realm.getClientScopesStream()
            .filter(cs -> cs.getName().startsWith("urn:ca:bc"))
            .filter(cs -> cs.getName().endsWith("-saml"))
            .filter(cs -> cs.getProtocolMappersStream().anyMatch(pm -> pm.getId().equals(mappingModel.getId())))
            .findFirst().orElse(null);

        if (scope != null && !StringUtil.isNullOrEmpty(scope.getName())) {

          if (idp.equalsIgnoreCase("otp")) {
            authIdp = "otp";
            sub = userSession.getUser().getEmail();
          } else if (authIdpConfig.getDisplayName().equalsIgnoreCase("bc services card")) {
            authIdp = "bcsc";
            sub = userSession.getUser().getUsername().split("@")[0].toUpperCase();
          } else {
            logger.error("Unsupported identity provider: " + idp);
            return;
          }

          String ppid = PPID.getPpid(authIdp,
              identityProviderModel.getConfig().get("clientId"),
              identityProviderModel.getConfig().get("clientSecret"),
              sub,
              scope.getName());

          if (!StringUtil.isNullOrEmpty(ppid)) {
            addAttribute(attributeStatement, ppidKey.trim(), ppid);
          } else {
            logger.error("Failed to fetch ppid for the user.");
          }
        } else
          logger.error("Privacy zone is required to fetch ppid.");
      }
    } catch (Exception e) {
      logger.errorf("Failed to add assertion %s to the token", ppidKey);
    }
  }

  private void addAttribute(AttributeStatementType attributeStatement, String attributeName, Object attributeValue) {
    AttributeType attribute = new AttributeType(attributeName.trim());
    attribute.setNameFormat(JBossSAMLURIConstants.ATTRIBUTE_FORMAT_BASIC.get());
    attribute.addAttributeValue(attributeValue);
    attributeStatement.addAttribute(new AttributeStatementType.ASTChoiceType(attribute));
  }
}
