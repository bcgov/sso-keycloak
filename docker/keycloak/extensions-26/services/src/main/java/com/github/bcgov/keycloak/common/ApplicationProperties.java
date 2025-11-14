package com.github.bcgov.keycloak.common;

import org.jboss.logging.Logger;

import com.github.bcgov.keycloak.protocol.oidc.mappers.PPIDMapper;

public class ApplicationProperties {

  private static final Logger logger = Logger.getLogger(ApplicationProperties.class);

  private String ppidApiTokenUrl;
  private String ppidApiUrl;
  private String ppidOtpIssuer;
  private String ppidClientId;
  private String ppidClinetSecret;

  private String rbaApiUrl;
  private String rbaApiSecret;

  public ApplicationProperties() {
    // ppid
    ppidApiTokenUrl = System.getenv().getOrDefault("PPID_API_TOKEN_URL", "MissingPpidApiTokenUrl");
    ppidOtpIssuer = System.getenv().getOrDefault("PPID_OTP_ISSUER", "MissingOtpIssuer");
    ppidClientId = System.getenv().getOrDefault("PPID_CLIENT_ID", "MissingPpidClientId");
    ppidClinetSecret = System.getenv().getOrDefault("PPID_CLIENT_SECRET", "MissingPpidClinetSecret");
    ppidApiUrl = System.getenv().getOrDefault("PPID_API_URL", "MissingPpidApiUrl");

    // rba
    rbaApiUrl = System.getenv().getOrDefault("RBA_API_URL", "MissingRbaApiUrl");
    rbaApiSecret = System.getenv().getOrDefault("RBA_API_SECRET", "MissingRbaApiSecret");
  }

  public String getPPIDApiTokenUrl() {
    return ppidApiTokenUrl;
  }

  public String getPPIDApiUrl() {
    return ppidApiUrl;
  };

  public String getIssuer(String idp) {
    if (idp.contains("otp"))
      return ppidOtpIssuer;
    return "";
  }

  public String getPPIDClientID() {
    return ppidClientId;
  }

  public String getPPIDClientSecret() {
    return ppidClinetSecret;
  }

  public String getRbaApiUrl() {
    return rbaApiUrl;
  }

  public String getRbaApiSecret() {
    return rbaApiSecret;
  }
}
