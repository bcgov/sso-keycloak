import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

const name = '015_create_back_channel_auth_request_table';

const tableName = 'BackchannelAuthenticationRequest';

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
    name: 'back_ch_auth_grant_id_index',
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable(tableName);
  await queryInterface.removeIndex(tableName, 'back_ch_auth_grant_id_index');
};

export default { name, up, down };
