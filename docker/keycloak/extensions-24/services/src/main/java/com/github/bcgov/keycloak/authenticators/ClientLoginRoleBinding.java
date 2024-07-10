package com.github.bcgov.keycloak.authenticators;

import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.Authenticator;
import org.keycloak.models.*;
import org.keycloak.sessions.AuthenticationSessionModel;

import java.util.Objects;
import java.util.Optional;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class ClientLoginRoleBinding implements Authenticator {
  @Override
  public void authenticate(AuthenticationFlowContext context) {
    AuthenticationSessionModel session = context.getAuthenticationSession();
    ClientModel client = session.getClient();
    RealmModel realm = session.getRealm();
    UserModel user = session.getAuthenticatedUser();

    String targetRoleName = "client-" + client.getClientId();
    RoleModel clientRole = realm.getRole(targetRoleName);
    if (clientRole == null) {
      clientRole = realm.addRole(targetRoleName);
    }

    Optional<RoleModel> assignedRole =
        user.getRealmRoleMappingsStream()
            .filter(role -> Objects.equals(targetRoleName, role.getName()))
            .findFirst();

    if (!assignedRole.isPresent()) {
      user.grantRole(clientRole);
    }

    context.success();
  }

  @Override
  public void action(AuthenticationFlowContext context) { /* This is ok */ }

  @Override
  public boolean requiresUser() {
    return false;
  }

  @Override
  public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
    return true;
  }

  @Override
  public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) { /* This is ok */ }

  @Override
  public void close() { /* This is ok */ }
}
