import { QueryInterface, DataTypes } from 'sequelize';

const name = '018_add_client_id_otp_table';

const tableName = 'Otp';

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.addColumn(tableName, 'clientId', {
    type: DataTypes.STRING,
    allowNull: false,
  });
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.removeColumn(tableName, 'clientId');
};

export default { name, up, down };
