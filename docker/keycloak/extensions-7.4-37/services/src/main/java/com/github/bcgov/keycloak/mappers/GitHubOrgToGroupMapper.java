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
import org.keycloak.models.GroupModel;
import org.keycloak.models.IdentityProviderMapperModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.utils.KeycloakModelUtils;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.social.github.GitHubIdentityProviderFactory;

/**
 * @author Clecio Varjao
 *     <p>GitHub IdP MUST request 'org:read' scope User's MUST grant 'org:read' permission to
 *     private organizations (https://github.com/settings/applications)
 */
public class GitHubOrgToGroupMapper extends AbstractIdentityProviderMapper {
  private static final String GROUP_PREFIX = "group-prefix";
  private static final String DEFAULT_GROUP_PREFIX = "org:";
  private static final String[] cp = new String[] {GitHubIdentityProviderFactory.PROVIDER_ID};
  public static final String PROVIDER_ID = "github-org-to-group-mapper";
  private static final Logger logger = Logger.getLogger(GitHubOrgToGroupMapper.class);
  private static final List<ProviderConfigProperty> configProperties =
      new ArrayList<ProviderConfigProperty>();

  private static final String USER_ORGS_URL = "https://api.github.com/user/orgs";

  static {
    ProviderConfigProperty property;
    property = new ProviderConfigProperty();
    property.setName(GROUP_PREFIX);
    property.setLabel("Prefix of groups");
    property.setHelpText(
        "A prefix used by the groups that will be used to map organization membership. Example: if prefix is 'org:', a user who is member of 'github' organization will be mapped to a group named 'org:github'");
    property.setDefaultValue(DEFAULT_GROUP_PREFIX);
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
    return "Group Mapper";
  }

  @Override
  public String getDisplayType() {
    return "GitHub Organization to Group";
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

    String groupPrefix = mapperModel.getConfig().get(GROUP_PREFIX);
    if (groupPrefix == null) groupPrefix = "org:";

    // Make sure user is a member of all GitHub org groups
    for (JsonNode org : userOrgs) {
      String orgName = org.get("login").asText();
      String groupName = groupPrefix + orgName;
      GroupModel group = KeycloakModelUtils.findGroupByPath(realm, groupName);
      if (group != null) {
        user.joinGroup(group);
        effectiveMembership.put(groupName, true);
      }
    }

    // Leave all github org groups which the user is no longer a member
    for (GroupModel group : user.getGroups()) {
      if (group.getName().startsWith(groupPrefix)
          && effectiveMembership.getOrDefault(group.getName(), false) != true) {
        user.leaveGroup(group);
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
    return "Map user's organization membership to groups in keycloak";
  }

  @Override
  public GitHubOrgToGroupMapper create(KeycloakSession session) {
    return new GitHubOrgToGroupMapper();
  }

  @Override
  public String[] getCompatibleProviders() {
    return cp;
  }
}
