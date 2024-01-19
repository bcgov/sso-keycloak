package com.github.bcgov.keycloak.testsuite.authenticators;

import com.github.bcgov.keycloak.authenticators.ClientLoginAuthenticatorFactory;
import org.junit.Test;
import org.keycloak.authentication.Authenticator;
import org.keycloak.models.KeycloakSession;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.mock;

/** @author <a href="mailto:junmin@button.is">Junmin Ahn</a> */
public class ClientLoginAuthenticatorTest {
  @Test
  public void testCommenceWithRedirectAndQueryParameters() throws Exception {
    ClientLoginAuthenticatorFactory authF = new ClientLoginAuthenticatorFactory();
    assertEquals("client-login-authenticator", authF.getId());

    KeycloakSession ksession = mock(KeycloakSession.class);

    Authenticator auth = authF.create(ksession);
  }
}
