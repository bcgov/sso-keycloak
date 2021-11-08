import '../styles/globals.css';
import React, { useState, useEffect } from 'react';
import { GetStaticProps, GetStaticPaths, GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';
import getConfig from 'next/config';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import store2 from 'store2';
import Layout from 'layout/Layout';
// store2('app-session', { name, preferred_username, email });

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(store2('app-session'));

  const handleLogin = async () => {
    window.location.href = '/api/oidc/keycloak/login';
  };

  const handleLogout = async () => {
    store2.remove('app-token');
    store2.remove('app-session');
    window.location.href = '/';
  };

  return (
    <Layout currentUser={currentUser} onLoginClick={handleLogin} onLogoutClick={handleLogout}>
      <Head>
        <html lang="en" />
        <title>Keycloak Realm Registry</title>
        <meta name="description" content="Keycloak Realm Registry" />
        <link rel="icon" href="/bcid-favicon-32x32.png" />
      </Head>
      <Component {...pageProps} currentUser={currentUser} onLoginClick={handleLogin} onLogoutClick={handleLogout} />
    </Layout>
  );
}
export default MyApp;
