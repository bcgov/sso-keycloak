import { promisify } from 'util';
import { parseString } from 'xml2js';
import { getAdminClient } from './helpers.js';
import { generateXML, getWebServiceInfo } from './utils/bceid-webservice.js';
import axios from 'axios';
const parseStringSync = promisify(parseString);
import lodash from 'lodash';
import { parallel, reflectAll } from 'async';

const env = 'prod';
const { get } = lodash;
const { post } = axios;

const callSoapService = async (user) => {
  const { requestHeaders, requesterIdirGuid, serviceUrl, serviceId } = getWebServiceInfo({ env });
  let retries = 3;
  while (retries > 0) {
    try {
      const soapPayload = generateXML({
        matchKey: user?.attributes?.idir_username[0],
        serviceId,
        requesterIdirGuid
      });

      const response = await post(`${serviceUrl}/webservices/client/V10/BCeIDService.asmx?WSDL`, soapPayload, {
        headers: requestHeaders,
        timeout: 10000
      });

      return response;
    } catch (error) {
      console.error('Error calling SOAP service:', error);
      retries--;
      if (retries === 0) {
        throw error;
      }
    }
  }
};

const verifyKeycloakUsers = async (name, start, callback) => {
  const suspeciousUsers = [];
  const max = 100;
  let total = 0;
  let first = start;
  const adminClient = await getAdminClient(env);
  const username = '@idir';

  try {
    while (true) {
      const users = await adminClient.users.find({ realm: 'standard', username, first, max });
      const count = users.length;
      total += count;
      if (users.length === 0) break;

      for (let x = 0; x < users.length; x++) {
        console.log(`[${name}]Processing user:`, users[x].username, users[x].email);
        const { attributes } = users[x];
        if (attributes?.idir_username) {
          const { data: body } = await callSoapService(users[x]);

          const result = await parseStringSync(body);
          const data = get(
            result,
            'soap:Envelope.soap:Body.0.searchInternalAccountResponse.0.searchInternalAccountResult.0'
          );

          if (!data) throw Error('no data');

          const status = get(data, 'code.0');

          if (status === 'Success') {
            const email = get(data, 'accountList.0.BCeIDAccount.0.contact.0.email.0.value.0');
            if (!users[x].email || !email) {
              continue;
            }
            if (users[x].email.toLowerCase() !== email.toLowerCase()) {
              console.log('Mismatch:', users[x].username, users[x].email, email);
              suspeciousUsers.push({
                username: users[x].username,
                kcEmail: users[x].email,
                bceidEmail: email
              });
            }
          } else {
            console.log('Skipping user:', users[x].username);
            console.log('Status:', status);
            console.log('Failure Code:', get(data, 'failureCode.0'));
            continue;
          }
        }
      }
      // each runner can process records up to 10000
      if (count < max || total === 10000) break;

      await adminClient.reauth();
      first = first + max;
      console.log(`[${name}] completed processing ${first} users`);
    }
    callback(null, { name, start, total: suspeciousUsers.length, suspeciousUsers });
  } catch (err) {
    console.error('Error:', err);
    callback(err);
  }
};

async function main() {
  parallel(
    reflectAll([
      function (cb) {
        verifyKeycloakUsers('prod-01', 0, cb);
      },
      function (cb) {
        verifyKeycloakUsers('prod-02', 10000, cb);
      },
      function (cb) {
        verifyKeycloakUsers('prod-03', 20000, cb);
      },
      function (cb) {
        verifyKeycloakUsers('prod-04', 30000, cb);
      },
      function (cb) {
        verifyKeycloakUsers('prod-05', 40000, cb);
      }
    ]),
    async function (_, results) {
      // if (!fs.existsSync(basePath)) fs.mkdirSync(basePath);
      // fs.writeFileSync(
      //   path.resolve(basePath, `users-${env}-${new Date().getTime()}.json`),
      //   results.map((r) => JSON.stringify(r)).join('\n\n')
      // );
      console.log(results.map((r) => JSON.stringify(r)).join('\n\n'));
    }
  );
}

main();
