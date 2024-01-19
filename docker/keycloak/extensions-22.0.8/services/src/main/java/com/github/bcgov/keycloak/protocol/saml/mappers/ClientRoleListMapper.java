package com.github.bcgov.keycloak.protocol.saml.mappers;

import org.keycloak.dom.saml.v2.assertion.AttributeStatementType;
import org.keycloak.dom.saml.v2.assertion.AttributeType;
import org.keycloak.models.*;
import org.keycloak.protocol.saml.SamlProtocol;
import org.keycloak.protocol.saml.mappers.AbstractSAMLProtocolMapper;
import org.keycloak.protocol.saml.mappers.AttributeStatementHelper;
import org.keycloak.protocol.saml.mappers.SAMLRoleListMapper;
import org.keycloak.provider.ProviderConfigProperty;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class ClientRoleListMapper extends AbstractSAMLProtocolMapper implements SAMLRoleListMapper {
  public static final String PROVIDER_ID = "saml-client-role-list-mapper";
  public static final String SINGLE_ROLE_ATTRIBUTE = "single";
  private static final List<ProviderConfigProperty> configProperties = new ArrayList<>();

  static {
    ProviderConfigProperty property;
    property = new ProviderConfigProperty();
    property.setName(AttributeStatementHelper.SAML_ATTRIBUTE_NAME);
    property.setLabel("Role attribute name");
    property.setDefaultValue("Role");
    property.setHelpText(
        "Name of the SAML attribute you want to put your roles into.  i.e. 'Role', 'memberOf'.");
    configProperties.add(property);

    property = new ProviderConfigProperty();
    property.setName(AttributeStatementHelper.FRIENDLY_NAME);
    property.setLabel(AttributeStatementHelper.FRIENDLY_NAME_LABEL);
    property.setHelpText(AttributeStatementHelper.FRIENDLY_NAME_HELP_TEXT);
    configProperties.add(property);

    property = new ProviderConfigProperty();
    property.setName(AttributeStatementHelper.SAML_ATTRIBUTE_NAMEFORMAT);
    property.setLabel("SAML Attribute NameFormat");
    property.setHelpText(
        "SAML Attribute NameFormat.  Can be basic, URI reference, or unspecified.");

    List<String> types = new ArrayList(3);
    types.add(AttributeStatementHelper.BASIC);
    types.add(AttributeStatementHelper.URI_REFERENCE);
    types.add(AttributeStatementHelper.UNSPECIFIED);
    property.setType(ProviderConfigProperty.LIST_TYPE);
    property.setOptions(types);
    configProperties.add(property);

    property = new ProviderConfigProperty();
    property.setName(SINGLE_ROLE_ATTRIBUTE);
    property.setLabel("Single Role Attribute");
    property.setType(ProviderConfigProperty.BOOLEAN_TYPE);
    property.setDefaultValue("true");
    property.setHelpText(
        "If true, all roles will be stored under one attribute with multiple attribute values.");
    configProperties.add(property);
  }

  @Override
  public String getDisplayCategory() {
    return "Client Role Mapper";
  }

  @Override
  public String getDisplayType() {
    return "Client role list";
  }

  @Override
  public String getHelpText() {
    return "This mapper stores client-level roles. You can also specify the attribute name i.e. 'Client Roles' or 'memberOf' being examples.";
  }

  @Override
  public List<ProviderConfigProperty> getConfigProperties() {
    return configProperties;
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }

  @Override
  public void mapRoles(
      AttributeStatementType roleAttributeStatement,
      ProtocolMapperModel mappingModel,
      KeycloakSession session,
      UserSessionModel userSession,
      ClientSessionContext clientSessionCtx) {
    String single = mappingModel.getConfig().get(SINGLE_ROLE_ATTRIBUTE);
    boolean singleAttribute = Boolean.parseBoolean(single);

    AtomicReference<AttributeType> singleAttributeType = new AtomicReference<>(null);

    List<String> allClientRoleNames =
        userSession
            .getUser()
            .getClientRoleMappingsStream(clientSessionCtx.getClientSession().getClient())
            .map(RoleModel::getName)
            .toList();

    for (String roleName : allClientRoleNames) {
      AttributeType attributeType;
      if (singleAttribute) {
        if (singleAttributeType.get() == null) {
          singleAttributeType.set(AttributeStatementHelper.createAttributeType(mappingModel));
          roleAttributeStatement.addAttribute(
              new AttributeStatementType.ASTChoiceType(singleAttributeType.get()));
        }
        attributeType = singleAttributeType.get();
      } else {
        attributeType = AttributeStatementHelper.createAttributeType(mappingModel);
        roleAttributeStatement.addAttribute(
            new AttributeStatementType.ASTChoiceType(attributeType));
      }

      attributeType.addAttributeValue(roleName);
    }
  }

  public static ProtocolMapperModel create(
      String name,
      String samlAttributeName,
      String nameFormat,
      String friendlyName,
      boolean singleAttribute) {
    ProtocolMapperModel mapper = new ProtocolMapperModel();
    mapper.setName(name);
    mapper.setProtocolMapper(PROVIDER_ID);
    mapper.setProtocol(SamlProtocol.LOGIN_PROTOCOL);

    Map<String, String> config = new HashMap<>();
    config.put(AttributeStatementHelper.SAML_ATTRIBUTE_NAME, samlAttributeName);
    if (friendlyName != null) {
      config.put(AttributeStatementHelper.FRIENDLY_NAME, friendlyName);
    }
    if (nameFormat != null) {
      config.put(AttributeStatementHelper.SAML_ATTRIBUTE_NAMEFORMAT, nameFormat);
    }

    config.put(SINGLE_ROLE_ATTRIBUTE, Boolean.toString(singleAttribute));
    mapper.setConfig(config);

    return mapper;
  }
}
