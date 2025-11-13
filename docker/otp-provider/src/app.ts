import express, { Express, Response } from 'express';
import Provider, { interactionPolicy } from 'oidc-provider';
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
import { getConfig, getOidcClients } from './modules/oidc-provider';
import os from 'node:os';
import compression from 'compression';

const { NODE_ENV, APP_URL, CORS_ORIGINS } = config;

const staticFolder = dirname(import.meta.url.replace(os.platform() === 'win32' ? 'file:///' : 'file://', ''));

const app = express();

app.use((_, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

const directives = helmet.contentSecurityPolicy.getDefaultDirectives();
delete directives['form-action'];

// Webkit in playwright will enforce https on asset requests even if the app is running on http. Needs to remove the directive. Interestingly chrome and firefox don't respect this one.
if (process.env.NODE_ENV === 'test') {
  delete directives['upgrade-insecure-requests'];
}

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

app.use(compression());

if (NODE_ENV === 'production') {
  app.set('trust proxy', true);
}

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

export const initializeApp = async (app: Express) => {
  try {
    const migrator = await createMigrator(logger);
    logger.info('Migrating pending migrations:', await migrator.pending());
    await migrator.up();
  } catch (err) {
    logger.error('Error during database migration:', err);
  }

  // Removing consent flow entirely, it is implicit from the login message
  const { base } = interactionPolicy;
  const policy = base();
  policy.remove('consent');

  const provider = new Provider(APP_URL, {
    ...getConfig(),
    interactions: {
      policy,
    },
    clients: await getOidcClients(),
    // Automatically adds grant without the user's explicit consent. Consent is considered implicit from login page.
    loadExistingGrant: async (ctx) => {
      const grantId =
        ctx.oidc.result?.consent?.grantId ||
        (ctx.oidc.client?.clientId && ctx.oidc.session?.grantIdFor(ctx.oidc.client?.clientId!));

      if (grantId) {
        const grant = await ctx.oidc.provider.Grant.find(grantId);
        return grant;
      }

      const grant = new ctx.oidc.provider.Grant({
        clientId: ctx.oidc.client!.clientId,
        accountId: ctx.oidc.session!.accountId,
      });

      grant.addOIDCScope('openid email');
      grant.addOIDCClaims(['email']);
      await grant.save();
      return grant;
    },
  });

  app.get('/terms-of-use', (req, res) => {
    res.render('terms-of-use');
  });

  const oidcRoutes = await oidcRouter(provider);
  app.use('/interaction', oidcRoutes);

  // Note: Provider callback handles catchall 404 already
  app.use(provider.callback());

  if (NODE_ENV === 'production') provider.proxy = true; // Enable proxy support for the provider

  generateEvents(provider);
};

export default app;
