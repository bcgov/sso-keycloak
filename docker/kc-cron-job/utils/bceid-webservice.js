const { promisify } = require('util');
const { parseString } = require('xml2js');
const axios = require('axios');
const parseStringSync = promisify(parseString);
const _ = require('lodash');
const { log } = require('../helpers');
function getWebServiceInfo({ env = 'dev' }) {
  const requestHeaders = {
    'Content-Type': 'text/xml;charset=UTF-8',
    authorization: `Basic ${process.env.BCEID_SERVICE_BASIC_AUTH}`
  };

  const requesterIdirGuid = process.env.BCEID_REQUESTER_IDIR_GUID || '';

  let serviceUrl = '';
  let serviceId = '';
  if (env === 'dev') {
    serviceUrl = 'https://gws2.development.bceid.ca';
    serviceId = process.env.BCEID_SERVICE_ID_DEV || '';
  } else if (env === 'test') {
    serviceUrl = 'https://gws2.test.bceid.ca';
    serviceId = process.env.BCEID_SERVICE_ID_TEST || '';
  } else if (env === 'prod') {
    serviceUrl = 'https://gws2.bceid.ca';
    serviceId = process.env.BCEID_SERVICE_ID_PROD || '';
  }

  return { requestHeaders, requesterIdirGuid, serviceUrl, serviceId };
}

const generateXML = (
  {
    property = 'userId',
    matchKey = '',
    matchType = 'Exact',
    serviceId = '',
    requesterIdirGuid = '',
    page = 1,
    limit = 1
  },
  requestType = 'searchInternalAccount'
) => {
  if (requestType === 'getAccountDetail') {
    return `<?xml version="1.0" encoding="UTF-8"?>
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:V10="http://www.bceid.ca/webservices/Client/V10/">
          <soapenv:Header />
          <soapenv:Body>
              <V10:getAccountDetail>
               <V10:accountDetailRequest>
                  <V10:onlineServiceId>${serviceId}</V10:onlineServiceId>
                  <V10:requesterAccountTypeCode>Internal</V10:requesterAccountTypeCode>
                  <V10:requesterUserGuid>${requesterIdirGuid}</V10:requesterUserGuid>
                  <V10:${property}>${matchKey}</V10:${property}>
                  <V10:accountTypeCode>Internal</V10:accountTypeCode>
               </V10:accountDetailRequest>
            </V10:getAccountDetail>
          </soapenv:Body>
      </soapenv:Envelope>`;
  } else {
    return `<?xml version="1.0" encoding="UTF-8"?>
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:V10="http://www.bceid.ca/webservices/Client/V10/">
      <soapenv:Header />
      <soapenv:Body>
          <V10:searchInternalAccount>
              <V10:internalAccountSearchRequest>
                  <V10:onlineServiceId>${serviceId}</V10:onlineServiceId>
                  <V10:requesterAccountTypeCode>Internal</V10:requesterAccountTypeCode>
                  <V10:requesterUserGuid>${requesterIdirGuid}</V10:requesterUserGuid>
                  <requesterAccountTypeCode>Internal</requesterAccountTypeCode>
                  <V10:pagination>
                      <V10:pageSizeMaximum>${String(limit || 100)}</V10:pageSizeMaximum>
                      <V10:pageIndex>${String(page || 1)}</V10:pageIndex>
                  </V10:pagination>
                  <V10:sort>
                      <V10:direction>Ascending</V10:direction>
                      <V10:onProperty>UserId</V10:onProperty>
                  </V10:sort>
                  <V10:accountMatch>
                      <V10:${property}>
                         <V10:value>${matchKey}</V10:value>
                         <V10:matchPropertyUsing>${matchType}</V10:matchPropertyUsing>
                      </V10:${property}>
                   </V10:accountMatch>
              </V10:internalAccountSearchRequest>
          </V10:searchInternalAccount>
      </soapenv:Body>
  </soapenv:Envelope>`;
  }
};

async function checkUserExistsAtIDIM({ property = 'userGuid', matchKey = '', env = 'prod' }) {
  const { requestHeaders, requesterIdirGuid, serviceUrl, serviceId } = getWebServiceInfo({ env });
  const xml = generateXML({ property, matchKey, serviceId, requesterIdirGuid }, 'getAccountDetail');

  try {
    const response = await axios.post(`${serviceUrl}/webservices/client/V10/BCeIDService.asmx?WSDL`, xml, {
      headers: requestHeaders,
      timeout: 10000
    });

    const { data: body } = response;

    const result = await parseStringSync(body);
    const data = _.get(result, 'soap:Envelope.soap:Body.0.getAccountDetailResponse.0.getAccountDetailResult.0');
    if (!data) throw Error('no data');

    const status = _.get(data, 'code.0');
    const failureCode = _.get(data, 'failureCode.0');
    const failMessage = _.get(data, 'message.0');
    if (status === 'Success' && failureCode === 'Void') {
      return 'exists';
    } else if (status === 'Failed' && failureCode === 'NoResults') {
      return 'notexists';
    } else {
      log(`${env}: [${status}][${failureCode}] ${property}: ${matchKey}: ${String(failMessage)})`);
    }
    return 'error';
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = {
  checkUserExistsAtIDIM
};
