package com.github.bcgov.keycloak.common;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import org.apache.http.NameValuePair;
import org.apache.http.HttpStatus;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.message.BasicNameValuePair;
import org.jboss.logging.Logger;
import org.keycloak.saml.common.util.StringUtil;
import org.keycloak.util.JsonSerialization;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import jakarta.ws.rs.core.HttpHeaders;

public class PPID {
  private PPID() {
    /* This utility class should not be instantiated */
  }

  private static final Logger logger = Logger.getLogger(PPID.class);

  protected static final ConcurrentMap<String, String> TOKEN_CACHE = new ConcurrentHashMap<>();
  protected static final ConcurrentMap<String, Long> TOKEN_EXPIRY_CACHE = new ConcurrentHashMap<>();

  private static final long EXPIRY_BUFFER_MILLIS = 60L * 1000;
  private static final String HTTPS_SCHEME = "https";
  private static final String APPLICATION_JSON = "application/json";

  public static synchronized String getAccessToken(String clientId, String clientSecret, String tokenUrl) {
    long currentTimeMillis = System.currentTimeMillis();

    String cacheKey = clientId;
    String accessToken = TOKEN_CACHE.get(cacheKey);
    Long expiryTimeMillis = TOKEN_EXPIRY_CACHE.get(cacheKey);

    if (accessToken == null || expiryTimeMillis == null
        || currentTimeMillis >= (expiryTimeMillis - EXPIRY_BUFFER_MILLIS)) {
      fetchNewToken(clientId, clientSecret, tokenUrl);
      accessToken = TOKEN_CACHE.get(cacheKey);
    }
    return accessToken;

  }

