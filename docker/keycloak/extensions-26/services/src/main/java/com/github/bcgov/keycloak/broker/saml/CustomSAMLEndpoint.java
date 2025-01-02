package com.github.bcgov.keycloak.broker.saml;

import java.util.List;
import java.util.Objects;

import javax.xml.crypto.dsig.XMLSignature;

import org.jboss.logging.Logger;
import org.keycloak.broker.provider.IdentityProvider;
import org.keycloak.broker.saml.SAMLEndpoint;
import org.keycloak.broker.saml.SAMLIdentityProvider;
import org.keycloak.broker.saml.SAMLIdentityProviderConfig;
import org.keycloak.dom.saml.v2.protocol.ResponseType;
import org.keycloak.common.ClientConnection;
import org.keycloak.common.VerificationException;
import org.keycloak.dom.saml.v2.protocol.StatusResponseType;
import org.keycloak.events.Details;
import org.keycloak.events.Errors;
import org.keycloak.events.EventBuilder;
import org.keycloak.events.EventType;
import org.keycloak.models.KeycloakSession;
import org.keycloak.protocol.saml.SamlProtocol;
import org.keycloak.protocol.saml.SamlProtocolUtils;
import org.keycloak.saml.SAMLRequestParser;
import org.keycloak.saml.common.constants.GeneralConstants;
import org.keycloak.saml.common.constants.JBossSAMLURIConstants;
import org.keycloak.saml.processing.core.saml.v2.common.SAMLDocumentHolder;
import org.keycloak.saml.processing.web.util.PostBindingUtil;
import org.keycloak.saml.validators.DestinationValidator;
import org.keycloak.services.ErrorPage;
import org.keycloak.services.Urls;
import org.keycloak.services.messages.Messages;
import org.keycloak.utils.MediaType;
import org.w3c.dom.NodeList;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;

public class CustomSAMLEndpoint extends SAMLEndpoint {

  private static final Logger logger = Logger.getLogger(CustomSAMLEndpoint.class);

  @Context
  private final KeycloakSession session;
  private final DestinationValidator destinationValidator;
  private final ClientConnection clientConnection;

  public CustomSAMLEndpoint(KeycloakSession session, SAMLIdentityProvider provider, SAMLIdentityProviderConfig config,
      IdentityProvider.AuthenticationCallback callback, DestinationValidator destinationValidator) {
    super(session, provider, config, callback, destinationValidator);
    this.session = session;
    this.destinationValidator = destinationValidator;
    this.clientConnection = session.getContext().getConnection();
  }

  @POST
  @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
  public Response postBinding(@FormParam("SAMLRequest") String samlRequest,
      @FormParam("SAMLResponse") String samlResponse, @FormParam("RelayState") String relayState) {
    return (new CustomSAMLEndpoint.CustomPostBinding()).execute(samlRequest, samlResponse, (String) null, relayState,
        (String) null);
  }

  protected abstract class CustomBinding extends SAMLEndpoint.Binding {

    public Response execute(String samlRequest, String samlResponse, String samlArt, String relayState,
        String clientId) {
      event = new EventBuilder(realm, session, clientConnection);
      Response response = basicChecks(samlRequest, samlResponse, samlArt);
      if (response != null)
        return response;
      if (samlRequest != null)
        return handleSamlRequest(samlRequest, relayState);
      if (samlArt != null)
        return handleSamlArt(samlArt, relayState, clientId);
      else
        return customHandleSamlResponse(samlResponse, relayState, clientId);
    }

    private String getExpectedDestination(String providerAlias, String clientId) {
      if (clientId != null) {
        return Urls.identityProviderAuthnResponse(session.getContext().getUri().getBaseUri(), providerAlias,
            realm.getName(), clientId).toString();
      }
      return Urls
          .identityProviderAuthnResponse(session.getContext().getUri().getBaseUri(), providerAlias, realm.getName())
          .toString();
    }

