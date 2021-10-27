import React, { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import ResponsiveContainer, { MediaRule } from 'components/ResponsiveContainer';

const mediaRules: MediaRule[] = [
  {
    maxWidth: 900,
    marginTop: 0,
    marginLeft: 10,
    marginRight: 10,
    marginUnit: 'px',
    horizontalAlign: 'none',
  },
  {
    width: 480,
    marginTop: 0,
    marginLeft: 2.5,
    marginRight: 2.5,
    marginUnit: 'rem',
    horizontalAlign: 'none',
  },
];

const Home: NextPage = () => {
  return <ResponsiveContainer rules={mediaRules}>My Keycloak Custom Realm App</ResponsiveContainer>;
};

export default Home;
