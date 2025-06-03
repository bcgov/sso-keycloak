import * as winston from 'winston';
import { config } from '../config';

const { LOG_LEVEL, NODE_ENV } = config;

const { combine, timestamp, json, errors, splat } = winston.format;

const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: combine(
    timestamp(),
    errors({ stack: NODE_ENV !== 'production' }),
    json(),
    splat(),
    NODE_ENV === 'production' ? winston.format.uncolorize() : winston.format.colorize(),
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
