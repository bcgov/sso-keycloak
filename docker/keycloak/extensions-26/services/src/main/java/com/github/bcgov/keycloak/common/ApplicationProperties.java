package com.github.bcgov.keycloak.common;

import org.jboss.logging.Logger;

public class ApplicationProperties {

    private static final Logger logger = Logger.getLogger(ApplicationProperties.class);

    private String ppidOtpIssuer;
    private String ppidBcscIssuer;
    private String ppidTokenUrl;
    private String ppidApiUrl;

    public ApplicationProperties() {

        logger.info("Loading application properties from environment variables...");

        ppidTokenUrl = System.getenv().getOrDefault("PPID_TOKEN_URL", "");
        ppidOtpIssuer = System.getenv().getOrDefault("PPID_OTP_ISSUER", "");
        ppidApiUrl = System.getenv().getOrDefault("PPID_API_URL", "");
        ppidBcscIssuer = System.getenv().getOrDefault("PPID_BCSC_ISSUER", "");
    }

    public String getPpidTokenUrl() {
        return ppidTokenUrl;
    }

    public String getPpidApiUrl() {
        return ppidApiUrl;
    }

    public String getIssuer(String idp) {
        switch (idp) {
            case "otp":
                return ppidOtpIssuer;
            case "bcsc":
                return ppidBcscIssuer;
            default:
                return "";
        }
    }
}
