package com.github.bcgov.keycloak.broker.oidc;

import java.util.Arrays;
import java.util.List;

import org.keycloak.broker.oidc.OIDCIdentityProvider;
import org.keycloak.broker.oidc.OIDCIdentityProviderConfig;
import org.keycloak.broker.oidc.OIDCIdentityProviderFactory;
import org.keycloak.broker.provider.IdentityProviderMapper;
import org.keycloak.models.KeycloakSession;
import org.keycloak.representations.JsonWebToken;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class CustomOIDCIdentityProvider extends OIDCIdentityProvider {

  public CustomOIDCIdentityProvider(KeycloakSession session, OIDCIdentityProviderConfig config) {
    super(session, config);
  }

  @Override
  protected JsonWebToken validateToken(String encodedToken, boolean ignoreAudience) {
    // logger.warn(encodedToken);
    // logger.warn(ignoreAudience);

    return super.validateToken(encodedToken, ignoreAudience);
  }

  @Override
  public boolean isMapperSupported(IdentityProviderMapper mapper) {
    // Retrieve what providers this mapper claims to support
    List<String> compatibleProviders = Arrays.asList(mapper.getCompatibleProviders());

    // Allow the mapper if it works with ANY provider,
    // or if it explicitly targets standard "oidc" mappers.
    return compatibleProviders.contains(IdentityProviderMapper.ANY_PROVIDER)
        || compatibleProviders.contains(OIDCIdentityProviderFactory.PROVIDER_ID)
        || compatibleProviders.contains(this.getConfig().getProviderId());
  }
}
