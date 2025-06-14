import sequelize from '../modules/sequelize/config';
import { createMigrator } from '../modules/sequelize/umzug';
import logger from '../modules/winston.config';

describe('database', () => {
  afterAll(async () => {
    // seed database here
    await sequelize.query(`INSERT INTO public."ClientConfig"
      ("clientId",
      "grantTypes",
      "redirectUris",
      "scope",
      "responseTypes",
      "clientUri",
      "allowedCorsOrigins",
      "postLogoutRedirectUris",
      "tokenEndpointAuthMethod")
      VALUES('pub-client',
        '{authorization_code, refresh_token}',
        '{http://localhost:3001}',
        'openid email',
        '{code}',
        'http://localhost:3001',
        '{http://localhost:3001}',
        '{http://localhost:3001}',
        'none')`);
  });
  it('should migrate database successfully', async () => {
    const migrator = await createMigrator(logger);
    await migrator.up();
  });
});
