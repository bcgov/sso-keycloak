import _ from 'lodash';
import yargs from 'yargs/yargs';
import { createContainer } from 'container';
import { fetchBceidUser } from 'helpers/webservice-bceid';

const argv = yargs(process.argv.slice(2))
  .options({
    env: { type: 'string', default: null },
    type: { type: 'string', default: '' },
    property: { type: 'string', default: 'userGuid' },
    search: { type: 'string', default: '' },
    auto: { type: 'boolean', default: false },
  })
  .parseSync();

const { type, search, property, env, auto } = argv;

if (!env || !search) {
  console.info(`
Usages:
  yarn script scripts/test-webservice-bceid --type <type> --search <search> --env <env> [--auto]

Flags:
  --env            BCeID web service environment; dev | test | prod
  --type           BCeID account type; Business | Individual
  --property       BCeID search property; userGuid | userId
  --search         BCeID account search value
  --auto           Skips the confirmation before running the script
`);

  process.exit(1);
}

const container = createContainer(auto);
container(async () => {
  let result = null;
  const baseParams = { accountType: type, property, matchKey: search, env, logging: _.noop };

  if (type) {
    result = await fetchBceidUser(baseParams);
    console.log('result', result);
    return;
  }

  result =
    (await fetchBceidUser({ ...baseParams, accountType: 'Business' })) ||
    (await fetchBceidUser({ ...baseParams, accountType: 'Individual' }));

  console.log('result', result);
});
