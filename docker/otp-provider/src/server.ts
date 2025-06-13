import app, { initializeApp } from './app';
import { cleanupTables } from './modules/cron/cleanup';
import logger from './modules/winston.config';
import cron from 'node-cron';
import { config } from './config';

const { APP_URL, DB_CLEANUP_CRON } = config;

const PORT = 3000;

const main = async () => {
  await initializeApp(app);
  app.listen(PORT, () => {
    logger.info(`OIDC Provider is running on ${APP_URL}`);
  });

  cron.schedule(DB_CLEANUP_CRON, cleanupTables);
};

main();
