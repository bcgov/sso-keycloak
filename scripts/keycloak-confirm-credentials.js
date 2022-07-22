const _ = require('lodash');
const { getAdminClient } = require('./keycloak-core');

async function main() {
  try {
    ['dev', 'test', 'prod', 'alpha', 'beta', 'gamma'].forEach(async (env) => {
      const client = await getAdminClient(env);
      console.log(`${env}: ${!!client}`);
    });
  } catch (err) {
    console.log(err);
  }
}

main();
