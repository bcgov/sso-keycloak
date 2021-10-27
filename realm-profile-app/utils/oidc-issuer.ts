import axios from 'axios';
import getConfig from 'next/config';
import { JWK } from 'jwk-to-pem';

type _JWK = { kid: string } & JWK;

export interface OID_PROVIDER_CONFIGURATION {
  issuer: string;
  jwks_uri: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  end_session_endpoint: string;
  jwks: _JWK[];
}

const emptyProviderConfiguration = {
  issuer: '',
  jwks_uri: '',
  authorization_endpoint: '',
  token_endpoint: '',
  userinfo_endpoint: '',
  end_session_endpoint: '',
  jwks: [],
};

const { serverRuntimeConfig = {} } = getConfig() || {};
const { sso_url } = serverRuntimeConfig;

const ISSUER_URL = `${sso_url}/.well-known/openid-configuration`;
let _oidConfiguration: OID_PROVIDER_CONFIGURATION = emptyProviderConfiguration;

// TODO: there is a known issue to run code and cache data in backend server on startup
// https://github.com/vercel/next.js/discussions/15341
// https://flaviocopes.com/nextjs-cache-data-globally/
export const fetchIssuerConfiguration = async () => {
  if (_oidConfiguration?.issuer) return _oidConfiguration;

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

export default { fetchIssuerConfiguration };
