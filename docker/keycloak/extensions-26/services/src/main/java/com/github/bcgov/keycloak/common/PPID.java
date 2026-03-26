package com.github.bcgov.keycloak.common;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.http.NameValuePair;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.util.EntityUtils;
import org.jboss.logging.Logger;
import org.keycloak.saml.common.util.StringUtil;
import org.keycloak.util.JsonSerialization;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.bcgov.keycloak.protocol.oidc.mappers.PPIDMapper;

import jakarta.ws.rs.core.HttpHeaders;

public class PPID {

  private static final Logger logger = Logger.getLogger(PPIDMapper.class);

  public static final ConcurrentHashMap<String, String> TOKEN_CACHE = new ConcurrentHashMap<>();
  public static final ConcurrentHashMap<String, Long> TOKEN_EXPIRY_CACHE = new ConcurrentHashMap<>();

  // private static String accessToken = "";
  // private static long expiryTimeMillis = 0L;

  private static final long EXPIRY_BUFFER_MILLIS = 60 * 1000;

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

    CloseableHttpClient httpClient = HttpClients.createDefault();
    HttpPost httpPost = new HttpPost(tokenUrl);
    List<NameValuePair> formparams = new LinkedList<>();
    formparams.add(new BasicNameValuePair("grant_type", "client_credentials"));
    formparams.add(new BasicNameValuePair("client_id", clientId));
    formparams.add(new BasicNameValuePair("client_secret", clientSecret));
    formparams.add(new BasicNameValuePair("scope", "ppids-api"));

    try {
      UrlEncodedFormEntity form = new UrlEncodedFormEntity(formparams, StandardCharsets.UTF_8);
      httpPost.setEntity(form);
      try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
        if (response.getStatusLine().getStatusCode() != 200) {
          logger.error("Failed to call the ppid token endpoint");
        }
        try {
          InputStream content = response.getEntity().getContent();

          Map<String, String> json = null;
          try {
            json = JsonSerialization.readValue(content, new TypeReference<Map<String, String>>() {
            });
          } catch (IOException e) {
            logger.error("Failed to parse the response from ppid token endpoint");
          }
          int expiresIn = Integer.parseInt(String.valueOf(json.get("expires_in")));
          long expiryTimeMillis = System.currentTimeMillis() + (expiresIn * 1000L);
          TOKEN_CACHE.put(clientId, json.get("access_token"));
          TOKEN_EXPIRY_CACHE.put(clientId, expiryTimeMillis);
        } finally {
          EntityUtils.consumeQuietly(response.getEntity());
        }
      }

    } catch (Exception e) {
      logger.error("Failed to fetch access token for ppid");
    }
  }

  public static String getPpid(String ppidTokenUrl, String ppidApiUrl, String clientId, String clientSecret,
      String issuer, String sub, String privacyZoneUri) {
    String ppid = null;
    try {
      if (StringUtil.isNullOrEmpty(ppidTokenUrl) || StringUtil.isNullOrEmpty(ppidApiUrl)
          || StringUtil.isNullOrEmpty(clientId) || StringUtil.isNullOrEmpty(clientSecret)
          || StringUtil.isNullOrEmpty(issuer)) {
        logger.error("One or more required parameters for fetching ppid are missing");
        return null;
      }

      String token = getAccessToken(clientId, clientSecret, ppidTokenUrl);
      if (!StringUtil.isNullOrEmpty(token)) {
        CloseableHttpClient httpClient = HttpClients.createDefault();
        HttpPost httpPost = new HttpPost(new URI(ppidApiUrl));
        httpPost.addHeader(HttpHeaders.AUTHORIZATION, String.format("Bearer %s", token));

        ObjectMapper objectMapper = new ObjectMapper();
        ObjectNode jsonBodyNode = objectMapper.createObjectNode();
        jsonBodyNode.put("iss", issuer);
        jsonBodyNode.put("sub", sub);
        jsonBodyNode.put("privacy_zone_uri", privacyZoneUri);
        String jsonBody = objectMapper.writeValueAsString(jsonBodyNode);
        StringEntity stringEntity = new StringEntity(jsonBody, StandardCharsets.UTF_8);
        stringEntity.setContentType("application/json");
        httpPost.setEntity(stringEntity);
        httpPost.setHeader("Accept", "application/json");
        try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
          try {
            InputStream content = response.getEntity().getContent();
            Map<String, String> json = JsonSerialization.readValue(content, new TypeReference<Map<String, String>>() {
            });
            ppid = json.get("ppid");
          } finally {
            EntityUtils.consumeQuietly(response.getEntity());
          }
        }
      } else {
        logger.error("The ppid token is invalid");
      }
    } catch (IOException e) {
      logger.error("Failed to call the ppid api");
    } catch (Exception e) {
      logger.error("Failed to fetch ppid for the subject");
    }
    return ppid;
  }
}
