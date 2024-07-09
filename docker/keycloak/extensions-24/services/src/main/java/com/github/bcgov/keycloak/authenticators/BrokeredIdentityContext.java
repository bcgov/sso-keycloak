package com.github.bcgov.keycloak.authenticators;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class BrokeredIdentityContext {
  @JsonProperty("identityProviderId")
  protected String identityProviderId;

  public String getIdentityProviderId() {
    return identityProviderId;
  }
}
