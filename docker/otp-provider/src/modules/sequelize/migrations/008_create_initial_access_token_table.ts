import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

const name = '008_create_initial_access_token_table';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable('InitialAccessToken', {
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
  await queryInterface.dropTable('InitialAccessToken');
};

export default { name, up, down };
