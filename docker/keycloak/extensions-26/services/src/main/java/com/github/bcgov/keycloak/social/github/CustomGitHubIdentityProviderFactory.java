package com.github.bcgov.keycloak.social.github;

import org.keycloak.broker.oidc.OAuth2IdentityProviderConfig;
import org.keycloak.models.IdentityProviderModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.provider.ProviderConfigProperty;
import org.keycloak.provider.ProviderConfigurationBuilder;
import org.keycloak.social.github.GitHubIdentityProvider;
import org.keycloak.social.github.GitHubIdentityProviderFactory;

import java.util.List;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class CustomGitHubIdentityProviderFactory extends GitHubIdentityProviderFactory {
  public static final String PROVIDER_ID = "github-custom";

  @Override
  public String getName() {
    return "GitHub - Custom";
  }

  @Override
  public GitHubIdentityProvider create(KeycloakSession session, IdentityProviderModel model) {
    return new CustomGitHubIdentityProvider(session, new OAuth2IdentityProviderConfig(model));
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }

  @Override
  public List<ProviderConfigProperty> getConfigProperties() {
    return ProviderConfigurationBuilder.create().property()
        .name("githubOrg").label("Github Org").helpText("Github organization the user must belong to.")
        .type(ProviderConfigProperty.STRING_TYPE).add().property()
        .name("githubOrgRequired").label("Github Org Required")
        .helpText("Check if the user must belong to the target GitHub organization.")
        .type(ProviderConfigProperty.BOOLEAN_TYPE).add().build();
  }
}
