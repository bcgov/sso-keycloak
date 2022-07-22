package com.github.bcgov.keycloak.authenticators.browser;

import java.util.List;
import java.util.Map;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;
import org.jboss.resteasy.specimpl.MultivaluedMapImpl;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.authenticators.browser.AbstractUsernameFormAuthenticator;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.ClientScopeModel;
import org.keycloak.models.IdentityProviderModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.services.ServicesLogger;
import org.keycloak.services.managers.AuthenticationManager;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class IdentityProviderStopForm extends AbstractUsernameFormAuthenticator {
  protected static ServicesLogger log = ServicesLogger.LOGGER;

  @Override
  public void action(AuthenticationFlowContext context) {
    context.attempted();
  }

  @Override
  public void authenticate(AuthenticationFlowContext context) {
    List<IdentityProviderModel> realmIdps = context.getRealm().getIdentityProviders();
    Map<String, ClientScopeModel> scopes =
        context.getAuthenticationSession().getClient().getClientScopes(true);
    String idpkeys = "";

    for (IdentityProviderModel ridp : realmIdps) {
      String oidcAlias = ridp.getAlias();
      String samlAlias = ridp.getAlias() + "-saml";

      if (ridp.isEnabled() && (scopes.containsKey(oidcAlias) || scopes.containsKey(samlAlias))) {
        idpkeys += "##" + ridp.getAlias() + "##";
      }
    }

    MultivaluedMap<String, String> formData = new MultivaluedMapImpl<>();
    formData.add(AuthenticationManager.FORM_USERNAME, idpkeys);
    log.tracef("allowed idps: %s", idpkeys);
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

    if (formData.size() > 0) forms.setFormData(formData);

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
  public void close() {}
}
