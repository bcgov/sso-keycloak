const { promisify } = require('util');
const _ = require('lodash');
const soapRequest = require('easy-soap-request');
const { parseString } = require('xml2js');
const { handleError, ignoreError } = require('../../helpers');
const dotenv = require('dotenv');
dotenv.config('../../');

const parseStringSync = promisify(parseString);
const logPrefix = 'BCEID BOTH: ';
const log = (msg) => console.log(`${logPrefix}${msg}`);

const defaultHeaders = {
  'Content-Type': 'text/xml;charset=UTF-8',
  authorization: `Basic ${process.env.BCEID_SERVICE_BASIC_AUTH}`,
};

const generateXML = ({
  property = 'userGuid',
  accountType = 'Business',
  matchKey = '',
  serviceId = '',
  idirUserGuid = process.env.BCEID_REQUESTER_IDIR_GUID,
}) => `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
 <soapenv:Header/>
 <soapenv:Body>
    <getAccountDetail xmlns="http://www.bceid.ca/webservices/Client/V10/">
       <accountDetailRequest>
          <onlineServiceId>${serviceId}</onlineServiceId>
          <requesterAccountTypeCode>Internal</requesterAccountTypeCode>
          <requesterUserGuid>${idirUserGuid}</requesterUserGuid>
          <${property}>${matchKey}</${property}>
          <accountTypeCode>${accountType}</accountTypeCode>
       </accountDetailRequest>
    </getAccountDetail>
 </soapenv:Body>
</soapenv:Envelope>`;

const parseAccount = (data) => {
  const guid = _.get(data, 'guid.0.value.0');
  const userId = _.get(data, 'userId.0.value.0');
  const displayName = _.get(data, 'displayName.0.value.0');
  const type = _.get(data, 'type.0.code.0');
  const email = _.get(data, 'contact.0.email.0.value.0');
  const telephone = _.get(data, 'contact.0.telephone.0.value.0');
  const firstName = _.get(data, 'individualIdentity.0.name.0.firstname.0.value.0');
  const lastName = _.get(data, 'individualIdentity.0.name.0.surname.0.value.0');
  const businessGuid = _.get(data, 'business.0.guid.0.value.0');
  const businessLegalName = _.get(data, 'business.0.legalName.0.value.0');

  return { guid, userId, displayName, type, email, telephone, firstName, lastName, businessGuid, businessLegalName };
};

const fetchBceidUser = async ({ accountType = 'Business', property = 'userGuid', matchKey = '', env = 'dev' }) => {
  let serviceUrl = '';
  let serviceId = '';
  if (env === 'dev') {
    serviceUrl = 'https://gws2.development.bceid.ca';
    serviceId = process.env.BCEID_SERVICE_ID_DEV;
  } else if (env === 'test') {
    serviceUrl = 'https://gws2.test.bceid.ca';
    serviceId = process.env.BCEID_SERVICE_ID_TEST;
  } else if (env === 'prod') {
    serviceUrl = 'https://gws2.bceid.ca';
    serviceId = process.env.BCEID_SERVICE_ID_PROD;
  }

  const xml = generateXML({ accountType, property, matchKey, serviceId });

  try {
    const { response } = await soapRequest({
      url: `${serviceUrl}/webservices/client/V10/BCeIDService.asmx?WSDL`,
      headers: defaultHeaders,
      xml,
      timeout: 1000,
    });

    const { headers, body, statusCode } = response;
    const result = await parseStringSync(body);
    const data = _.get(result, 'soap:Envelope.soap:Body.0.getAccountDetailResponse.0.getAccountDetailResult.0');
    if (!data) return null;

    const status = _.get(data, 'code.0');
    if (status === 'Failed') {
      const failureCode = _.get(data, 'failureCode.0');
      const message = _.get(data, 'message.0');
      log(`${failureCode}: ${message}`);
      return null;
    }

    const account = _.get(data, 'account.0');
    const parsed = parseAccount(account);
    return parsed;
  } catch (error) {
    log(error);
    return null;
  }
};

const migrateSilverBceidBothToGoldStandard = async (baseAdminClient, targetAdminClient, bceidUsernames = [], env) => {
  if (!baseAdminClient || !targetAdminClient || !env) return;

  for (let x = 0; x < bceidUsernames.length; x++) {
    const username = bceidUsernames[x];

    try {
      let baseUsers = await baseAdminClient.users.find({ realm: '_bceid', username, exact: true });
      baseUsers = baseUsers.filter((v) => v.username === username);
      if (baseUsers.length === 0) {
        log(`not found ${username}`);
        continue;
      }

      const baseUser = baseUsers[0];
      if (!baseUser.attributes.bceid_userid) {
        log(`no user guid ${username}`);
        continue;
      }

      const baseBceidGuid = baseUser.attributes.bceid_userid[0];

      const details =
        (await fetchBceidUser({ accountType: 'Business', matchKey: baseBceidGuid, env })) ||
        (await fetchBceidUser({ accountType: 'Individual', matchKey: baseBceidGuid, env }));

      if (!details) {
        log(`not found in bceid web service ${username}`);
        continue;
      }

      const commonUserData = {
        enabled: true,
        email: details.email,
        firstName: '',
        lastName: '',
        attributes: {
          display_name: details.displayName,
          bceid_user_guid: details.guid,
          bceid_username: details.userId,
          bceid_type: details.type,
          bceid_business_guid: details.businessGuid,
          bceid_business_name: details.businessLegalName,
        },
      };

      let targetBceidUser = await targetAdminClient.users.create({
        ...commonUserData,
        realm: 'bceidboth',
        username: details.guid,
      });

      targetBceidUser = await targetAdminClient.users.findOne({ realm: 'bceidboth', id: targetBceidUser.id });

      await targetAdminClient.users.addToFederatedIdentity({
        realm: 'bceidboth',
        id: targetBceidUser.id,
        federatedIdentityId: 'bceidboth',
        federatedIdentity: {
          userId: details.guid,
          userName: details.guid,
          identityProvider: 'bceidboth',
        },
      });

      const targetStandardUser = await targetAdminClient.users.create({
        ...commonUserData,
        realm: 'standard',
        username: `${baseBceidGuid}@bceidboth`,
      });

      await targetAdminClient.users.addToFederatedIdentity({
        realm: 'standard',
        id: targetStandardUser.id,
        federatedIdentityId: 'bceidboth',
        federatedIdentity: {
          userId: targetBceidUser.id,
          userName: targetBceidUser.username,
          identityProvider: 'bceidboth',
        },
      });

      log(`${username} created`);
    } catch (err) {
      log(`error with: ${username}`);
      handleError(err);
    }
  }
};

module.exports = { fetchBceidUser, migrateSilverBceidBothToGoldStandard };
