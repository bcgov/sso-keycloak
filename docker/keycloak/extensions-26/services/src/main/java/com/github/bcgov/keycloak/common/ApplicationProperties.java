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

  public ApplicationProperties() {
    logger.info("Loading application properties...");
    ppidApiTokenUrl = System.getenv().getOrDefault("PPID_API_TOKEN_URL", "MissingPpidApiTokenUrl");
    ppidOtpIssuer = System.getenv().getOrDefault("PPID_OTP_ISSUER", "MissingOtpIssuer");
    ppidClientId = System.getenv().getOrDefault("PPID_CLIENT_ID", "MissingPpidClientId");
    ppidClinetSecret = System.getenv().getOrDefault("PPID_CLIENT_SECRET", "MissingPpidClinetSecret");
    ppidApiUrl = System.getenv().getOrDefault("PPID_API_URL", "MissingPpidApiUrl");
  }

  public String getPPIDApiTokenUrl() {
    return ppidApiTokenUrl;
  }

  public String getPPIDApiUrl() {
    return ppidApiUrl;
  };

  public String getIssuer(String idp) {
    switch (idp) {
      case "otp":
        return ppidOtpIssuer;

      default:
        return "";
    }
  }

  public String getPPIDClientID() {
    return ppidClientId;
  }

  public String getPPIDClientSecret() {
    return ppidClinetSecret;
  }

}
