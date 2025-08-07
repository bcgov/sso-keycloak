import sequelize from './config';
import Sequelize from 'sequelize';
import { models } from './umzug';

const grantable = new Set([
  'AccessToken',
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'BackchannelAuthenticationRequest',
]);

const mappedModels = models.reduce((map, name) => {
  map.set(
    name,
    sequelize.define(name, {
      id: { type: Sequelize.STRING, primaryKey: true },
      ...(grantable.has(name) ? { grantId: { type: Sequelize.STRING } } : undefined),
      ...(name === 'DeviceCode' ? { userCode: { type: Sequelize.STRING } } : undefined),
      ...(name === 'Session' ? { uid: { type: Sequelize.STRING } } : undefined),
      data: { type: Sequelize.JSONB },
      expiresAt: { type: Sequelize.DATE },
      consumedAt: { type: Sequelize.DATE },
    }),
  );

  return map;
}, new Map());

mappedModels.set(
  'ClientConfig',
  sequelize.define('ClientConfig', {
    id: { type: Sequelize.STRING, primaryKey: true },
    applicationType: { type: Sequelize.STRING },
    clientId: { type: Sequelize.STRING, allowNull: false, unique: true },
    clientName: { type: Sequelize.STRING },
    clientSecret: { type: Sequelize.STRING },
    clientUri: { type: Sequelize.STRING },
    allowedCorsOrigins: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
    contacts: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
    defaultAcrValues: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
    defaultMaxAge: { type: Sequelize.INTEGER },
    grantTypes: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
    initiateLoginUri: { type: Sequelize.STRING },
    jwks: { type: Sequelize.JSONB, defaultValue: {} },
    jwksUri: { type: Sequelize.STRING },
    logoUri: { type: Sequelize.STRING },
    policyUri: { type: Sequelize.STRING },
    requireAuthTime: { type: Sequelize.BOOLEAN, defaultValue: false },
    redirectUris: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
    responseTypes: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
    sectorIdentifierUri: { type: Sequelize.STRING },
    tokenEndpointAuthMethod: { type: Sequelize.STRING },
    tosUri: { type: Sequelize.STRING },
    subjectType: { type: Sequelize.STRING },
    postLogoutRedirectUris: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
    scope: { type: Sequelize.STRING },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
  }),
);

mappedModels.set(
  'Otp',
  sequelize.define('Otp', {
    id: { type: Sequelize.STRING, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
    otp: { type: Sequelize.STRING, allowNull: false },
    email: { type: Sequelize.STRING, allowNull: false },
    attempts: { type: Sequelize.INTEGER, defaultValue: 0 },
    active: { type: Sequelize.BOOLEAN, defaultValue: true },
    createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    clientId: { type: Sequelize.STRING, allowNull: false },
  }),
);

mappedModels.set(
  'Event',
  sequelize.define(
    'Event',
    {
      id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      eventType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      clientId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    },
    {
      timestamps: false,
    },
  ),
);

export default mappedModels;
