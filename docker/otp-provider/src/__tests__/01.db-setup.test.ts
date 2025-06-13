import { createMigrator } from '../modules/sequelize/umzug';
import logger from '../modules/winston.config';

describe('database', () => {
  it('should migrate database successfully', async () => {
    const migrator = await createMigrator(logger);
    await migrator.up();
  });
});
