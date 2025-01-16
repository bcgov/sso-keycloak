package com.github.bcgov.keycloak.social.github;

import org.keycloak.broker.oidc.mappers.AbstractJsonUserAttributeMapper;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class CustomGitHubUserAttributeMapper extends AbstractJsonUserAttributeMapper {

  public static final String PROVIDER_ID = "github-custom-user-attribute-mapper";
  private static final String[] cp = new String[] {CustomGitHubIdentityProviderFactory.PROVIDER_ID};

  @Override
  public String[] getCompatibleProviders() {
    return cp;
  }

  @Override
  public String getId() {
    return PROVIDER_ID;
  }
}
