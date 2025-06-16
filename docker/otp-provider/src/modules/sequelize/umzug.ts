import sequelize from './config';
import { Umzug, SequelizeStorage } from 'umzug';
import os from 'node:os';
import { dirname } from 'path';

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
  const dirName = dirname(import.meta.url.replace(os.platform() === 'win32' ? 'file:///' : 'file://', ''));
  try {
    return new Umzug({
      migrations: {
        glob: `${dirName}/migrations/*.{ts,js}`,
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
    logger.error('Error creating migrator:', error);
    throw error;
  }
};
