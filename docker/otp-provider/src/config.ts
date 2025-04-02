import dotenv from 'dotenv';

dotenv.config();

export const config = {
  CHES_TOKEN_URL: process.env.CHES_TOKEN_URL || '',
  CHES_EMAIL_URL: process.env.CHES_EMAIL_URL || '',
  CHES_USERNAME: process.env.CHES_USERNAME || '',
  CHES_PASSWORD: process.env.CHES_PASSWORD || '',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
};
