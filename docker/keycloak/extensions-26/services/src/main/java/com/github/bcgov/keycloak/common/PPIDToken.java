package com.github.bcgov.keycloak.common;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

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
import org.keycloak.util.JsonSerialization;

import com.github.bcgov.keycloak.protocol.oidc.mappers.PPIDMapper;

import jakarta.ws.rs.core.HttpHeaders;

public class PPIDToken {

  private static final Logger logger = Logger.getLogger(PPIDMapper.class);

  private static String accessToken = "";
  private static long expiryTimeMillis;

  private static final long EXPIRY_BUFFER_MILLIS = 60 * 1000;

  public static synchronized String getAccessToken() {
    long currentTimeMillis = System.currentTimeMillis();
    if (accessToken == null || currentTimeMillis >= (expiryTimeMillis - EXPIRY_BUFFER_MILLIS)) {
      fetchNewToken();
    }
    return accessToken;
  }

  private static void fetchNewToken() {
    ApplicationProperties applicationProperties = new ApplicationProperties();

    CloseableHttpClient httpClient = HttpClients.createDefault();
    HttpPost httpPost = new HttpPost(applicationProperties.getPPIDApiTokenUrl());
    List<NameValuePair> formparams = new LinkedList<>();
    formparams.add(new BasicNameValuePair("grant_type", "client_credentials"));
    formparams.add(new BasicNameValuePair("client_id", applicationProperties.getPPIDClientID()));
    formparams.add(new BasicNameValuePair("client_secret", applicationProperties.getPPIDClientSecret()));

    try {
      UrlEncodedFormEntity form = new UrlEncodedFormEntity(formparams, StandardCharsets.UTF_8);
      httpPost.setEntity(form);
      try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
        if (response.getStatusLine().getStatusCode() != 200) {
          logger.error("Failed to call the ppid token endpoint");
        }
        try {
          InputStream content = response.getEntity().getContent();
          Map<String, String> json = JsonSerialization.readValue(content, Map.class);
          accessToken = json.get("access_token");
          int expiresIn = Integer.parseInt(json.get("expires_in").toString());
          expiryTimeMillis = System.currentTimeMillis() + (expiresIn * 1000L);
        } finally {
          EntityUtils.consumeQuietly(response.getEntity());
        }
      }

    } catch (Exception e) {
      logger.error("Failed to fetch access token for ppid");
    }
  }

  public static String getPpid(String issuer, String sub, String privacyZoneUri) {

    String ppid = "";

    ApplicationProperties applicationProperties = new ApplicationProperties();

    try {
      String token = PPIDToken.getAccessToken();
      if (token != null && token != "") {
        CloseableHttpClient httpClient = HttpClients.createDefault();
        HttpPost httpPost = new HttpPost(applicationProperties.getPPIDApiUrl());
        httpPost.addHeader(HttpHeaders.AUTHORIZATION, String.format("Bearer %s", token));
        String jsonBody = String.format("{\"iss\": \"%s\", \"sub\": \"%s\", \"privacy_zone_uri\": \"%s\"}", issuer,
            sub,
            privacyZoneUri);
        StringEntity stringEntity = new StringEntity(jsonBody, StandardCharsets.UTF_8);
        stringEntity.setContentType("application/json");
        httpPost.setEntity(stringEntity);
        httpPost.setHeader("Accept", "application/json");
        try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
          try {
            InputStream content = response.getEntity().getContent();
            Map<String, String> json = JsonSerialization.readValue(content, Map.class);
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
