import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

const name = '002_create_session_table';

const tableName = 'Session';

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
    uid: {
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
    fields: ['uid'],
    name: 'session_uid_index',
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable(tableName);
  await queryInterface.removeIndex(tableName, 'session_uid_index');
};

export default { name, up, down };
