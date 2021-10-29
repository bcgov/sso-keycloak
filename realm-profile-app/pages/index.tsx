import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import styled from 'styled-components';
import Grid from '@button-inc/bcgov-theme/Grid';
import Button from '@button-inc/bcgov-theme/Button';
import ResponsiveContainer, { MediaRule } from 'components/ResponsiveContainer';
import { UserSession } from 'types/user-session';
import hero from 'public/home-right.png';

const JumbotronH1 = styled.h1`
  font-size: 2.5rem;
`;

const JumbotronP = styled.p`
  font-size: 1.5rem;
`;

const mediaRules: MediaRule[] = [
  {
    maxWidth: 900,
    marginTop: 10,
    marginLeft: 10,
    marginRight: 10,
    marginUnit: 'px',
    horizontalAlign: 'none',
  },
  {
    marginTop: 40,
    marginLeft: 2.5,
    marginRight: 2.5,
    marginUnit: 'rem',
    horizontalAlign: 'none',
  },
];

interface Props {
  currentUser: UserSession;
}

const Home = ({ currentUser }: Props) => {
  const router = useRouter();

  const handleLogin = async () => {
    window.location.href = '/api/oidc/keycloak/login';
  };

  const handleDashboard = async () => {
    router.push(`/my-dashboard`);
  };

  return (
    <ResponsiveContainer rules={mediaRules}>
      <Grid cols={10} gutter={[5, 2]} style={{ overflowX: 'hidden' }}>
        <Grid.Row collapse="800">
          <Grid.Col span={3}>
            <JumbotronH1>My Keycloak Custom Realm App</JumbotronH1>
            <JumbotronP>
              Use this self-service tool to
              <br />
              view, and edit some,
              <br />
              information about your
              <br />
              Custom realm.
            </JumbotronP>
            {currentUser ? (
              <Button size="medium" onClick={handleDashboard}>
                My Dashboard
              </Button>
            ) : (
              <Button size="medium" onClick={handleLogin}>
                Login
              </Button>
            )}
          </Grid.Col>
          <Grid.Col span={7}>
            <Image src={hero} alt="Hero image" />
          </Grid.Col>
        </Grid.Row>
      </Grid>
    </ResponsiveContainer>
  );
};

export default Home;
