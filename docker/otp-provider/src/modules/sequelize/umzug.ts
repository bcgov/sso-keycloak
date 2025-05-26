import sequelize from './config';
import { dirname } from 'path';
import { Umzug, SequelizeStorage } from 'umzug';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const createMigrator = async (logger?: any) => {
  try {
    return new Umzug({
      migrations: {
        glob: ['migrations/*.{ts,js}', { cwd: __dirname }],
        resolve: ({ name, path, context }) => {
          return {
            name,
            up: async () => {
              const migration = await import(path || '');
              return migration.up(context);
            },
            down: async () => {
              const migration = await import(path || '');
              return migration.down(context);
            },
          };
        },
      },
      context: sequelize.getQueryInterface(),
      storage: new SequelizeStorage({
        sequelize,
      }),
      logger: logger || console,
    });
  } catch (error) {
    console.error('Error creating migrator:', error);
    throw error;
  }
};
