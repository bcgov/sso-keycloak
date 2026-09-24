package com.github.bcgov.keycloak.protocol.saml.mappers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.keycloak.dom.saml.v2.assertion.AttributeStatementType;
import org.keycloak.dom.saml.v2.assertion.AttributeType;
import org.keycloak.models.ClientScopeModel;
import org.keycloak.models.IdentityProviderModel;
import org.keycloak.models.IdentityProviderStorageProvider;
import org.keycloak.models.KeycloakContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.ProtocolMapperModel;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.UserSessionModel;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

import com.github.bcgov.keycloak.common.PPID;

public class PPIDAttributeMapperTest {
  @Test
  public void testPpidReplacesExistingAttributesWithSameName() {
    PPIDAttributeMapper mapper = new PPIDAttributeMapper();
    AttributeStatementType attributeStatement = new AttributeStatementType();
    addAttribute(attributeStatement, "sub", "first-subject");
    addAttribute(attributeStatement, "other", "other-value");
    addAttribute(attributeStatement, "sub", "second-subject");

    ProtocolMapperModel mappingModel = new ProtocolMapperModel();
    mappingModel.setId("mapper-id");
    mappingModel.setConfig(Map.of(PPIDAttributeMapper.ATTRIBUTE_NAME, "sub"));

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
    when(identityProviders.getByAlias(PPIDAttributeMapper.PPID_SERVICE_ACCOUNT_IDP_ALIAS))
        .thenReturn(ppidIdentityProvider);

    ClientScopeModel clientScope = mock(ClientScopeModel.class);
    when(clientScope.getName()).thenReturn("urn:ca:bc:example-saml");
    when(clientScope.getProtocolMappersStream()).thenReturn(Stream.of(mappingModel));

    RealmModel realm = mock(RealmModel.class);
    when(realm.getClientScopesStream()).thenReturn(Stream.of(clientScope));

    KeycloakContext context = mock(KeycloakContext.class);
    when(context.getRealm()).thenReturn(realm);

    KeycloakSession keycloakSession = mock(KeycloakSession.class);
    when(keycloakSession.identityProviders()).thenReturn(identityProviders);
    when(keycloakSession.getContext()).thenReturn(context);

    try (MockedStatic<PPID> ppid = Mockito.mockStatic(PPID.class)) {
      ppid.when(() -> PPID.getPpid(
          "otp", "client-id", "client-secret", "user@example.com", "urn:ca:bc:example"))
          .thenReturn("ppid");

      mapper.transformAttributeStatement(
          attributeStatement, mappingModel, keycloakSession, userSession, null);
    }

    assertEquals(100, mapper.getPriority());
    assertEquals(1, attributeStatement.getAttributes().stream()
        .filter(choice -> "sub".equals(choice.getAttribute().getName()))
        .count());
    assertEquals("ppid", attributeStatement.getAttributes().stream()
        .map(AttributeStatementType.ASTChoiceType::getAttribute)
        .filter(attribute -> "sub".equals(attribute.getName()))
        .findFirst()
        .orElseThrow()
        .getAttributeValue()
        .get(0));
    assertEquals(1, attributeStatement.getAttributes().stream()
        .filter(choice -> "other".equals(choice.getAttribute().getName()))
        .count());
  }

  private static void addAttribute(
      AttributeStatementType attributeStatement, String name, String value) {
    AttributeType attribute = new AttributeType(name);
    attribute.addAttributeValue(value);
    attributeStatement.addAttribute(new AttributeStatementType.ASTChoiceType(attribute));
  }
}
