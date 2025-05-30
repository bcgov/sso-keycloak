import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

const name = '001_create_client_config_table';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('ClientConfig', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    applicationType: {
      type: DataTypes.STRING,
    },
    clientId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    clientName: {
      type: DataTypes.STRING,
    },
    clientSecret: {
      type: DataTypes.STRING,
    },
    clientUri: {
      type: DataTypes.STRING,
    },
    allowedCorsOrigins: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    contacts: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    defaultAcrValues: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    defaultMaxAge: {
      type: DataTypes.INTEGER,
    },
    grantTypes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    idTokenSignedResponseAlg: {
      type: DataTypes.STRING,
    },
    initiateLoginUri: {
      type: DataTypes.STRING,
    },
    jwks: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    jwksUri: {
      type: DataTypes.STRING,
    },
    logoUri: {
      type: DataTypes.STRING,
    },
    policyUri: {
      type: DataTypes.STRING,
    },
    postLogoutRedirectUris: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    redirectUris: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    requireAuthTime: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    responseTypes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    scope: {
      type: DataTypes.STRING,
    },
    sectorIdentifierUri: {
      type: DataTypes.STRING,
    },
    subjectType: {
      type: DataTypes.STRING,
    },
    tokenEndpointAuthMethod: {
      type: DataTypes.STRING,
    },
    tosUri: {
      type: DataTypes.STRING,
    },
    userinfoSignedResponseAlg: {
      type: DataTypes.STRING,
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE(3),
      defaultValue: Sequelize.fn('NOW'),
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE(3),
      defaultValue: Sequelize.fn('NOW'),
    },
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('ClientConfig');
};

export default { name, up, down };