  private static void fetchNewToken(String clientId, String clientSecret, String tokenUrl) {
    if (StringUtil.isNullOrEmpty(clientId) || StringUtil.isNullOrEmpty(clientSecret)
        || StringUtil.isNullOrEmpty(tokenUrl)) {
      logger.error("Cannot fetch ppid token due to missing token request parameters");
      return;
    }

    URI tokenUri;
    try {
      tokenUri = new URI(tokenUrl);
    } catch (URISyntaxException e) {
      logger.error("Invalid ppid token endpoint URL", e);
      return;
    }

    if (!HTTPS_SCHEME.equalsIgnoreCase(tokenUri.getScheme())) {
      logger.warn("Using non-HTTPS token endpoint; this is not recommended");
    }

    HttpPost httpPost = new HttpPost(tokenUri);
    httpPost.setHeader("Accept", APPLICATION_JSON);
    List<NameValuePair> formparams = new LinkedList<>();
    formparams.add(new BasicNameValuePair("grant_type", "client_credentials"));
    formparams.add(new BasicNameValuePair("client_id", clientId));
    formparams.add(new BasicNameValuePair("client_secret", clientSecret));
    formparams.add(new BasicNameValuePair("scope", "ppids-api"));

    try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
      UrlEncodedFormEntity form = new UrlEncodedFormEntity(formparams, StandardCharsets.UTF_8);
      httpPost.setEntity(form);
      try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
        int statusCode = response.getStatusLine().getStatusCode();
        if (statusCode != HttpStatus.SC_OK) {
          logger.errorf("Failed to call the ppid token endpoint. status=%d", statusCode);
          return;
        }

        if (response.getEntity() == null) {
          logger.error("Ppid token endpoint returned an empty response body");
          return;
        }

        Map<String, Object> json;
        try (InputStream content = response.getEntity().getContent()) {
          json = JsonSerialization.readValue(content, new TypeReference<Map<String, Object>>() {
          });
        }

        String accessToken = toNonBlankString(json.get("access_token"));
        long expiresIn = parseExpiresInSeconds(json.get("expires_in"));

        if (!isValidString(accessToken) || expiresIn <= 0L) {
          logger.error("Ppid token response is missing required fields");
          return;
        }

        long expiryTimeMillis = System.currentTimeMillis() + (expiresIn * 1000L);
        TOKEN_CACHE.put(clientId, accessToken);
        TOKEN_EXPIRY_CACHE.put(clientId, expiryTimeMillis);
      }

    } catch (NumberFormatException e) {
      logger.error("Invalid expires_in value returned by ppid token endpoint", e);
    } catch (IllegalArgumentException e) {
      logger.error("Invalid token endpoint URL or request payload while fetching ppid token", e);
    } catch (IOException e) {
      logger.error("I/O error while fetching access token for ppid", e);
    } catch (RuntimeException e) {
      logger.error("Unexpected runtime error while fetching access token for ppid", e);
    }
  }

  public static String getPpid(String idp, String clientId, String clientSecret,
      String sub, String privacyZoneUri) {
    ApplicationProperties applicationProperties = new ApplicationProperties();
    try {
      String ppidTokenUrl = applicationProperties.getPpidTokenUrl();
      String ppidApiUrl = applicationProperties.getPpidApiUrl();
      String issuer = applicationProperties.getIssuer(idp);
      if (StringUtil.isNullOrEmpty(ppidTokenUrl) || StringUtil.isNullOrEmpty(ppidApiUrl)
          || StringUtil.isNullOrEmpty(clientId) || StringUtil.isNullOrEmpty(clientSecret)
          || StringUtil.isNullOrEmpty(issuer)) {
        logger.error("One or more required parameters for fetching ppid are missing");
        return null;
      }

      String token = getAccessToken(clientId, clientSecret, ppidTokenUrl);
      if (StringUtil.isNullOrEmpty(token)) {
        logger.error("The ppid token is invalid");
        return null;
      }

      return requestPpid(ppidApiUrl, token, issuer, sub, privacyZoneUri);
    } catch (URISyntaxException e) {
      logger.error("Invalid ppid api endpoint URL", e);
    } catch (IOException e) {
      logger.error("Failed to call the ppid api");
    } catch (IllegalArgumentException e) {
      logger.error("Invalid ppid request payload or endpoint configuration", e);
    } catch (RuntimeException e) {
      logger.error("Unexpected runtime error while fetching ppid for the subject", e);
    }
    return null;
  }

  private static String requestPpid(String ppidApiUrl, String token, String issuer, String sub,
      String privacyZoneUri) throws URISyntaxException, IOException {
    URI ppidApiUri = new URI(ppidApiUrl);
    if (!isHttpOrHttps(ppidApiUri)) {
      logger.error("Ppid api endpoint must use http/https scheme");
      return null;
    }

    if (!HTTPS_SCHEME.equalsIgnoreCase(ppidApiUri.getScheme())) {
      logger.warn("Using non-HTTPS ppid api endpoint; this is not recommended");
    }

    HttpPost httpPost = new HttpPost(ppidApiUri);
    httpPost.addHeader(HttpHeaders.AUTHORIZATION, String.format("Bearer %s", token));

    ObjectMapper objectMapper = new ObjectMapper();
    ObjectNode jsonBodyNode = objectMapper.createObjectNode();
    jsonBodyNode.put("iss", issuer);
    jsonBodyNode.put("sub", sub);
    jsonBodyNode.put("privacy_zone_uri", privacyZoneUri);
    String jsonBody = objectMapper.writeValueAsString(jsonBodyNode);
    StringEntity stringEntity = new StringEntity(jsonBody, StandardCharsets.UTF_8);
    stringEntity.setContentType(APPLICATION_JSON);
    httpPost.setEntity(stringEntity);
    httpPost.setHeader("Accept", APPLICATION_JSON);

    try (CloseableHttpClient httpClient = HttpClients.createDefault();
        CloseableHttpResponse response = httpClient.execute(httpPost)) {
      int statusCode = response.getStatusLine().getStatusCode();
      if (statusCode != HttpStatus.SC_OK) {
        logger.errorf("Failed to call the ppid api endpoint. status=%d", statusCode);
        return null;
      }

      if (response.getEntity() == null) {
        logger.error("Ppid api endpoint returned an empty response body");
        return null;
      }

      String ppid;
      try (InputStream content = response.getEntity().getContent()) {
        Map<String, String> json = JsonSerialization.readValue(content, new TypeReference<Map<String, String>>() {
        });
        ppid = json.get("ppid");
      }

      if (!isValidString(ppid)) {
        logger.error("Ppid api response did not contain a valid ppid");
      }

      return ppid;
    }
  }

  private static boolean isHttpOrHttps(URI uri) {
    if (uri == null || !isValidString(uri.getScheme())) {
      return false;
    }
    return "http".equalsIgnoreCase(uri.getScheme()) || HTTPS_SCHEME.equalsIgnoreCase(uri.getScheme());
  }

  private static long parseExpiresInSeconds(Object value) {
    if (value == null) {
      throw new NumberFormatException("expires_in is missing");
    }

    long parsed = Long.parseLong(String.valueOf(value));
    if (parsed <= 0L) {
      throw new NumberFormatException("expires_in must be greater than zero");
    }

    return parsed;
  }

  private static String toNonBlankString(Object value) {
    if (value == null) {
      return null;
    }

    String parsed = String.valueOf(value);
    return isValidString(parsed) ? parsed : null;
  }

  private static boolean isValidString(String value) {
    return value != null && !value.trim().isEmpty();
  }
}
