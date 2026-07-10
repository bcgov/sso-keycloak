package com.github.bcgov.keycloak.protocol.saml.mappers;

import org.keycloak.models.ClientScopeModel;
import org.keycloak.models.ClientSessionContext;
import org.keycloak.models.IdentityProviderModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.UserSessionModel;
import org.keycloak.protocol.saml.mappers.AbstractSAMLProtocolMapper;
import org.keycloak.protocol.saml.mappers.SAMLLoginResponseMapper;
import org.keycloak.protocol.saml.SamlProtocol;
import org.keycloak.representations.idm.ProtocolMapperRepresentation;
import org.keycloak.saml.common.constants.JBossSAMLURIConstants;
import org.keycloak.saml.common.util.StringUtil;

import com.github.bcgov.keycloak.common.PPID;

import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.models.ProtocolMapperModel;
import org.keycloak.models.RealmModel;
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

  public static final String PPID_SERVICE_ACCOUNT_IDP_ALIAS = "ppid-service-account";

  private static final List<ProviderConfigProperty> configProperties = new ArrayList<>();

  static {
    ProviderConfigProperty property = new ProviderConfigProperty();

    property = new ProviderConfigProperty();
    property.setName(NAMEID_FORMAT);
    property.setLabel("NameID Format");
    property.setType(ProviderConfigProperty.STRING_TYPE);
    property.setDefaultValue(JBossSAMLURIConstants.NAMEID_FORMAT_PERSISTENT.get());
    property.setHelpText("The NameID format to use (e.g., persistent, email, transient).");
    configProperties.add(property);
  }

  @Override
  public ResponseType transformLoginResponse(ResponseType response,
      ProtocolMapperModel mappingModel, KeycloakSession keycloakSession,
      UserSessionModel userSession, ClientSessionContext clientSessionCtx) {
    String idp = userSession.getNotes().get("identity_provider");
    IdentityProviderModel authIdpConfig = keycloakSession.identityProviders().getByAlias(idp);
    if (idp.equalsIgnoreCase("otp") || authIdpConfig.getDisplayName().equalsIgnoreCase("bc services card")) {

      String authIdp = null;

      String sub = null;

      String nameIdFormat = mappingModel.getConfig().get(NAMEID_FORMAT);

      IdentityProviderModel identityProviderModel = keycloakSession.identityProviders()
          .getByAlias(PPID_SERVICE_ACCOUNT_IDP_ALIAS);

      if (identityProviderModel == null) {
        logger.error("Identity provider with alias " + PPID_SERVICE_ACCOUNT_IDP_ALIAS + " not found.");
        return response;
      }

      RealmModel realm = keycloakSession.getContext().getRealm();

      realm.getClientScopesStream().forEach(scope -> {
          scope.getProtocolMappersStream().forEach(pm -> {
              if (pm.getName().equals(mappingModel.getName())) {
                  logger.info(
                      "Found mapper '" + pm.getName() +
                      "' in scope '" + scope.getName() +
                      "' with id=" + pm.getId());
              }
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
          return response;
        }

        String ppid = PPID.getPpid(authIdp,
            identityProviderModel.getConfig().get("clientId"),
            identityProviderModel.getConfig().get("clientSecret"),
            sub,
            scope.getName());

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
        } else {
          logger.error("Failed to fetch ppid for the user.");
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
