package com.github.bcgov.keycloak.protocol.saml.mappers;

import org.keycloak.dom.saml.v2.assertion.AttributeStatementType;
import org.keycloak.dom.saml.v2.assertion.AttributeStatementType.ASTChoiceType;
import org.keycloak.models.AuthenticatedClientSessionModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.ProtocolMapperModel;
import org.keycloak.models.UserSessionModel;
import org.keycloak.protocol.saml.SamlProtocol;
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

  public static final String PRIVACY_ZONE_MAPPER = "privacy_zone";

  static {
    configProperties.add(new ProviderConfigProperty(ATTRIBUTE_NAME, "Attribute Name",
        "Assertion attribute name containing the ppid identifier of the authenticated subject.",
        ProviderConfigProperty.STRING_TYPE, "ppid"));
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

      ProtocolMapperModel pzMapper = clientSession.getClient()
          .getProtocolMapperByName(SamlProtocol.LOGIN_PROTOCOL, PRIVACY_ZONE_MAPPER);
      if (pzMapper != null) {
        String ppid = PPID.getPpid(applicationProperties.getIssuer(idp), userSession.getUser().getEmail(),
            pzMapper.getConfig().get(ATTRIBUTE_VALUE));
        if (!StringUtil.isNullOrEmpty(ppid)) {
          AttributeType attribute = new AttributeType(ppidKey.trim());
          attribute.setNameFormat(JBossSAMLURIConstants.ATTRIBUTE_FORMAT_BASIC.get());
          attribute.addAttributeValue(ppid);
          attributeStatement.addAttribute(new AttributeStatementType.ASTChoiceType(attribute));
        }
      } else
        logger.errorf("Could not find %s mapper", PRIVACY_ZONE_MAPPER);

      List<ASTChoiceType> attributes = attributeStatement.getAttributes();
      for (int i = attributes.size(); i-- > 0;) {
        AttributeStatementType.ASTChoiceType attribute = attributes.get(i);
        String name = attribute.getAttribute().getName();
        if (name.equals(PRIVACY_ZONE_MAPPER)) {
          attributeStatement.removeAttribute(attribute);
          break;
        }
      }

    } catch (Exception e) {
      logger.errorf("Failed to add assertion %s to the token", ppidKey);
    }
  }
}
