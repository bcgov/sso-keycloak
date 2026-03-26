import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { createContainer } from 'container';
import yargs from 'yargs/yargs';

const argv = yargs(process.argv.slice(2))
  .options({
    env: { type: 'string', default: null },
  })
  .parseSync();

const { env } = argv;

const container = createContainer('dev');
container(async (adminClient?: KeycloakAdminClient) => {
  if (!adminClient) return;
  console.log(env);
});
