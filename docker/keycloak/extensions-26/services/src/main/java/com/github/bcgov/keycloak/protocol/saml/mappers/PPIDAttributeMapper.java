package com.github.bcgov.keycloak.protocol.saml.mappers;

import org.keycloak.dom.saml.v2.assertion.AttributeStatementType;
import org.keycloak.models.AuthenticatedClientSessionModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.ProtocolMapperModel;
import org.keycloak.models.UserSessionModel;
import org.keycloak.protocol.saml.mappers.AbstractSAMLProtocolMapper;
import org.keycloak.protocol.saml.mappers.AttributeStatementHelper;
import org.keycloak.protocol.saml.mappers.SAMLAttributeStatementMapper;
import org.keycloak.saml.common.constants.JBossSAMLURIConstants;
import org.keycloak.saml.common.util.StringUtil;

import com.github.bcgov.keycloak.common.ApplicationProperties;
import com.github.bcgov.keycloak.common.PPID;

import org.keycloak.dom.saml.v2.assertion.AttributeType;

import java.util.ArrayList;
import java.util.List;

import org.jboss.logging.Logger;
import org.keycloak.provider.ProviderConfigProperty;

public class PPIDAttributeMapper extends AbstractSAMLProtocolMapper implements SAMLAttributeStatementMapper {

  private static final Logger logger = Logger.getLogger(PPIDAttributeMapper.class);

  ApplicationProperties applicationProperties = new ApplicationProperties();

  public static final String PROVIDER_ID = "saml-idp-ppid-mapper";

  private static final List<ProviderConfigProperty> configProperties = new ArrayList<ProviderConfigProperty>();

  public static final String ATTRIBUTE_VALUE = "attribute.value";

  public static final String ATTRIBUTE_NAME = "attribute.name";

  public static final String PRIVACY_ZONE = "privacy_zone";

  static {
    ProviderConfigProperty attributeName = new ProviderConfigProperty();
    attributeName.setName(ATTRIBUTE_NAME);
    attributeName.setLabel("Attribute Name");
    attributeName.setType(ProviderConfigProperty.STRING_TYPE);
    attributeName.setDefaultValue("sub");
    attributeName.setHelpText("Assertion attribute name containing the ppid identifier of the authenticated subject.");
    configProperties.add(attributeName);

    ProviderConfigProperty privacyZone = new ProviderConfigProperty();
    privacyZone.setName(PRIVACY_ZONE);
    privacyZone.setLabel("Privacy Zone");
    privacyZone.setType(ProviderConfigProperty.STRING_TYPE);
    privacyZone.setDefaultValue("");
    privacyZone.setHelpText("Client privacy zone required to fetch ppid identifier of the authenticated subject.");
    configProperties.add(privacyZone);
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
      if (idp.equalsIgnoreCase("otp")) {
        if (!StringUtil.isNullOrEmpty(mappingModel.getConfig().get(PRIVACY_ZONE))) {
          String ppid = PPID.getPpid(applicationProperties.getIssuer(idp), userSession.getUser().getEmail(),
              mappingModel.getConfig().get(PRIVACY_ZONE));
          if (!StringUtil.isNullOrEmpty(ppid)) {
            addAttribute(attributeStatement, ppidKey.trim(), ppid);
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
