package com.github.bcgov.keycloak.social.github;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.keycloak.broker.oidc.OAuth2IdentityProviderConfig;
import org.keycloak.broker.oidc.mappers.AbstractJsonUserAttributeMapper;
import org.keycloak.broker.provider.BrokeredIdentityContext;
import org.keycloak.broker.provider.IdentityBrokerException;
import org.keycloak.broker.provider.util.SimpleHttp;
import org.keycloak.events.EventBuilder;
import org.keycloak.models.KeycloakSession;
import org.keycloak.social.github.GitHubIdentityProvider;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class CustomGitHubIdentityProvider extends GitHubIdentityProvider {

  public static final String USER_ORGS_URL = "https://api.github.com/user/orgs";
  public static final String DEFAULT_SCOPE = "user:email user:profile read:org";

  public CustomGitHubIdentityProvider(
      KeycloakSession session, OAuth2IdentityProviderConfig config) {
    super(session, config);
  }

  @Override
  protected BrokeredIdentityContext extractIdentityFromProfile(
      EventBuilder event, JsonNode profile) {
    String id = getJsonProperty(profile, "id");
    String name = getJsonProperty(profile, "name");
    String email = getJsonProperty(profile, "email");

    BrokeredIdentityContext user = new BrokeredIdentityContext(id);

    user.setUsername(id);
    user.setName(name);
    user.setEmail(email);
    user.setIdpConfig(getConfig());
    user.setIdp(this);

    AbstractJsonUserAttributeMapper.storeUserProfileForMapper(
        user, profile, getConfig().getAlias());

    return user;
  }

  @Override
  protected BrokeredIdentityContext doGetFederatedIdentity(String accessToken) {
    try {
      OAuth2IdentityProviderConfig config = getConfig();
      String targetOrg = config.getConfig().get("githubOrg");
      String[] targetOrgs = targetOrg == null ? new String[0] : targetOrg.split(" ");
      boolean targetOrgRequired = Boolean.parseBoolean(config.getConfig().get("githubOrgRequired"));
      boolean orgVerified = false;
      List<String> myOrgs = new ArrayList<>();

      if (targetOrgs.length > 0) {
        JsonNode userOrgs =
            SimpleHttp.doGet(USER_ORGS_URL, session)
                .header("Authorization", "Bearer " + accessToken)
                .asJson();

        for (String torg : targetOrgs) {
          for (JsonNode org : userOrgs) {
            String orgName = getJsonProperty(org, "login");
            if (orgName.equals(torg)) {
              myOrgs.add(torg);
              orgVerified = true;
            }
          }
        }

        if (targetOrgRequired && !orgVerified)
          throw new IdentityBrokerException("User does not belong to the target GitHub Org");
      }

      JsonNode profile =
          SimpleHttp.doGet(PROFILE_URL, session)
              .header("Authorization", "Bearer " + accessToken)
              .asJson();

      ((ObjectNode) profile).put("org_verified", String.valueOf(orgVerified));
      ((ObjectNode) profile).put("orgs", String.join(" ", myOrgs));
      BrokeredIdentityContext user = extractIdentityFromProfile(null, profile);

      if (user.getEmail() == null) {
        user.setEmail(searchEmail(accessToken));
      }

      return user;
    } catch (Exception e) {
      throw new IdentityBrokerException("Could not obtain user profile from GitHub.", e);
    }
  }

  private String searchEmail(String accessToken) {
    try {
      ArrayNode emails =
          (ArrayNode)
              SimpleHttp.doGet(EMAIL_URL, session)
                  .header("Authorization", "Bearer " + accessToken)
                  .asJson();

      Iterator<JsonNode> loop = emails.elements();
      while (loop.hasNext()) {
        JsonNode mail = loop.next();
        if (mail.get("primary").asBoolean()) {
          return getJsonProperty(mail, "email");
        }
      }
    } catch (Exception e) {
      throw new IdentityBrokerException("Could not obtain user email from GitHub.", e);
    }
    throw new IdentityBrokerException("Primary email from GitHub is not found.");
  }

  @Override
  protected String getDefaultScopes() {
    return DEFAULT_SCOPE;
  }
}
