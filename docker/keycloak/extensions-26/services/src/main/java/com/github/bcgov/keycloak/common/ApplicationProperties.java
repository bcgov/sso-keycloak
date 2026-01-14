package com.github.bcgov.keycloak.common;

import org.jboss.logging.Logger;

public class ApplicationProperties {

  private static final Logger logger = Logger.getLogger(ApplicationProperties.class);

  private String ppidApiTokenUrl;
  private String ppidApiUrl;
  private String ppidOtpIssuer;
  private String ppidClientId;
  private String ppidClientSecret;

  private String rbaClientId;
  private String rbaClientSecret;
  private String rbaApiUrl;
  private String rbaTokenUrl;

  public ApplicationProperties() {
    // ppid
    ppidApiTokenUrl = System.getenv().getOrDefault("PPID_API_TOKEN_URL", "MissingPpidApiTokenUrl");
    ppidOtpIssuer = System.getenv().getOrDefault("PPID_OTP_ISSUER", "MissingOtpIssuer");
    ppidClientId = System.getenv().getOrDefault("PPID_CLIENT_ID", "MissingPpidClientId");
    ppidClientSecret = System.getenv().getOrDefault("PPID_CLIENT_SECRET", "MissingPpidClientSecret");
    ppidApiUrl = System.getenv().getOrDefault("PPID_API_URL", "MissingPpidApiUrl");

    // rba
    rbaApiUrl = System.getenv().getOrDefault("RBA_API_URL", "MissingRbaApiUrl");
    rbaTokenUrl = System.getenv().getOrDefault("RBA_TOKEN_URL", "MissingRbaTokenUrl");
    rbaClientId = System.getenv().getOrDefault("RBA_CLIENT_ID", "MissingRbaClientId");
    rbaClientSecret = System.getenv().getOrDefault("RBA_CLIENT_SECRET", "MissingRbaClientSecret");
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
    return ppidClientSecret;
  }

  public String getRbaApiUrl() {
    return rbaApiUrl;
  }

  public String getRbaTokenUrl() {
    return rbaTokenUrl;
  }

  public String getRbaClientId() {
    return rbaClientId;
  }

  public String getRbaClientSecret() {
    return rbaClientSecret;
  }
}
