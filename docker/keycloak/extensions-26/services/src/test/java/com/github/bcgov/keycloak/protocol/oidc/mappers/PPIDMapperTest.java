package com.github.bcgov.keycloak.protocol.oidc.mappers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.keycloak.models.ClientScopeModel;
import org.keycloak.models.ClientSessionContext;
import org.keycloak.models.IdentityProviderModel;
import org.keycloak.models.IdentityProviderStorageProvider;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.ProtocolMapperModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.UserSessionModel;
import org.keycloak.representations.IDToken;
import org.keycloak.util.JsonSerialization;

import com.github.bcgov.keycloak.common.PPID;

public class PPIDMapperTest {
  @Test
  public void testSubjectClaimReplacesExistingSubjectClaim() throws IOException {
    PPIDMapper mapper = new PPIDMapper();
    IDToken token = new IDToken();
    token.setSubject("original-subject");
    token.getOtherClaims().put(IDToken.SUBJECT, "mapped-subject");

    ProtocolMapperModel mappingModel = new ProtocolMapperModel();
    mappingModel.setConfig(Map.of(PPIDMapper.CLAIM_NAME, IDToken.SUBJECT));

    UserModel user = mock(UserModel.class);
    when(user.getEmail()).thenReturn("user@example.com");

    UserSessionModel userSession = mock(UserSessionModel.class);
    when(userSession.getNotes()).thenReturn(Map.of("identity_provider", "otp"));
    when(userSession.getUser()).thenReturn(user);

    IdentityProviderModel ppidIdentityProvider = new IdentityProviderModel();
    ppidIdentityProvider.setConfig(new HashMap<>(Map.of(
        "clientId", "client-id",
        "clientSecret", "client-secret")));

    IdentityProviderStorageProvider identityProviders = mock(IdentityProviderStorageProvider.class);
    when(identityProviders.getByAlias(PPIDMapper.PPID_SERVICE_ACCOUNT_IDP_ALIAS)).thenReturn(ppidIdentityProvider);

    KeycloakSession keycloakSession = mock(KeycloakSession.class);
    when(keycloakSession.identityProviders()).thenReturn(identityProviders);

    ClientScopeModel clientScope = mock(ClientScopeModel.class);
    when(clientScope.getName()).thenReturn("urn:ca:bc:example");

    ClientSessionContext clientSessionContext = mock(ClientSessionContext.class);
    when(clientSessionContext.getClientScopesStream()).thenReturn(Stream.of(clientScope));

    try (MockedStatic<PPID> ppid = Mockito.mockStatic(PPID.class)) {
      ppid.when(() -> PPID.getPpid(
          "otp", "client-id", "client-secret", "user@example.com", "urn:ca:bc:example"))
          .thenReturn("ppid");

      mapper.setClaim(token, mappingModel, userSession, keycloakSession, clientSessionContext);
    }

    assertEquals("ppid", token.getSubject());
    assertFalse(token.getOtherClaims().containsKey(IDToken.SUBJECT));

    String serializedToken = JsonSerialization.writeValueAsString(token);
    assertEquals(1, countOccurrences(serializedToken, "\"sub\""));
  }

  @Test
  public void testCustomClaimRemainsInOtherClaims() {
    IDToken token = new IDToken();

    PPIDMapper.setTokenClaim(token, "ppid", "value");

    assertEquals("value", token.getOtherClaims().get("ppid"));
  }

  private static int countOccurrences(String value, String substring) {
    return (value.length() - value.replace(substring, "").length()) / substring.length();
  }
}
