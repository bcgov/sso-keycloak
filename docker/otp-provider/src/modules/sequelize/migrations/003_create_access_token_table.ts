import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

const name = '003_create_access_token_table';

const tableName = 'AccessToken';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.createTable(tableName, {
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

  await queryInterface.addIndex(tableName, {
    fields: ['grantId'],
    name: 'access_token_grant_id_index',
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable(tableName);
  await queryInterface.removeIndex(tableName, 'access_token_grant_id_index');
};

export default { name, up, down };
