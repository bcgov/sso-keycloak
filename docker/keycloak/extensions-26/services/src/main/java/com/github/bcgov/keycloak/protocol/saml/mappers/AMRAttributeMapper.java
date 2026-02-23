package com.github.bcgov.keycloak.protocol.saml.mappers;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.jboss.logging.Logger;
import org.keycloak.dom.saml.v2.protocol.ResponseType;
import org.keycloak.dom.saml.v2.assertion.StatementAbstractType;
import org.keycloak.dom.saml.v2.assertion.AuthnStatementType;
import org.keycloak.dom.saml.v2.assertion.AuthnContextClassRefType;
import org.keycloak.models.ClientSessionContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.ProtocolMapperModel;
import org.keycloak.models.UserSessionModel;
import org.keycloak.protocol.saml.mappers.AbstractSAMLProtocolMapper;
import org.keycloak.protocol.saml.mappers.AttributeStatementHelper;
import org.keycloak.protocol.saml.mappers.SAMLLoginResponseMapper;
import org.keycloak.provider.ProviderConfigProperty;

public class AMRAttributeMapper extends AbstractSAMLProtocolMapper implements SAMLLoginResponseMapper {

  private static final Logger logger = Logger.getLogger(AMRAttributeMapper.class);

  public static final String PROVIDER_ID = "saml-client-amr-mapper";

  private static final List<ProviderConfigProperty> configProperties = new ArrayList<ProviderConfigProperty>();

  public static final String AMR_VALUE = "amr.value";

  public static final String AMR_NAME = "amr.name";

  public static final String IDP_ALIAS = "idp.alias";

  private static final String SAML_AC_PREFIX = "urn:oasis:names:tc:SAML:2.0:ac:classes:";

  static {
    ProviderConfigProperty amrValue = new ProviderConfigProperty();
    amrValue.setName(AMR_VALUE);
    amrValue.setLabel("AMR Value");
    amrValue.setType(ProviderConfigProperty.STRING_TYPE);
    amrValue.setDefaultValue("");
    amrValue.setHelpText("The authentication context class to use, e.g. InternetProtocol. Will be appended to the URI");
    configProperties.add(amrValue);

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
  public int getPriority() {
    return 10;
  }

  @Override
  public ResponseType transformLoginResponse(ResponseType response, ProtocolMapperModel mappingModel,
      KeycloakSession session, UserSessionModel userSession, ClientSessionContext clientSessionCtx) {
    if (response == null || mappingModel == null || userSession == null) {
      return response;
    }

    Map<String, String> config = mappingModel.getConfig();
    if (config == null) {
      return response;
    }

    String idpAlias = config.get(IDP_ALIAS);
    String rawAMR = config.get(AMR_VALUE);
    String idp = userSession.getNote("identity_provider");

    // Only apply AMR when the expected identity provider is being used
    if (idpAlias == null || rawAMR == null || idp == null || !idp.equalsIgnoreCase(idpAlias)) {
      return response;
    }

    try {
      for (ResponseType.RTChoiceType assertion : response.getAssertions()) {
        for (StatementAbstractType statement : assertion.getAssertion().getStatements()) {
          if (statement instanceof AuthnStatementType authnStatement) {
            authnStatement.getAuthnContext().getSequence()
                .setClassRef(new AuthnContextClassRefType(URI.create(SAML_AC_PREFIX + rawAMR)));
          }
        }
      }
    } catch (Exception e) {
      logger.error("Failed to add amr assertion to the token" + e);
    }
    return response;
  }
}