    public Response customHandleSamlResponse(String samlResponse, String relayState, String clientId) {

      SAMLDocumentHolder holder = extractResponseDocument(samlResponse);

      logger.info("im here");

      if (holder == null) {
        logger.error("saml response is null");
        event.event(EventType.IDENTITY_PROVIDER_RESPONSE);
        event.detail(Details.REASON, Errors.INVALID_SAML_DOCUMENT);
        event.error(Errors.INVALID_SAML_RESPONSE);
        return ErrorPage.error(session, null, Response.Status.BAD_REQUEST, Messages.IDENTITY_PROVIDER_INVALID_RESPONSE);
      }

      StatusResponseType statusResponse = (StatusResponseType) holder.getSamlObject();
      // validate destination
      if (isDestinationRequired()
          && statusResponse.getDestination() == null && containsUnencryptedSignature(holder)) {
        event.event(EventType.IDENTITY_PROVIDER_RESPONSE);
        event.detail(Details.REASON, Errors.MISSING_REQUIRED_DESTINATION);
        event.error(Errors.INVALID_SAML_RESPONSE);
        return ErrorPage.error(session, null, Response.Status.BAD_REQUEST, Messages.INVALID_REQUEST);
      }
      if (!destinationValidator.validate(getExpectedDestination(config.getAlias(), clientId),
          statusResponse.getDestination())) {
        event.event(EventType.IDENTITY_PROVIDER_RESPONSE);
        event.detail(Details.REASON, Errors.INVALID_DESTINATION);
        event.error(Errors.INVALID_SAML_RESPONSE);
        return ErrorPage.error(session, null, Response.Status.BAD_REQUEST, Messages.INVALID_REQUEST);
      }

      // lookout for authn failed status
      if (statusResponse.getStatus() != null && statusResponse.getStatus().getStatusCode() != null
          && statusResponse.getStatus().getStatusCode().getValue() != null
          && Objects.equals(statusResponse.getStatus().getStatusCode().getValue().toString(),
              JBossSAMLURIConstants.STATUS_AUTHNFAILED.get())) {
        logger.error("authentication failed");
        event.event(EventType.IDENTITY_PROVIDER_RESPONSE);
        event.error(Errors.INVALID_AUTHENTICATION_SESSION);
        return ErrorPage.error(session, null, Response.Status.BAD_REQUEST,
            Messages.IDENTITY_PROVIDER_AUTHENTICATION_FAILED);
      }

      if (config.isValidateSignature()) {
        try {
          verifySignature(GeneralConstants.SAML_RESPONSE_KEY, holder);
        } catch (VerificationException e) {
          logger.error("validation failed", e);
          event.event(EventType.IDENTITY_PROVIDER_RESPONSE);
          event.error(Errors.INVALID_SIGNATURE);
          return ErrorPage.error(session, null, Response.Status.BAD_REQUEST,
              Messages.IDENTITY_PROVIDER_INVALID_SIGNATURE);
        }
      }
      if (statusResponse instanceof ResponseType) {
        return handleLoginResponse(samlResponse, holder, (ResponseType) statusResponse, relayState, clientId);

      } else {
        // todo need to check that it is actually a LogoutResponse
        return handleLogoutResponse(holder, statusResponse, relayState);
      }
      // throw new RuntimeException("Unknown response type");

    }
  }

  protected class CustomPostBinding extends CustomBinding {
    protected CustomPostBinding() {
      super();
    }

    @Override
    protected boolean containsUnencryptedSignature(SAMLDocumentHolder documentHolder) {
      NodeList nl = documentHolder.getSamlDocument().getElementsByTagNameNS(XMLSignature.XMLNS, "Signature");
      return (nl != null && nl.getLength() > 0);
    }

    @Override
    protected void verifySignature(String key, SAMLDocumentHolder documentHolder) throws VerificationException {
      if ((!containsUnencryptedSignature(documentHolder)) && (documentHolder.getSamlObject() instanceof ResponseType)) {
        ResponseType responseType = (ResponseType) documentHolder.getSamlObject();
        List<ResponseType.RTChoiceType> assertions = responseType.getAssertions();
        if (!assertions.isEmpty()) {
          // Only relax verification if the response is an authnresponse and contains
          // (encrypted/plaintext) assertion.
          // In that case, signature is validated on assertion element
          return;
        }
      }
      SamlProtocolUtils.verifyDocumentSignature(documentHolder.getSamlDocument(), getIDPKeyLocator());
    }

    @Override
    protected SAMLDocumentHolder extractRequestDocument(String samlRequest) {
      return SAMLRequestParser.parseRequestPostBinding(samlRequest);
    }

    @Override
    protected SAMLDocumentHolder extractResponseDocument(String response) {
      byte[] samlBytes = PostBindingUtil.base64Decode(response);
      return SAMLRequestParser.parseResponseDocument(samlBytes);
    }

    @Override
    protected String getBindingType() {
      return SamlProtocol.SAML_POST_BINDING;
    }
  }
}
