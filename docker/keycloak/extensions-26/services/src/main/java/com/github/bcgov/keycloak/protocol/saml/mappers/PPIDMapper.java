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

import com.github.bcgov.keycloak.common.ApplicationProperties;
import com.github.bcgov.keycloak.common.PPIDToken;

import org.keycloak.dom.saml.v2.assertion.AttributeType;

import java.util.ArrayList;
import java.util.List;

import org.jboss.logging.Logger;
import org.keycloak.provider.ProviderConfigProperty;

public class PPIDMapper extends AbstractSAMLProtocolMapper implements SAMLAttributeStatementMapper {

  private static final Logger logger = Logger.getLogger(PPIDMapper.class);

  ApplicationProperties applicationProperties = new ApplicationProperties();

  public static final String PROVIDER_ID = "saml-idp-ppid-mapper";

  private static final List<ProviderConfigProperty> configProperties = new ArrayList<ProviderConfigProperty>();

  public static final String CLAIM_VALUE = "claim.value";

  public static final String CLAIM_NAME = "claim.name";
  static {
    configProperties.add(new ProviderConfigProperty(CLAIM_NAME, "Claim Name",
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
    String ppidKey = mappingModel.getConfig().get(CLAIM_NAME);
    try {
      String idp = userSession.getNotes().get("identity_provider");

      ProtocolMapperModel proto = clientSession.getClient()
          .getProtocolMapperByName("saml", "privacy_zone");

      String ppid = PPIDToken.getPpid(applicationProperties.getIssuer(idp), userSession.getUser().getEmail(),
          proto.getConfig().get(CLAIM_VALUE));

      if (ppid != null) {
        AttributeType attribute = new AttributeType(ppidKey.trim());
        attribute.setNameFormat(JBossSAMLURIConstants.ATTRIBUTE_FORMAT_BASIC.get());
        attribute.addAttributeValue(ppid);
        attributeStatement.addAttribute(new AttributeStatementType.ASTChoiceType(attribute));
      }

    } catch (Exception e) {
      logger.errorf("Failed to add assertion %s to the token", ppidKey);
    }
  }
}
