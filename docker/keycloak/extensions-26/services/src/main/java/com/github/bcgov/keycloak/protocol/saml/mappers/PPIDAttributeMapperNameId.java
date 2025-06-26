package com.github.bcgov.keycloak.protocol.saml.mappers;

import org.keycloak.models.AuthenticatedClientSessionModel;
import org.keycloak.models.ClientSessionContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.UserSessionModel;
import org.keycloak.protocol.saml.mappers.AbstractSAMLProtocolMapper;
import org.keycloak.protocol.saml.mappers.SAMLAttributeStatementMapper;
import org.keycloak.protocol.saml.mappers.SAMLLoginResponseMapper;
import org.keycloak.protocol.saml.SamlProtocol;
import org.keycloak.representations.idm.ProtocolMapperRepresentation;
import org.keycloak.saml.common.constants.JBossSAMLURIConstants;
import org.keycloak.saml.common.util.StringUtil;

import com.github.bcgov.keycloak.common.ApplicationProperties;
import com.github.bcgov.keycloak.common.PPID;

import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.models.ProtocolMapperModel;
import org.jboss.logging.Logger;
import org.keycloak.dom.saml.v2.assertion.AttributeStatementType;
import org.keycloak.dom.saml.v2.assertion.AttributeStatementType.ASTChoiceType;
import org.keycloak.dom.saml.v2.assertion.NameIDType;
import org.keycloak.dom.saml.v2.assertion.SubjectConfirmationType;
import org.keycloak.dom.saml.v2.assertion.SubjectType;
import org.keycloak.dom.saml.v2.protocol.ResponseType;

import java.net.URI;
import java.util.*;

public class PPIDAttributeMapperNameId extends AbstractSAMLProtocolMapper
    implements SAMLLoginResponseMapper, SAMLAttributeStatementMapper {

  private static final Logger logger = Logger.getLogger(PPIDAttributeMapperNameId.class);

  public static final String PROVIDER_ID = "saml-ppid-nameid-mapper";
  public static final String NAMEID_VALUE = "nameid.value";
  public static final String NAMEID_FORMAT = "nameid.format";
  public static final String PRIVACY_ZONE_MAPPER = "privacy_zone";
  public static final String PZ_ATTRIBUTE_VALUE = "attribute.value";

  private static final List<ProviderConfigProperty> configProperties = new ArrayList<>();

  ApplicationProperties applicationProperties = new ApplicationProperties();

  static {
    ProviderConfigProperty nameIdFormat = new ProviderConfigProperty();
    nameIdFormat.setName(NAMEID_FORMAT);
    nameIdFormat.setLabel("NameID Format");
    nameIdFormat.setType(ProviderConfigProperty.STRING_TYPE);
    nameIdFormat.setDefaultValue(JBossSAMLURIConstants.NAMEID_FORMAT_PERSISTENT.get());
    nameIdFormat.setHelpText("The NameID format to use (e.g., persistent, email, transient).");
    configProperties.add(nameIdFormat);
  }

  @Override
  public ResponseType transformLoginResponse(ResponseType response,
      ProtocolMapperModel mappingModel, KeycloakSession session,
      UserSessionModel userSession, ClientSessionContext clientSessionCtx) {
    String idp = userSession.getNotes().get("identity_provider");
    if (idp.equalsIgnoreCase("otp")) {
      String nameIdFormat = mappingModel.getConfig().get(NAMEID_FORMAT);
      ProtocolMapperModel pzMapper = clientSessionCtx.getClientSession().getClient()
          .getProtocolMapperByName(SamlProtocol.LOGIN_PROTOCOL, PRIVACY_ZONE_MAPPER);
      if (pzMapper != null) {
        String ppid = PPID.getPpid(applicationProperties.getIssuer(idp), userSession.getUser().getEmail(),
            pzMapper.getConfig().get(PZ_ATTRIBUTE_VALUE));

        if (!StringUtil.isNullOrEmpty(ppid)) {
          if (StringUtil.isNullOrEmpty(nameIdFormat)) {
            nameIdFormat = JBossSAMLURIConstants.NAMEID_FORMAT_PERSISTENT.get();
          }

          NameIDType nameID = new NameIDType();
          nameID.setFormat(URI.create(nameIdFormat));
          nameID.setValue(ppid);

          SubjectType subject = new SubjectType();
          SubjectType.STSubType subType = new SubjectType.STSubType();
          subType.addBaseID(nameID);
          subject.setSubType(subType);

          // Set NameID in the SAML response
          if (response.getAssertions() != null && !response.getAssertions().isEmpty()) {
            List<SubjectConfirmationType> subConfimationTypeList = response.getAssertions().get(0).getAssertion()
                .getSubject()
                .getConfirmation();
            for (SubjectConfirmationType subjectConfirmationType : subConfimationTypeList) {
              subject.addConfirmation(subjectConfirmationType);
            }
            response.getAssertions().get(0).getAssertion().setSubject(subject);
          }
        }
      } else
        logger.errorf("Could not find %s mapper", PRIVACY_ZONE_MAPPER);
    }
    return response;
  }

  @Override
  public String getDisplayCategory() {
    return "SAML";
  }

  @Override
  public String getDisplayType() {
    return "PPID NameID Mapper";
  }

  @Override
  public String getHelpText() {
    return "Sets PPID as the NameID in the SAML response.";
  }

  @Override
  public List<ProviderConfigProperty> getConfigProperties() {
    return configProperties;
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }

  public static ProtocolMapperRepresentation create(String name, String nameIdValue, String nameIdFormat) {
    ProtocolMapperRepresentation rep = new ProtocolMapperRepresentation();
    rep.setName(name);
    rep.setProtocol(SamlProtocol.LOGIN_PROTOCOL);
    rep.setProtocolMapper(PROVIDER_ID);

    Map<String, String> config = new HashMap<>();
    config.put(NAMEID_FORMAT, nameIdFormat);
    rep.setConfig(config);

    return rep;
  }

  @Override
  public void transformAttributeStatement(AttributeStatementType attributeStatement, ProtocolMapperModel mappingModel,
      KeycloakSession keycloakSession, UserSessionModel userSession, AuthenticatedClientSessionModel clientSession) {
    // remove privacy_zone attribute
    List<ASTChoiceType> attributes = attributeStatement.getAttributes();
    for (int i = attributes.size(); i-- > 0;) {
      AttributeStatementType.ASTChoiceType attribute = attributes.get(i);
      String name = attribute.getAttribute().getName();
      if (name.equals(PRIVACY_ZONE_MAPPER)) {
        attributeStatement.removeAttribute(attribute);
        break;
      }
    }
  }
}
