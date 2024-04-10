package com.github.bcgov.keycloak.protocol.saml.mappers;

import org.keycloak.dom.saml.v2.assertion.AttributeStatementType;
import org.keycloak.models.AuthenticatedClientSessionModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.ProtocolMapperModel;
import org.keycloak.models.UserSessionModel;
import org.keycloak.protocol.saml.SamlProtocol;
import org.keycloak.protocol.saml.mappers.AbstractSAMLProtocolMapper;
import org.keycloak.protocol.saml.mappers.AttributeStatementHelper;
import org.keycloak.protocol.saml.mappers.SAMLAttributeStatementMapper;
import org.keycloak.provider.ProviderConfigProperty;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class StatementAttributeOmitterMapper extends AbstractSAMLProtocolMapper
    implements SAMLAttributeStatementMapper {

  public static final String IDP_ALIASES = "identity_provider_aliases";
  public static final String STATEMENT_ATTRIBUTE_NAMES = "statement_attribute_names";

  public static final String PROVIDER_ID = "saml-omit-statement-attributes-by-idp-mapper";
  private static final List<ProviderConfigProperty> configProperties = new ArrayList<>();

  static {
    ProviderConfigProperty config = new ProviderConfigProperty();
    config.setName(IDP_ALIASES);
    config.setLabel("Identity Provider Aliases");
    config.setHelpText("");
    config.setType(ProviderConfigProperty.STRING_TYPE);
    configProperties.add(config);

    config = new ProviderConfigProperty();
    config.setName(STATEMENT_ATTRIBUTE_NAMES);
    config.setLabel("Statement Attribute Names");
    config.setHelpText("List of the statement attribute names to remove from the token.");
    config.setType(ProviderConfigProperty.STRING_TYPE);
    configProperties.add(config);
  }

  public List<ProviderConfigProperty> getConfigProperties() {
    return configProperties;
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }

  @Override
  public String getDisplayType() {
    return "Omit Statement Attributes By IDPs";
  }

  @Override
  public String getDisplayCategory() {
    return AttributeStatementHelper.ATTRIBUTE_STATEMENT_CATEGORY;
  }

  @Override
  public String getHelpText() {
    return "Omit one or multiple statement attributes";
  }

  public void transformAttributeStatement(
      AttributeStatementType attributeStatement,
      ProtocolMapperModel mappingModel,
      KeycloakSession session,
      UserSessionModel userSession,
      AuthenticatedClientSessionModel clientSession) {
    String sessionIdpAlias = userSession.getNotes().get("identity_provider");
    String idpAliases = mappingModel.getConfig().get(IDP_ALIASES);
    String[] idpAliasArr = idpAliases == null ? new String[0] : idpAliases.split(" ");

    if (idpAliasArr.length > 0) {
      if (sessionIdpAlias == null || sessionIdpAlias.trim().isEmpty()) return;
      if (!Arrays.asList(idpAliasArr).contains(sessionIdpAlias)) return;
    }

    String statementAttributes = mappingModel.getConfig().get(STATEMENT_ATTRIBUTE_NAMES);
    String[] statementAttributeArr =
        statementAttributes == null ? new String[0] : statementAttributes.split(" ");

    if (statementAttributeArr.length == 0) return;

    List<AttributeStatementType.ASTChoiceType> attributes = attributeStatement.getAttributes();

    for (int i = attributes.size(); i-- > 0; ) {
      AttributeStatementType.ASTChoiceType attribute = attributes.get(i);
      String name = attribute.getAttribute().getName();
      for (String statAttrName : statementAttributeArr) {
        if (statAttrName.equals(name)) {
          attributeStatement.removeAttribute(attribute);
          break;
        }
      }
    }
  }

  public static ProtocolMapperModel create(String name) {
    ProtocolMapperModel mapper = new ProtocolMapperModel();
    mapper.setName(name);
    mapper.setProtocolMapper(PROVIDER_ID);
    mapper.setProtocol(SamlProtocol.LOGIN_PROTOCOL);
    return mapper;
  }

  @Override
  public int getPriority() {
    return 99;
  }
}
