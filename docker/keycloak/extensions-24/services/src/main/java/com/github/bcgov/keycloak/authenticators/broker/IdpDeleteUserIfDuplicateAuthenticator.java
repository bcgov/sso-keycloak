package com.github.bcgov.keycloak.authenticators.broker;

import org.jboss.logging.Logger;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.authenticators.broker.AbstractIdpAuthenticator;
import org.keycloak.authentication.authenticators.broker.util.ExistingUserInfo;
import org.keycloak.authentication.authenticators.broker.util.SerializedBrokeredIdentityContext;
import org.keycloak.broker.provider.BrokeredIdentityContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.services.ServicesLogger;

import java.util.List;
import java.util.Map;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class IdpDeleteUserIfDuplicateAuthenticator extends AbstractIdpAuthenticator {

  private static Logger logger = Logger.getLogger(IdpDeleteUserIfDuplicateAuthenticator.class);

  @Override
  protected void actionImpl(
      AuthenticationFlowContext context,
      SerializedBrokeredIdentityContext serializedCtx,
      BrokeredIdentityContext brokerContext) { /* This is ok */ }

  @Override
  protected void authenticateImpl(
      AuthenticationFlowContext context,
      SerializedBrokeredIdentityContext serializedCtx,
      BrokeredIdentityContext brokerContext) {

    KeycloakSession session = context.getSession();
    RealmModel realm = context.getRealm();

    if (context.getAuthenticationSession().getAuthNote(EXISTING_USER_INFO) != null) {
      context.attempted();
      return;
    }

    String username = getUsername(context, serializedCtx, brokerContext);
    if (username == null) {
      ServicesLogger.LOGGER.resetFlow(realm.isRegistrationEmailAsUsername() ? "Email" : "Username");
      context.getAuthenticationSession().setAuthNote(ENFORCE_UPDATE_PROFILE, "true");
      context.resetFlow();
      return;
    }

    ExistingUserInfo duplication =
        checkExistingUser(context, username, serializedCtx, brokerContext);

    if (duplication != null) {
      logger.debugf(
          "Duplication detected. There is already existing user with %s '%s' .",
          duplication.getDuplicateAttributeName(), duplication.getDuplicateAttributeValue());

      UserModel federatedUser = session.users().getUserById(realm, duplication.getExistingUserId());
      session.users().removeUser(realm, federatedUser);
    }

    logger.debugf(
        "No duplication detected. Creating account for user '%s' and linking with identity provider '%s' .",
        username, brokerContext.getIdpConfig().getAlias());

    UserModel federatedUser = session.users().addUser(realm, username);
    federatedUser.setEnabled(true);

    for (Map.Entry<String, List<String>> attr : serializedCtx.getAttributes().entrySet()) {
      if (!UserModel.USERNAME.equalsIgnoreCase(attr.getKey())) {
        federatedUser.setAttribute(attr.getKey(), attr.getValue());
      }
    }

    context.setUser(federatedUser);
    context.getAuthenticationSession().setAuthNote(BROKER_REGISTERED_NEW_USER, "true");
    context.success();
  }

  // Could be overriden to detect duplication based on other criterias (firstName, lastName, ...)
  protected ExistingUserInfo checkExistingUser(
      AuthenticationFlowContext context,
      String username,
      SerializedBrokeredIdentityContext serializedCtx,
      BrokeredIdentityContext brokerContext) {

    if (brokerContext.getEmail() != null && !context.getRealm().isDuplicateEmailsAllowed()) {
      UserModel existingUser =
          context.getSession().users().getUserByEmail(context.getRealm(), brokerContext.getEmail());
      if (existingUser != null) {
        return new ExistingUserInfo(existingUser.getId(), UserModel.EMAIL, existingUser.getEmail());
      }
    }

    UserModel existingUser =
        context.getSession().users().getUserByUsername(context.getRealm(), username);
    if (existingUser != null) {
      return new ExistingUserInfo(
          existingUser.getId(), UserModel.USERNAME, existingUser.getUsername());
    }

    return null;
  }

  protected String getUsername(
      AuthenticationFlowContext context,
      SerializedBrokeredIdentityContext serializedCtx,
      BrokeredIdentityContext brokerContext) {
    RealmModel realm = context.getRealm();
    return realm.isRegistrationEmailAsUsername()
        ? brokerContext.getEmail()
        : brokerContext.getModelUsername();
  }

  @Override
  public boolean requiresUser() {
    return false;
  }

  @Override
  public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
    return true;
  }
}
