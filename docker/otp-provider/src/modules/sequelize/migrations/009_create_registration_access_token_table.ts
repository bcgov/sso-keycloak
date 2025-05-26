import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

const name = '009_create_registration_access_token_table';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('RegistrationAccessToken', {
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
  await queryInterface.dropTable('RegistrationAccessToken');
};

export default { name, up, down };
