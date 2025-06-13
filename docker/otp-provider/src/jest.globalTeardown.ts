import pg from 'pg';
import { Sequelize } from 'sequelize';

export default async function () {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    dialectModule: pg,
    host: 'localhost',
    username: 'postgres',
    password: 'postgres',
    database: 'otp_test',
    port: 5432,
    logging: false,
    dialectOptions: {},
    omitNull: false,
    define: {
      freezeTableName: true,
    },
  });
  const tableNames = await sequelize.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'",
  );
  const tables = tableNames.map((t: any) => t[0]);
  for (const table of tables) {
    await sequelize.query(`DROP TABLE "${table}" CASCADE`);
  }

  await sequelize.close();
}
