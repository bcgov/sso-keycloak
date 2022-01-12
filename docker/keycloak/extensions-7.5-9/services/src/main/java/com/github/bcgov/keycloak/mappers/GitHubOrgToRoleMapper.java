package com.github.bcgov.keycloak.mappers;

import com.fasterxml.jackson.databind.JsonNode;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Hashtable;
import java.util.List;
import java.util.Map;
import org.jboss.logging.Logger;
import org.keycloak.broker.provider.AbstractIdentityProviderMapper;
import org.keycloak.broker.provider.BrokeredIdentityContext;
import org.keycloak.broker.provider.IdentityBrokerException;
import org.keycloak.broker.provider.IdentityProvider;
import org.keycloak.broker.provider.util.SimpleHttp;
import org.keycloak.models.IdentityProviderMapperModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.RoleModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.utils.KeycloakModelUtils;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.social.github.GitHubIdentityProviderFactory;

/**
 * @author Clecio Varjao
 *     <p>GitHub IdP MUST request 'org:read' scope User's MUST grant 'org:read' permission to
 *     private organizations (https://github.com/settings/applications)
 */
public class GitHubOrgToRoleMapper extends AbstractIdentityProviderMapper {
  private static final String ROLE_PREFIX = "role-prefix";
  private static final String DEFAULT_ROLE_PREFIX = "org:";
  private static final String[] cp = new String[] {GitHubIdentityProviderFactory.PROVIDER_ID};
  public static final String PROVIDER_ID = "github-org-to-role-mapper";
  private static final Logger logger = Logger.getLogger(GitHubOrgToRoleMapper.class);
  private static final List<ProviderConfigProperty> configProperties =
      new ArrayList<ProviderConfigProperty>();

  private static final String USER_ORGS_URL = "https://api.github.com/user/orgs";

  static {
    ProviderConfigProperty property;
    property = new ProviderConfigProperty();
    property.setName(ROLE_PREFIX);
    property.setLabel("Prefix of Roles");
    property.setHelpText(
        "A prefix used by the roles that will be used to map organization membership. Example: if prefix is 'org:', a user who is member of 'github' organization will be mapped to a role named 'org:github'");
    property.setDefaultValue(DEFAULT_ROLE_PREFIX);
    property.setType(ProviderConfigProperty.STRING_TYPE);
    configProperties.add(property);
  }

  @Override
  public List<ProviderConfigProperty> getConfigProperties() {
    return configProperties;
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }

  @Override
  public String getDisplayCategory() {
    return "Role Importer";
  }

  @Override
  public String getDisplayType() {
    return "GitHub Organization to Roles";
  }

  @Override
  public void importNewUser(
      KeycloakSession session,
      RealmModel realm,
      UserModel user,
      IdentityProviderMapperModel mapperModel,
      BrokeredIdentityContext context) {
    String accessToken =
        (String) context.getContextData().get(IdentityProvider.FEDERATED_ACCESS_TOKEN);

    JsonNode userOrgs;
    try {
      userOrgs =
          SimpleHttp.doGet(USER_ORGS_URL, session)
              .header("Authorization", "Bearer " + accessToken)
              .asJson();
    } catch (IOException e) {
      throw new IdentityBrokerException("Unable to find user organization membership", e);
    }

    Map<String, Boolean> effectiveMembership = new Hashtable<String, Boolean>();

    String rolePrefix = mapperModel.getConfig().get(ROLE_PREFIX);
    if (rolePrefix == null) rolePrefix = DEFAULT_ROLE_PREFIX;

    // Make sure user is assigned with all GitHub org roles
    for (JsonNode org : userOrgs) {
      String orgName = org.get("login").asText();
      String roleName = rolePrefix + orgName;
      RoleModel role = KeycloakModelUtils.getRoleFromString(realm, roleName);
      if (role != null) {
        user.grantRole(role);
        effectiveMembership.put(roleName, true);
      }
    }

    // Delete all github org roles which the user is no longer a member
    for (RoleModel role : user.getRoleMappings()) {
      if (role.getName().startsWith(rolePrefix)
          && effectiveMembership.getOrDefault(role.getName(), false) != true) {
        user.deleteRoleMapping(role);
      }
    }
  }

  @Override
  public void updateBrokeredUser(
      KeycloakSession session,
      RealmModel realm,
      UserModel user,
      IdentityProviderMapperModel mapperModel,
      BrokeredIdentityContext context) {
    importNewUser(session, realm, user, mapperModel, context);
  }

  @Override
  public String getHelpText() {
    return "Map user's organization membership to roles in keycloak";
  }

  @Override
  public GitHubOrgToRoleMapper create(KeycloakSession session) {
    return new GitHubOrgToRoleMapper();
  }

  @Override
  public String[] getCompatibleProviders() {
    return cp;
  }
}
