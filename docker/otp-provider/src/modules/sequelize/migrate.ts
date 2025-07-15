import { createMigrator } from './umzug';

createMigrator()
    .then(migrator => migrator.up());
