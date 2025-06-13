import express, { Express, Response } from 'express';
import Provider from 'oidc-provider';
import { oidcRouter } from './routes/interaction';
import * as path from 'node:path';
import cors from 'cors';
import { generateEvents } from './events';
import { dirname } from 'path';
import helmet from 'helmet';
import { config } from './config';
import { createMigrator } from './modules/sequelize/umzug';
import logger from './modules/winston.config';
import * as crypto from 'crypto';
import { userRouter } from './routes/user';
import session from 'express-session';
import { getConfig, getOidcClients } from './modules/oidc-provider';
import os from 'node:os';

const { NODE_ENV, APP_URL, CORS_ORIGINS, COOKIE_SECRET } = config;

const staticFolder = dirname(import.meta.url.replace(os.platform() === 'win32' ? 'file:///' : 'file://', ''));

export const app = express();

app.use((_, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

const directives = helmet.contentSecurityPolicy.getDefaultDirectives();
delete directives['form-action'];

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        ...directives,
        'script-src': ["'self'", (_, res) => `'nonce-${(res as Response).locals.cspNonce}'`],
      },
    },
  }),
);

if (NODE_ENV === 'production') {
  app.set('trust proxy', true);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(staticFolder + '/public'));

app.set('views', path.join(staticFolder, 'views'));
app.set('view engine', 'ejs');

app.use(
  cors({
    origin: NODE_ENV === 'production' ? CORS_ORIGINS.split(',').map((origin) => origin.trim()) : '*',
    methods: ['GET', 'POST'],
  }),
);

app.disable('x-powered-by');

app.use(
  session({
    secret: COOKIE_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: NODE_ENV === 'production', // Use secure cookies in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  }),
);

export const initializeApp = async (app: Express) => {
  try {
    const migrator = await createMigrator(logger);
    logger.info('Migrating pending migrations:', await migrator.pending());
    await migrator.up();
  } catch (err) {
    logger.error('Error during database migration:', err);
  }

  const provider = new Provider(APP_URL, {
    ...getConfig(),
    clients: await getOidcClients(),
  });

  const userRoutes = await userRouter();

  app.use('/user', userRoutes);

  const oidcRoutes = await oidcRouter(provider);
  app.use('/interaction', oidcRoutes);

  app.use(provider.callback());

  if (NODE_ENV === 'production') provider.proxy = true; // Enable proxy support for the provider

  generateEvents(provider);
};

export default app;
