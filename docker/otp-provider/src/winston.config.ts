import * as winston from 'winston';
import { config } from './config';

const { LOG_LEVEL } = config;

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: isDevelopment
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        }), // Custom formatting for development
      )
    : winston.format.json(), // Format to Kibana-compatible JSON
  transports: [new winston.transports.Console()],
});

export default logger;
