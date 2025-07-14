import dotenv from 'dotenv';

dotenv.config();

export const config = {
  APP_ENV: process.env.APP_ENV || 'development',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  DB_RUN_MIGRATIONS: process.env.DB_RUN_MIGRATIONS || 'true',
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
  CORS_ORIGINS: process.env.CORS_ORIGINS || '',
  DB_CLEANUP_CRON: process.env.DB_CLEANUP_CRON || '0 1 * * *',
  HASH_SALT: process.env.HASH_SALT || '',
  OTP_VALIDITY_MINUTES: process.env.OTP_VALIDITY_MINUTES || '5',
  OTP_ATTEMPTS_ALLOWED: process.env.OTP_ATTEMPTS_ALLOWED || '5',
  OTP_RESENDS_ALLOWED_PER_DAY: process.env.OTP_RESENDS_ALLOWED_PER_DAY || '4',
  OTP_RESEND_INTERVAL_MINUTES: process.env.OTP_RESEND_INTERVAL_MINUTES || '[1,2,5,25]',
  COOKIE_SECRETS: process.env.COOKIE_SECRETS || 's3cr3t1,s3cr3t1,s3cr3t2',
};
