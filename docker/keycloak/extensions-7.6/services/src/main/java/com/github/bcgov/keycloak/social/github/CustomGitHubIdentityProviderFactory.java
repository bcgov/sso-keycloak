package com.github.bcgov.keycloak.social.github;

import org.keycloak.broker.oidc.OAuth2IdentityProviderConfig;
import org.keycloak.models.IdentityProviderModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.social.github.GitHubIdentityProvider;
import org.keycloak.social.github.GitHubIdentityProviderFactory;

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
}
