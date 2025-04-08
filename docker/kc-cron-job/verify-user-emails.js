const { promisify } = require('util');
const { parseString } = require('xml2js');
const { getAdminClient } = require('./helpers');
const { generateXML, getWebServiceInfo } = require('./utils/bceid-webservice');
const axios = require('axios');
const parseStringSync = promisify(parseString);
const _ = require('lodash');
//const fs = require('fs');
//const path = require('path');
const async = require('async');

//const basePath = path.join(__dirname, 'exports');

const env = 'prod';

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

      const response = await axios.post(`${serviceUrl}/webservices/client/V10/BCeIDService.asmx?WSDL`, soapPayload, {
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
  let first = start;
  const adminClient = await getAdminClient(env);
  const username = '@idir';

  try {
    while (true) {
      const users = await adminClient.users.find({ realm: 'standard', username, first, max });
      if (users.length === 0) break;

      for (const user of users) {
        console.log('Processing user:', user.username, user.email);
        const { attributes } = user;
        if (attributes?.idir_username) {
          const { data: body } = await callSoapService(user);

          const result = await parseStringSync(body);
          const data = _.get(
            result,
            'soap:Envelope.soap:Body.0.searchInternalAccountResponse.0.searchInternalAccountResult.0'
          );

          if (!data) throw Error('no data');

          const status = _.get(data, 'code.0');

          if (status === 'Success') {
            const email = _.get(data, 'accountList.0.BCeIDAccount.0.contact.0.email.0.value.0');
            if (!user.email || !email) {
              continue;
            }
            if (user.email.toLowerCase() !== email.toLowerCase()) {
              console.log('Mismatch:', user.username, user.email, email);
              suspeciousUsers.push({
                username: user.username,
                kcEmail: user.email,
                bceidEmail: email
              });
            }
          } else {
            console.log('Skipping user:', user.username);
            console.log('Status:', status);
            console.log('Failure Code:', _.get(data, 'failureCode.0'));
            continue;
          }
        }
      }
      await adminClient.reauth();
      first += max;
    }
    callback(null, { name, start, total: suspeciousUsers.length, suspeciousUsers });
  } catch (err) {
    console.error('Error:', err);
    callback(err);
  }
};

async function main() {
  async.parallel(
    async.reflectAll([
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
