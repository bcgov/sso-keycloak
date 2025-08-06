import { createMigrator } from '../modules/sequelize/umzug';
import logger from '../modules/winston.config';
import { createTestClients } from './helpers/queries';

describe('database', () => {
  afterAll(async () => {
    // seed database here
    await createTestClients();
  });
  it('should migrate database successfully', async () => {
    const migrator = await createMigrator(logger);
    await migrator.up();
  });
});
