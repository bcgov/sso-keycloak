import '../styles/globals.css';
import React, { useState, useEffect } from 'react';
import { GetStaticProps, GetStaticPaths, GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';
import getConfig from 'next/config';
import type { AppProps } from 'next/app';
import Layout from 'layout/Layout';
import Head from 'next/head';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const handleLogin = async () => {
    window.location = '/api/oidc/keycloak/login';
  };

  const handleLogout = async () => {};

  return (
    <Layout currentUser={null} onLoginClick={handleLogin} onLogoutClick={handleLogout}>
      <Head>
        <html lang="en" />
        <title>SSO Keycloak Realm Profile</title>
      </Head>
      <Component {...pageProps} currentUser={null} onLoginClick={handleLogin} onLogoutClick={handleLogout} />
    </Layout>
  );
}
export default MyApp;
