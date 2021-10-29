import { useEffect } from 'react';
import { GetStaticProps, GetStaticPaths, GetServerSidePropsContext } from 'next';
import getConfig from 'next/config';
import jwt from 'jsonwebtoken';
import store2 from 'store2';
import { getAccessToken } from 'utils/oidc';
import { verifyToken } from 'utils/jwt';
const { serverRuntimeConfig = {} } = getConfig() || {};
const { jwt_secret, jwt_token_expiry } = serverRuntimeConfig;

interface Sesssion {
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
  client_roles: string;
}
interface Props {
  appToken: string;
  session: Sesssion;
}
export default function OauthCallback({ appToken, session }: Props) {
  store2('app-token', appToken);
  store2('app-session', session);

  useEffect(() => {
    window.location.href = '/';
  }, []);

  return null;
}

export async function getServerSideProps({ req, res, query }: GetServerSidePropsContext) {
  try {
    const { code } = query;

    const tokens = await getAccessToken({ code: String(code) });
    const { access_token = '' } = tokens;
    const {
      preferred_username = '',
      given_name = '',
      family_name = '',
      email = '',
      client_roles = [],
    } = (await verifyToken(access_token)) as any;

    const session = {
      preferred_username,
      given_name,
      family_name,
      email,
      client_roles,
      idir_userid: preferred_username?.split('@idir')[0],
    };
    const appToken = jwt.sign({ access_token, ...session }, jwt_secret, { expiresIn: jwt_token_expiry });

    return {
      props: { appToken, session },
    };
  } catch (err) {
    console.error(err);
    return {
      props: {},
    };
  }
}
