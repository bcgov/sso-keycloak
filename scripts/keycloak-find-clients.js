const _ = require('lodash');
const { getAdminClient } = require('./keycloak-core');

const silverClientIds = [];

const goldClientClientIds = [];

async function main() {
  try {
    let kcAdminClient = await getAdminClient('alpha');
    if (!kcAdminClient) return;

    for (let x = 0; x < goldClientClientIds.length; x++) {
      const client = await kcAdminClient.clients.findOne({ realm: 'standard', clientId: goldClientClientIds[x] });
      if (client.length > 0) console.log(client[0].clientId);
    }

    console.log('searched in gold');

    kcAdminClient = await getAdminClient('dev');
    if (!kcAdminClient) return;

    for (let x = 0; x < silverClientIds.length; x++) {
      let client = await kcAdminClient.clients.findOne({ realm: 'onestopauth', clientId: silverClientIds[x] });
      if (client.length > 0) console.log(client[0].clientId);

      client = await kcAdminClient.clients.findOne({ realm: 'onestopauth-basic', clientId: silverClientIds[x] });
      if (client.length > 0) console.log(client[0].clientId);

      client = await kcAdminClient.clients.findOne({ realm: 'onestopauth-business', clientId: silverClientIds[x] });
      if (client.length > 0) console.log(client[0].clientId);

      client = await kcAdminClient.clients.findOne({ realm: 'onestopauth-both', clientId: silverClientIds[x] });
      if (client.length > 0) console.log(client[0].clientId);
    }

    console.log('searched in silver');
  } catch (err) {
    console.error(err.response.data && err.response.data.error);
  }
}

main();
