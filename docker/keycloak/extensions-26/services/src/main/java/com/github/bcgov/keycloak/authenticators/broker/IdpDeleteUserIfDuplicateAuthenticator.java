package com.github.bcgov.keycloak.authenticators.broker;

import org.jboss.logging.Logger;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.authenticators.broker.AbstractIdpAuthenticator;
import org.keycloak.authentication.authenticators.broker.util.ExistingUserInfo;
import org.keycloak.authentication.authenticators.broker.util.SerializedBrokeredIdentityContext;
import org.keycloak.broker.provider.BrokeredIdentityContext;
import org.keycloak.models.AuthenticatorConfigModel;
import org.keycloak.models.ClientModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.RoleModel;
import org.keycloak.models.UserModel;
import org.keycloak.services.ServicesLogger;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.keycloak.broker.provider.AbstractIdentityProvider.BROKER_REGISTERED_NEW_USER;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class IdpDeleteUserIfDuplicateAuthenticator extends AbstractIdpAuthenticator {

  private static Logger logger = Logger.getLogger(IdpDeleteUserIfDuplicateAuthenticator.class);

  @Override
  protected void actionImpl(
      AuthenticationFlowContext context,
      SerializedBrokeredIdentityContext serializedCtx,
      BrokeredIdentityContext brokerContext) {
    /* This is ok */ }

  @Override
  protected void authenticateImpl(
      AuthenticationFlowContext context,
      SerializedBrokeredIdentityContext serializedCtx,
      BrokeredIdentityContext brokerContext) {

    KeycloakSession session = context.getSession();
    RealmModel realm = context.getRealm();

    Set<String> realmRoles = null;

    Map<String, Set<String>> clientRoles = null;

    AuthenticatorConfigModel authConfig = context.getAuthenticatorConfig();

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

    ExistingUserInfo duplication = checkExistingUser(context, username, serializedCtx, brokerContext);

    if (duplication != null) {
      logger.debugf(
          "Duplication detected. There is already existing user with %s '%s' .",
          duplication.getDuplicateAttributeName(), duplication.getDuplicateAttributeValue());

      UserModel federatedUser = session.users().getUserById(realm, duplication.getExistingUserId());

      if (Boolean.valueOf(authConfig.getConfig().get("preserveRealmRoles"))) {
        // collect realm roles
        realmRoles = federatedUser.getRealmRoleMappingsStream()
            .map(RoleModel::getName)
            .collect(Collectors.toSet());
      }
      if (Boolean.valueOf(authConfig.getConfig().get("preserveClientRoles"))) {
        // collect client roles: map of clientId -> set(roleName)
        clientRoles = new HashMap<>();
        for (RoleModel role : federatedUser.getRoleMappingsStream().collect(Collectors.toSet())) {
          if (role.getContainer() instanceof ClientModel) {
            ClientModel client = (ClientModel) role.getContainer();
            clientRoles.computeIfAbsent(client.getClientId(), k -> new HashSet<>())
                .add(role.getName());
          }
        }
      }

      session.users().removeUser(realm, federatedUser);
    }

    Map<String, Object> userRoles = new HashMap<>();
    userRoles.put("realmRoles", realmRoles);
    userRoles.put("clientRoles", clientRoles);

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

    if (Boolean.valueOf(authConfig.getConfig().get("preserveRealmRoles"))) {
      // Reapply roles
      // 1) realm roles
      Set<String> rr = (Set<String>) userRoles.get("realmRoles");
      if (rr != null) {
        for (String roleName : rr) {
          RoleModel roleModel = realm.getRole(roleName);
          if (roleModel != null) {
            federatedUser.grantRole(roleModel);
          }
        }
      }
    }
    if (Boolean.valueOf(authConfig.getConfig().get("preserveClientRoles"))) {
      // 2) client roles
      Map<String, Set<String>> cr = (Map<String, Set<String>>) userRoles.get("clientRoles");
      if (cr != null) {
        for (Map.Entry<String, Set<String>> e : cr.entrySet()) {
          String clientId = e.getKey();
          ClientModel client = realm.getClientByClientId(clientId);
          if (client == null)
            continue;
          for (String roleName : e.getValue()) {
            RoleModel clientRole = client.getRole(roleName);
            if (clientRole != null) {
              federatedUser.grantRole(clientRole);
            }
          }
        }
      }
    }

    context.setUser(federatedUser);
    context.getAuthenticationSession().setAuthNote(BROKER_REGISTERED_NEW_USER, "true");
    context.success();
  }

  // Could be overriden to detect duplication based on other criterias (firstName,
  // lastName, ...)
  protected ExistingUserInfo checkExistingUser(
      AuthenticationFlowContext context,
      String username,
      SerializedBrokeredIdentityContext serializedCtx,
      BrokeredIdentityContext brokerContext) {

    if (brokerContext.getEmail() != null && !context.getRealm().isDuplicateEmailsAllowed()) {
      UserModel existingUser = context.getSession().users().getUserByEmail(context.getRealm(),
          brokerContext.getEmail());
      if (existingUser != null) {
        return new ExistingUserInfo(existingUser.getId(), UserModel.EMAIL, existingUser.getEmail());
      }
    }

    UserModel existingUser = context.getSession().users().getUserByUsername(context.getRealm(), username);
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
