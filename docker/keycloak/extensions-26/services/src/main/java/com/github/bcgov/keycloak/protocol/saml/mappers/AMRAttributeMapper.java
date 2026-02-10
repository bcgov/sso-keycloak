package com.github.bcgov.keycloak.protocol.saml.mappers;

import org.keycloak.dom.saml.v2.assertion.AttributeStatementType;
import org.keycloak.dom.saml.v2.assertion.AttributeType;
import org.keycloak.models.AuthenticatedClientSessionModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.ProtocolMapperModel;
import org.keycloak.models.UserSessionModel;
import org.keycloak.protocol.saml.mappers.AbstractSAMLProtocolMapper;
import org.keycloak.protocol.saml.mappers.AttributeStatementHelper;
import org.keycloak.protocol.saml.mappers.SAMLAttributeStatementMapper;
import org.keycloak.saml.common.constants.JBossSAMLURIConstants;

import com.github.bcgov.keycloak.common.ApplicationProperties;
import java.util.ArrayList;
import java.util.List;
import java.util.Arrays;
import java.util.stream.Collectors;

import org.jboss.logging.Logger;
import org.keycloak.provider.ProviderConfigProperty;

public class AMRAttributeMapper extends AbstractSAMLProtocolMapper implements SAMLAttributeStatementMapper {

  private static final Logger logger = Logger.getLogger(AMRAttributeMapper.class);

  ApplicationProperties applicationProperties = new ApplicationProperties();

  public static final String PROVIDER_ID = "saml-client-amr-mapper";

  private static final List<ProviderConfigProperty> configProperties = new ArrayList<ProviderConfigProperty>();

  public static final String AMR_VALUE = "amr.value";

  public static final String AMR_NAME = "amr.name";

  public static final String IDP_ALIAS = "idp.alias";

  static {
    ProviderConfigProperty amrValue = new ProviderConfigProperty();
    amrValue.setName(AMR_VALUE);
    amrValue.setLabel("AMR Value");
    amrValue.setType(ProviderConfigProperty.STRING_TYPE);
    amrValue.setDefaultValue("");
    amrValue.setHelpText("The AMR value. Use comma-separated values to include multiple, e.g. mfa,pwd.");
    configProperties.add(amrValue);

    ProviderConfigProperty amrName = new ProviderConfigProperty();
    amrName.setName(AMR_NAME);
    amrName.setLabel("AMR Attribute Name");
    amrName.setType(ProviderConfigProperty.STRING_TYPE);
    amrName.setDefaultValue("AMR");
    amrName.setHelpText("The AMR attribute name.");
    configProperties.add(amrName);

    ProviderConfigProperty idpAlias = new ProviderConfigProperty();
    idpAlias.setName(IDP_ALIAS);
    idpAlias.setLabel("IDP Alias");
    idpAlias.setType(ProviderConfigProperty.STRING_TYPE);
    idpAlias.setDefaultValue("");
    idpAlias.setHelpText("The alias of the IDP to add the AMR to.");
    configProperties.add(idpAlias);
  }

  @Override
  public String getDisplayCategory() {
    return AttributeStatementHelper.ATTRIBUTE_STATEMENT_CATEGORY;
  }

  @Override
  public String getDisplayType() {
    return "Add AMR for specific IDP";
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }

  @Override
  public String getHelpText() {
    return "Includes the provided amr in the SAML Assertion when authenticating with the provided IDP.";
  }

  @Override
  public List<ProviderConfigProperty> getConfigProperties() {
    return configProperties;
  }

  @Override
  public void transformAttributeStatement(AttributeStatementType attributeStatement, ProtocolMapperModel mappingModel,
      KeycloakSession keycloakSession, UserSessionModel userSession, AuthenticatedClientSessionModel clientSession) {
    String idpAlias = mappingModel.getConfig().get(IDP_ALIAS);
    String rawAMR = mappingModel.getConfig().get(AMR_VALUE);
    String AMRAttributeName = mappingModel.getConfig().get(AMR_NAME);
    try {
      String idp = userSession.getNotes().get("identity_provider");
      if (idp != null && idp.equalsIgnoreCase(idpAlias) && rawAMR != null) {
        List<String> amr = Arrays.stream(rawAMR.split(","))
          .map(String::trim)
          .filter(s -> !s.isEmpty())
          .collect(Collectors.toList());
        if (!amr.isEmpty()) {
          addAttribute(attributeStatement, AMRAttributeName, amr);
        }
      }
    } catch (Exception e) {
      logger.errorf("Failed to add amr assertion to the token");
    }
  }

  private void addAttribute(AttributeStatementType attributeStatement, String name, List<String> values) {
      if (values == null || values.isEmpty()) {
          return;
      }
      AttributeType attribute = new AttributeType(name.trim());
      for (String value : values) {
          if (value == null || value.isBlank()) {
              continue;
          }
          attribute.addAttributeValue(value);
      }

      attribute.setNameFormat(JBossSAMLURIConstants.ATTRIBUTE_FORMAT_BASIC.get());
      attributeStatement.addAttribute(new AttributeStatementType.ASTChoiceType(attribute));
  }

  @Override
  public int getPriority() {
    return 10;
  }
}
