package com.github.bcgov.keycloak.authenticators.browser;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.keycloak.authentication.Authenticator;
import org.keycloak.constants.AdapterConstants;

import jakarta.ws.rs.core.MultivaluedHashMap;
import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.Response;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.*;
import org.keycloak.services.ServicesLogger;
import org.keycloak.services.managers.AuthenticationManager;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class IdentityProviderStopForm implements Authenticator {
  protected static ServicesLogger log = ServicesLogger.LOGGER;

  @Override
  public void action(AuthenticationFlowContext context) {
    context.attempted();
  }

  @Override
  public void authenticate(AuthenticationFlowContext context) {
    List<IdentityProviderModel> realmIdps = context.getSession().identityProviders().getAllStream().toList();
    Map<String, ClientScopeModel> scopes = context.getAuthenticationSession().getClient().getClientScopes(true);

    Map<String, Map<String, String>> idpContext = new HashMap<>();

    for (IdentityProviderModel ridp : realmIdps) {
      String oidcAlias = ridp.getAlias();
      String samlAlias = oidcAlias + "-saml";

      if (ridp.isEnabled() && (scopes.containsKey(oidcAlias) || scopes.containsKey(samlAlias))) {
        Map<String, String> data = new HashMap<>();
        data.put("enabled", "true");

        String tooltip = ridp.getConfig().get("tooltip");
        if (tooltip != null && tooltip.length() > 0) {
          data.put("tooltip", tooltip);
        }

        String social = ridp.getConfig().get("social");
        if ("true".equals(social)) {
          data.put("social", social);
        }

        idpContext.put(oidcAlias, data);
      }
    }

    // if kc_idp_hint is set and matches one of the enabled idps then skip the form
    if (context.getUriInfo().getQueryParameters().containsKey(AdapterConstants.KC_IDP_HINT)) {
      String hintIdp = context.getUriInfo().getQueryParameters().getFirst(AdapterConstants.KC_IDP_HINT);
      if (hintIdp != null && !hintIdp.equals("") && idpContext.containsKey(hintIdp)) {
        context.attempted();
        return;
      }
    }

    // if only one IDP is enabled then skip the form
    if (!idpContext.isEmpty() && idpContext.size() == 1) {
      context.attempted();
      return;
    }

    MultivaluedMap<String, String> formData = new MultivaluedHashMap<>();

    try {
      ObjectMapper objectMapper = new ObjectMapper();
      String json = objectMapper.writeValueAsString(idpContext);
      log.tracef("idp context: %s", json);
      formData.add(AuthenticationManager.FORM_USERNAME, json);
    } catch (JsonProcessingException e) {
      e.printStackTrace();
      formData.add(AuthenticationManager.FORM_USERNAME, "{}");
    }

    Response challengeResponse = challenge(context, formData);
    context.challenge(challengeResponse);
  }

  @Override
  public boolean requiresUser() {
    return false;
  }

  protected Response challenge(
      AuthenticationFlowContext context, MultivaluedMap<String, String> formData) {
    LoginFormsProvider forms = context.form();

    if (formData.size() > 0)
      forms.setFormData(formData);

    return forms.createLoginUsernamePassword();
  }

  @Override
  public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
    // never called
    return true;
  }

  @Override
  public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {
    // never called
  }

  @Override
  public void close() {
    /* This is ok */ }
}
