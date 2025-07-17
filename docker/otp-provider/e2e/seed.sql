INSERT INTO "ClientConfig"("clientId", "clientSecret", "grantTypes", "redirectUris", "scope", "responseTypes", "clientUri", "allowedCorsOrigins", "postLogoutRedirectUris", "tokenEndpointAuthMethod")
    VALUES ('conf-client', 's3cr3t', '{authorization_code, refresh_token}', '{http://localhost:3001}', 'openid email', '{code}', 'http://localhost:3001', '{http://localhost:3001}', '{http://localhost:3001}', 'client_secret_post')
ON CONFLICT
    DO NOTHING;

--public client
INSERT INTO public."ClientConfig"("clientId", "grantTypes", "redirectUris", "scope", "responseTypes", "clientUri", "allowedCorsOrigins", "postLogoutRedirectUris", "tokenEndpointAuthMethod")
    VALUES ('pub-client', '{authorization_code, refresh_token}', '{http://localhost:3001}', 'openid email', '{code}', 'http://localhost:3001', '{http://localhost:3001}', '{http://localhost:3001}', 'none')
ON CONFLICT
    DO NOTHING;
