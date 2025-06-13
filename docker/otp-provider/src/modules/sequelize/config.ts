import * as pg from 'pg';
import { Sequelize } from 'sequelize';
import { config as envVars } from '../../config';

const { NODE_ENV, DB_HOSTNAME, DB_USERNAME, DB_PASSWORD, DB_NAME, DB_PORT } = envVars;

const config: any = {
  development: {
    dialect: 'postgres',
    dialectModule: pg,
    host: DB_HOSTNAME || 'localhost',
    username: DB_USERNAME || 'postgres',
    password: DB_PASSWORD || 'postgres',
    database: DB_NAME || 'otp',
    port: DB_PORT,
    logging: false,
    dialectOptions: {},
    omitNull: false,
    define: {
      freezeTableName: true,
    },
  },
  test: {
    dialect: 'postgres',
    dialectModule: pg,
    host: DB_HOSTNAME || 'localhost',
    username: DB_USERNAME || 'postgres',
    password: DB_PASSWORD || 'postgres',
    database: DB_NAME || 'otp_test',
    port: DB_PORT,
    logging: false,
    dialectOptions: {},
    omitNull: false,
    define: {
      freezeTableName: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  production: {
    host: DB_HOSTNAME || 'localhost',
    username: DB_USERNAME || '',
    password: DB_PASSWORD || '',
    database: DB_NAME || '',
    port: DB_PORT,
    dialect: 'postgres',
    dialectModule: pg,
    omitNull: true,
    dialectOptions: {
      ssl: {
        require: true,
        // Ref.: https://github.com/brianc/node-postgres/issues/2009
        rejectUnauthorized: false,
      },
    },
    logging: false,
    define: {
      freezeTableName: true,
    },
  },
};

const sequelize = new Sequelize(config[NODE_ENV || 'development']);

export default sequelize;
