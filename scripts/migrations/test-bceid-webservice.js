const _ = require('lodash');
const { argv } = require('yargs');
const Confirm = require('prompt-confirm');
const { handleError, ignoreError } = require('../helpers');
const { fetchBceidUser } = require('./helpers/migrate-target-bceidboth-users');
const { type, search, env, auto } = argv;

async function main() {
  if (!env) {
    console.info(`
    Usage:
      node migrations/test-bceid-webservice --type <type> --search <search> --env <env> [--auto]

      Flags:
      --env            BCeID Client environment; dev | test | prod
      --type           BCeID account type; Business | Individual
      --search         BCeID account GUID to search for
      --auto           Skips the confirmation before running the script
    `);

    return;
  }

  try {
    if (!auto) {
      const prompt = new Confirm(`Are you sure to proceed?`);
      const answer = await prompt.run();
      if (!answer) return;
    }

    const result = await fetchBceidUser({ accountType: type, matchKey: search, env });
    console.log('result', result);

    process.exit(0);
  } catch (err) {
    handleError(err);
    process.exit(1);
  }
}

main();
