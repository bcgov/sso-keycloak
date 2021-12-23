package com.github.bcgov.keycloak.authenticators;

import java.util.Objects;
import java.util.Optional;
import org.jboss.logging.Logger;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.Authenticator;
import org.keycloak.models.ClientModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.RoleModel;
import org.keycloak.models.UserModel;
import org.keycloak.sessions.AuthenticationSessionModel;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class ClientLoginAuthenticator implements Authenticator {

  private static final Logger logger = Logger.getLogger(ClientLoginAuthenticator.class);
  private static final String CLIENT_MEMBER_ROLE = "member";

  @Override
  public void authenticate(AuthenticationFlowContext context) {
    AuthenticationSessionModel session = context.getAuthenticationSession();
    ClientModel client = session.getClient();
    UserModel user = session.getAuthenticatedUser();
    RoleModel memberRole = client.getRole(CLIENT_MEMBER_ROLE);
    if (memberRole == null) {
      memberRole = client.addRole(CLIENT_MEMBER_ROLE);
    }

    Optional<RoleModel> assignedMemberRole =
        user.getClientRoleMappingsStream(client)
            .filter(role -> Objects.equals(CLIENT_MEMBER_ROLE, role.getName()))
            .findFirst();

    if (!assignedMemberRole.isPresent()) {
      user.grantRole(memberRole);
    }

    context.success();
  }

  @Override
  public void action(AuthenticationFlowContext context) {}

  @Override
  public boolean requiresUser() {
    return false;
  }

  @Override
  public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) {
    return true;
  }

  @Override
  public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) {}

  @Override
  public void close() {}
}
