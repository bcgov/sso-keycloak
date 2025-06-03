import sequelize from './config';
import { dirname } from 'path';
import { Umzug, SequelizeStorage } from 'umzug';
import os from 'node:os';

export const models = [
  'Session',
  'AccessToken',
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'ClientCredentials',
  'Client',
  'InitialAccessToken',
  'RegistrationAccessToken',
  'Interaction',
  'ReplayDetection',
  'PushedAuthorizationRequest',
  'Grant',
  'BackchannelAuthenticationRequest',
];

export const createMigrator = async (logger?: any) => {
  try {
    const __dirname = dirname(import.meta.url.replace(os.platform() === 'win32' ? 'file:///' : 'file://', '')); //dirname(__filename);
    return new Umzug({
      migrations: {
        glob: `${__dirname}/migrations/*.{ts,js}`,
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
