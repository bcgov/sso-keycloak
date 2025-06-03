import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

const name = '010_create_device_code_table';

const tableName = 'DeviceCode';

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
    userCode: {
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
    name: 'device_code_grant_id_index',
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable(tableName);
  await queryInterface.removeIndex(tableName, 'device_code_grant_id_index');
};

export default { name, up, down };
