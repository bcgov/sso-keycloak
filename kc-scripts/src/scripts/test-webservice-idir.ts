import yargs from 'yargs/yargs';
import { createContainer } from 'container';
import { fetchIdirUser } from 'helpers/webservice-idir';

const argv = yargs(process.argv.slice(2))
  .options({
    env: { type: 'string', default: null },
    property: { type: 'string', default: 'userId' },
    search: { type: 'string', default: '' },
    auto: { type: 'boolean', default: false },
  })
  .parseSync();

const { search, property, env, auto } = argv;

if (!env || !search) {
  console.info(`
Usages:
  yarn script scripts/test-webservice-idir --type <type> --search <search> --env <env> [--auto]

Flags:
  --env            BCeID web service environment; dev | test | prod
  --property       IDIR search property; userId
  --search         IDIR account search value
  --auto           Skips the confirmation before running the script
`);

  process.exit(1);
}

const container = createContainer(auto);
container(async () => {
  const result = await fetchIdirUser({ property, matchKey: search, env });
  console.log('result', result);
});
