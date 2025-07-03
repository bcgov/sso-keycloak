package com.github.bcgov.keycloak.protocol.saml.mappers;

import org.keycloak.models.ClientSessionContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.UserSessionModel;
import org.keycloak.protocol.saml.mappers.AbstractSAMLProtocolMapper;
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
import org.keycloak.dom.saml.v2.assertion.NameIDType;
import org.keycloak.dom.saml.v2.assertion.SubjectConfirmationType;
import org.keycloak.dom.saml.v2.assertion.SubjectType;
import org.keycloak.dom.saml.v2.protocol.ResponseType;

import java.net.URI;
import java.util.*;

public class PPIDAttributeMapperNameId extends AbstractSAMLProtocolMapper
    implements SAMLLoginResponseMapper {

  private static final Logger logger = Logger.getLogger(PPIDAttributeMapperNameId.class);

  public static final String PROVIDER_ID = "saml-ppid-nameid-mapper";

  public static final String NAMEID_VALUE = "nameid.value";

  public static final String NAMEID_FORMAT = "nameid.format";

  public static final String PRIVACY_ZONE = "privacy_zone";

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

    ProviderConfigProperty privacyZone = new ProviderConfigProperty();
    privacyZone.setName(PRIVACY_ZONE);
    privacyZone.setLabel("Privacy Zone");
    privacyZone.setType(ProviderConfigProperty.STRING_TYPE);
    privacyZone.setDefaultValue("");
    privacyZone.setHelpText("Client privacy zone required to fetch ppid identifier of the authenticated subject.");
    configProperties.add(privacyZone);
  }

  @Override
  public ResponseType transformLoginResponse(ResponseType response,
      ProtocolMapperModel mappingModel, KeycloakSession session,
      UserSessionModel userSession, ClientSessionContext clientSessionCtx) {
    String idp = userSession.getNotes().get("identity_provider");
    if (idp.equalsIgnoreCase("otp")) {
      String nameIdFormat = mappingModel.getConfig().get(NAMEID_FORMAT);
      if (!StringUtil.isNullOrEmpty(mappingModel.getConfig().get(PRIVACY_ZONE))) {
        String ppid = PPID.getPpid(applicationProperties.getIssuer(idp), userSession.getUser().getEmail(),
            mappingModel.getConfig().get(PRIVACY_ZONE));

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
        logger.error("Privacy zone is required to fetch ppid.");
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
}
