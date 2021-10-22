import { useEffect } from 'react';
import { GetStaticProps, GetStaticPaths, GetServerSidePropsContext } from 'next';
import getConfig from 'next/config';
import jwt from 'jsonwebtoken';
import store2 from 'store2';
import { getAccessToken } from 'utils/oidc';
import { verifyJWT } from 'utils/jwt';
const { serverRuntimeConfig = {} } = getConfig() || {};
const { jwt_secret, jwt_token_expiry } = serverRuntimeConfig;

export default function OauthCallback({ appToken, name, preferred_username, email }: any) {
  store2('app-token', appToken);
  store2('app-session', { name, preferred_username, email });

  useEffect(() => {
    window.location = '/';
  }, []);

  return null;
}

export async function getServerSideProps({ req, res, query }: GetServerSidePropsContext) {
  try {
    const { code } = query;

    const tokens = await getAccessToken({ code });
    const { access_token = '' } = tokens;
    const { name, preferred_username, email } = (await verifyJWT(access_token)) as any;
    const appToken = jwt.sign({ access_token }, jwt_secret, {
      expiresIn: jwt_token_expiry,
    });

    return {
      props: { appToken, name, preferred_username, email },
    };
  } catch (err) {
    console.error(err);
    return {
      props: {},
    };
  }
}
