package com.github.bcgov.keycloak.authenticators;

import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.Authenticator;
import org.keycloak.models.*;
import org.keycloak.sessions.AuthenticationSessionModel;

import java.util.Objects;
import java.util.Optional;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class ClientLoginAuthenticator implements Authenticator {

  private static final String DEFAULT_CLIENT_MEMBER_ROLE = "member";

  @Override
  public void authenticate(AuthenticationFlowContext context) {
    AuthenticatorConfigModel config = context.getAuthenticatorConfig();

    String mrole = DEFAULT_CLIENT_MEMBER_ROLE;
    if (config != null
        && config.getConfig() != null
        && config.getConfig().containsKey(ClientLoginAuthenticatorFactory.MEMBER_ROLE_NAME)) {
      mrole = config.getConfig().get(ClientLoginAuthenticatorFactory.MEMBER_ROLE_NAME);
    }

    final String clientMemberRole = mrole;

    AuthenticationSessionModel session = context.getAuthenticationSession();
    ClientModel client = session.getClient();
    UserModel user = session.getAuthenticatedUser();
    RoleModel memberRole = client.getRole(clientMemberRole);
    if (memberRole == null) {
      memberRole = client.addRole(clientMemberRole);
    }

    Optional<RoleModel> assignedMemberRole =
        user.getClientRoleMappingsStream(client)
            .filter(role -> Objects.equals(clientMemberRole, role.getName()))
            .findFirst();

    if (!assignedMemberRole.isPresent()) {
      user.grantRole(memberRole);
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
