import axios, { AxiosRequestConfig } from 'axios';
import qs from 'qs';
import getConfig from 'next/config';

interface JWK {
  kid: string;
  kty: string;
  alg: string;
  use: string;
  n: string;
  e: string;
  x5c: any;
  x5t: string;
  'x5t#S256': string;
}

interface OID_CONFIGURATION {
  issuer: string;
  jwks_uri: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  end_session_endpoint: string;
  jwks: JWK[];
}

interface TOKEN_RESPONSE {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}
const { serverRuntimeConfig = {} } = getConfig() || {};
const {
  sso_url,
  sso_client_id,
  sso_client_secret,
  sso_redirect_uri,
  sso_logout_redirect_uri,
  sso_authorization_response_type,
  sso_authorization_scope,
  sso_token_grant_type,
} = serverRuntimeConfig;

const ISSUER_URL = `${sso_url}/.well-known/openid-configuration`;
const confidential = !!sso_client_secret;
let _oidConfiguration: OID_CONFIGURATION | null = null;

const btoa = (str: string) => Buffer.from(str).toString('base64');

export const fetchIssuerConfiguration = async () => {
  console.log('fetchIssuerConfiguration', _oidConfiguration);
  if (_oidConfiguration) return _oidConfiguration;

  const { issuer, jwks_uri, authorization_endpoint, token_endpoint, userinfo_endpoint, end_session_endpoint } =
    await axios.get(ISSUER_URL).then(
      (res: { data: any }) => res.data,
      () => null,
    );

  const jwks = await axios.get(jwks_uri).then((res: any) => res.data?.keys, console.error);

  _oidConfiguration = {
    issuer,
    jwks_uri,
    authorization_endpoint,
    token_endpoint,
    userinfo_endpoint,
    end_session_endpoint,
    jwks,
  };

  return _oidConfiguration;
};

// see https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1
export const getAuthorizationUrl = async (extraParams = {}) => {
  console.log('getAuthorizationUrl', _oidConfiguration);
  const params = {
    client_id: sso_client_id,
    response_type: sso_authorization_response_type,
    scope: sso_authorization_scope,
    redirect_uri: sso_redirect_uri,
    ...extraParams,
  };

  // TODO: let's apply PKCE workflow for public clients
  if (!confidential) {
  }

  return `${_oidConfiguration?.authorization_endpoint}?${qs.stringify(params, { encode: false })}`;
};

// see https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3
// see https://aws.amazon.com/blogs/mobile/understanding-amazon-cognito-user-pool-oauth-2-0-grants/
export const getAccessToken = async ({ code }: { code: string }) => {
  await fetchIssuerConfiguration();
  console.log('getAccessToken', _oidConfiguration);
  const params = {
    grant_type: sso_token_grant_type,
    client_id: sso_client_id,
    redirect_uri: sso_redirect_uri,
    code,
  };

  // TODO: let's apply PKCE workflow for public clients
  if (!confidential) {
  }

  // see https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims
  // see https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.4
  // Oauth2 response + OpenID Connect spec; id_token
  // {
  //   id_token: "xxxxxxx...",
  //   access_token: "xxxxxxx...",
  //   refresh_token: "xxxxxxx...",
  //   expires_in: 3600,
  //   token_type: "Bearer",
  // };
  const config: AxiosRequestConfig = {
    url: _oidConfiguration?.token_endpoint,
    method: 'post',
    data: qs.stringify(params),
  };

  if (confidential) {
    config.headers = { Authorization: `Basic ${btoa(`${sso_client_id}:${sso_client_secret}`)}` };
  }

  const { data } = await axios(config);
  return data as TOKEN_RESPONSE;
};

export const getUserInfo = async ({ accessToken }: { accessToken: string }) => {
  const config: AxiosRequestConfig = {
    url: _oidConfiguration?.userinfo_endpoint,
    method: 'get',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const { data } = await axios(config);
  return data as any;
};

export const refreshSession = async ({ refreshToken }: { refreshToken: string }) => {
  const params = {
    grant_type: 'refresh_token',
    client_id: sso_client_id,
    refresh_token: refreshToken,
  };

  const config: AxiosRequestConfig = {
    url: _oidConfiguration?.token_endpoint,
    method: 'post',
    data: qs.stringify(params),
  };

  const { data } = await axios(config);
  return data as any;
};

export default { fetchIssuerConfiguration, getAuthorizationUrl, getAccessToken, getUserInfo, refreshSession };
