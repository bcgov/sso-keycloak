import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

const name = '006_create_client_credentials_table';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('ClientCredentials', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.STRING,
    },
    data: {
      type: DataTypes.JSONB,
    },
    expiresAt: {
      type: DataTypes.DATE(3),
    },
    grantId: {
      type: DataTypes.STRING(50),
    },
    consumedAt: {
      type: DataTypes.DATE(3),
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
  await queryInterface.dropTable('ClientCredentials');
};

export default { name, up, down };
