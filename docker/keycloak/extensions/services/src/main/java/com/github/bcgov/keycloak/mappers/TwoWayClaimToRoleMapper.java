package com.github.bcgov.keycloak.mappers;

import org.keycloak.broker.oidc.mappers.ClaimToRoleMapper;
import org.keycloak.broker.provider.BrokeredIdentityContext;
import org.keycloak.broker.provider.ConfigConstants;
import org.keycloak.broker.provider.IdentityBrokerException;
import org.keycloak.models.IdentityProviderMapperModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.RoleModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.utils.KeycloakModelUtils;

public class TwoWayClaimToRoleMapper extends ClaimToRoleMapper {

  public static final String PROVIDER_ID = "oidc-two-way-role-idp-mapper";

  @Override
  public String getId() {
    return PROVIDER_ID;
  }

  @Override
  public String getDisplayType() {
    return "Two Way Claim to Role";
  }

  @Override
  public void updateBrokeredUser(
      KeycloakSession session,
      RealmModel realm,
      UserModel user,
      IdentityProviderMapperModel mapperModel,
      BrokeredIdentityContext context) {
    String roleName = mapperModel.getConfig().get(ConfigConstants.ROLE);
    RoleModel role = KeycloakModelUtils.getRoleFromString(realm, roleName);
    if (role == null) throw new IdentityBrokerException("Unable to find role: " + roleName);
    if (!hasClaimValue(mapperModel, context)) {
      user.deleteRoleMapping(role);
    } else {
      user.grantRole(role);
    }
  }

  @Override
  public String getHelpText() {
    return "If a claim exists, grant the user the specified realm or application role, for both new and existing users.";
  }
}
