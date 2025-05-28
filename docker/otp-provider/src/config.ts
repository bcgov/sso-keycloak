import dotenv from 'dotenv';

dotenv.config();

export const config = {
  APP_URL: process.env.APP_URL || 'http://localhost:8080',
  DB_HOSTNAME: process.env.DB_HOSTNAME || 'localhost',
  DB_USERNAME: process.env.DB_USERNAME || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DB_NAME: process.env.DB_NAME || 'otp',
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  CHES_TOKEN_URL: process.env.CHES_TOKEN_URL || '',
  CHES_API_URL: process.env.CHES_API_URL || '',
  CHES_USERNAME: process.env.CHES_USERNAME || '',
  CHES_PASSWORD: process.env.CHES_PASSWORD || '',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  JWKS: process.env.JWKS ? JSON.parse(process.env.JWKS) : {},
};
