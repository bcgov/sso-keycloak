import jwt from 'jsonwebtoken';
import jws from 'jws';
import jwkToPem from 'jwk-to-pem';
import getConfig from 'next/config';
import { fetchIssuerConfiguration } from './oidc';

const { serverRuntimeConfig = {} } = getConfig() || {};
const { sso_client_id } = serverRuntimeConfig;

export const verifyJWT = async (token: string) => {
  try {
    // 1. Decode the ID token.
    const { header } = jws.decode(token);

    // 2. Compare the local key ID (kid) to the public kid.
    const { jwks, issuer } = await fetchIssuerConfiguration();

    const key = jwks.find((key) => key.kid === header.kid);

    if (!key) {
      return false;
    }

    console.log(key);

    // 3. Verify the signature using the public key
    const pem = jwkToPem(key);

    return jwt.verify(token, pem, {
      audience: sso_client_id,
      issuer,
      maxAge: '2h',
      ignoreExpiration: true,
    });
  } catch (err) {
    console.log(err);
    return false;
  }
};
