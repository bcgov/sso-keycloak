import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import jws from 'jws';
import jwkToPem from 'jwk-to-pem';
import getConfig from 'next/config';
import { fetchIssuerConfiguration } from './oidc-issuer';

const { serverRuntimeConfig = {} } = getConfig() || {};
const { sso_client_id, jwt_secret } = serverRuntimeConfig;

export const verifyToken = async (token: string) => {
  try {
    // 1. Decode the ID token.
    const { header } = jws.decode(token);

    // 2. Compare the local key ID (kid) to the public kid.
    const { jwks, issuer } = await fetchIssuerConfiguration();

    const key = jwks.find((key) => key.kid === header.kid);

    if (!key) {
      return false;
    }

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

type Data = {
  success: boolean;
  error: string | object;
};

export const validateRequest = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  try {
    const bearerToken = req.headers['authorization'];
    return jwt.verify((bearerToken as string).split('Bearer ')[1], jwt_secret) as any;
  } catch (error: any) {
    console.error(error);
    return null;
  }
};
