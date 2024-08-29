package com.github.bcgov.keycloak.testsuite.authenticators;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import org.mockito.Mockito;
import org.mockito.MockedStatic;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;

import com.github.bcgov.keycloak.authenticators.UserSessionRemover;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.AuthenticatedClientSessionModel;
import org.keycloak.models.RealmModel;
import org.keycloak.services.managers.AuthenticationManager;
import org.keycloak.models.ClientModel;
import org.keycloak.sessions.AuthenticationSessionModel;
import org.keycloak.models.UserSessionProvider;
import org.keycloak.models.AuthenticatedClientSessionModel;
import org.keycloak.models.UserSessionModel;
import org.keycloak.models.KeycloakContext;
import java.util.HashMap;
import java.util.Map;

public class UserSessionRemoverTest {
  private static final UserSessionRemover userSessionRemover = new UserSessionRemover();

  private AuthenticationFlowContext context;
  private KeycloakSession session;
  private RealmModel realm;
  private AuthenticationSessionModel authSession;
  private UserSessionProvider userSessionProvider;
  private KeycloakSession keycloakSession;
  private ClientModel client;
  private KeycloakContext keycloakContext;
  private AuthenticationManager.AuthResult authResult;
  private UserSessionModel userSessionModel;
  private AuthenticatedClientSessionModel authenticatedClientSessionModel;

  @BeforeEach
  public void setup() {
      // Initialize mocks for necessary objects
      context = mock(AuthenticationFlowContext.class);
      realm = mock(RealmModel.class);
      authSession = mock(AuthenticationSessionModel.class);
      userSessionProvider = mock(UserSessionProvider.class);
      keycloakSession = mock(KeycloakSession.class);
      keycloakContext = mock(KeycloakContext.class);
      client = mock(ClientModel.class);
      authResult = mock(AuthenticationManager.AuthResult.class);
      userSessionModel = mock(UserSessionModel.class);
      authenticatedClientSessionModel = mock(AuthenticatedClientSessionModel.class);


      // Set up common behavior of the mocks
      when(context.getSession()).thenReturn(keycloakSession);
      when(context.getRealm()).thenReturn(realm);
      when(context.getAuthenticationSession()).thenReturn(authSession);
      when(keycloakSession.sessions()).thenReturn(userSessionProvider);
      when(context.getSession()).thenReturn(keycloakSession);
      when(keycloakSession.getContext()).thenReturn(keycloakContext);
      when(keycloakContext.getClient()).thenReturn(client);
      when(authResult.getSession()).thenReturn(userSessionModel);
  }

  @Test
  public void testSkipClientSessionCheckWhenNullAuthResult() throws Exception {
    try (MockedStatic<AuthenticationManager> authenticationManager = Mockito.mockStatic(AuthenticationManager.class)) {
      authenticationManager.when(() -> AuthenticationManager.authenticateIdentityCookie(
        any(KeycloakSession.class), any(RealmModel.class), any(Boolean.class)
      )).thenReturn(null);
      userSessionRemover.authenticate(context);

      // Keycloak Session Context check skipped if no Auth Session
      verify(keycloakSession, times(0)).getContext();
      verify(userSessionProvider, times(0)).removeUserSession(any(RealmModel.class), any(UserSessionModel.class));
    }
  }

  @Test
  public void testRemovesUserSessionsWhenMultipleClientSessionsExist() throws Exception {
    when(client.getId()).thenReturn("client1");
    Map<String, AuthenticatedClientSessionModel> authenticatedClientSessions = new HashMap<>();
    authenticatedClientSessions.put("client1", authenticatedClientSessionModel);
    authenticatedClientSessions.put("client2", authenticatedClientSessionModel);

    when(userSessionModel.getAuthenticatedClientSessions()).thenReturn(authenticatedClientSessions);

    try (MockedStatic<AuthenticationManager> authenticationManager = Mockito.mockStatic(AuthenticationManager.class)) {
      authenticationManager.when(() -> AuthenticationManager.authenticateIdentityCookie(
        any(KeycloakSession.class), any(RealmModel.class), any(Boolean.class)
      )).thenReturn(authResult);

      userSessionRemover.authenticate(context);

      verify(keycloakSession, times(1)).getContext();
      verify(userSessionProvider, times(1)).removeUserSession(any(RealmModel.class), any(UserSessionModel.class));
    }
  }

  @Test
  public void testRemovesUserSessionsWhenSingleDifferentClientSessionFound() throws Exception {
    when(client.getId()).thenReturn("client1");
    Map<String, AuthenticatedClientSessionModel> authenticatedClientSessions = new HashMap<>();
    authenticatedClientSessions.put("client2", authenticatedClientSessionModel);

    when(userSessionModel.getAuthenticatedClientSessions()).thenReturn(authenticatedClientSessions);

    try (MockedStatic<AuthenticationManager> authenticationManager = Mockito.mockStatic(AuthenticationManager.class)) {
      authenticationManager.when(() -> AuthenticationManager.authenticateIdentityCookie(
        any(KeycloakSession.class), any(RealmModel.class), any(Boolean.class)
      )).thenReturn(authResult);
      userSessionRemover.authenticate(context);

      verify(keycloakSession, times(1)).getContext();
      verify(userSessionProvider, times(1)).removeUserSession(any(RealmModel.class), any(UserSessionModel.class));
    }
  }

  @Test
  public void testLeavesExistingSessionWhenOnlyAssociatedToAuthenticatingClient() throws Exception {
    when(client.getId()).thenReturn("client1");
    Map<String, AuthenticatedClientSessionModel> authenticatedClientSessions = new HashMap<>();
    authenticatedClientSessions.put("client1", authenticatedClientSessionModel);

    when(userSessionModel.getAuthenticatedClientSessions()).thenReturn(authenticatedClientSessions);

    try (MockedStatic<AuthenticationManager> authenticationManager = Mockito.mockStatic(AuthenticationManager.class)) {
      authenticationManager.when(() -> AuthenticationManager.authenticateIdentityCookie(
        any(KeycloakSession.class), any(RealmModel.class), any(Boolean.class)
      )).thenReturn(authResult);
      userSessionRemover.authenticate(context);

      // Verify the keycloak session context is invoked to check client sessions
      verify(keycloakSession, times(1)).getContext();

      // Remove user session should be skipped
      verify(userSessionProvider, times(0)).removeUserSession(any(RealmModel.class), any(UserSessionModel.class));
    }
  }
}
