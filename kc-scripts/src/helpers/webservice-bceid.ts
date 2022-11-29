import { promisify } from 'util';
import _ from 'lodash';
import soapRequest from 'easy-soap-request';
import { parseString } from 'xml2js';
import {
  BCEID_SERVICE_BASIC_AUTH,
  BCEID_REQUESTER_IDIR_GUID,
  BCEID_SERVICE_ID_DEV,
  BCEID_SERVICE_ID_TEST,
  BCEID_SERVICE_ID_PROD,
} from 'config';

const parseStringSync = promisify(parseString);
const logPrefix = 'BCeID: ';
const log = (msg: string) => console.log(`${logPrefix}${msg}`);

const defaultHeaders = {
  'Content-Type': 'text/xml;charset=UTF-8',
  authorization: `Basic ${BCEID_SERVICE_BASIC_AUTH}`,
};

const generateXML = ({
  property = 'userGuid',
  accountType = 'Business',
  matchKey = '',
  serviceId = '',
  idirUserGuid = BCEID_REQUESTER_IDIR_GUID,
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

const parseAccount = (data: any) => {
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

export async function fetchBceidUser({ accountType = 'Business', property = 'userGuid', matchKey = '', env = 'dev' }) {
  let serviceUrl = '';
  let serviceId = '';
  if (env === 'dev') {
    serviceUrl = 'https://gws2.development.bceid.ca';
    serviceId = BCEID_SERVICE_ID_DEV || '';
  } else if (env === 'test') {
    serviceUrl = 'https://gws2.test.bceid.ca';
    serviceId = BCEID_SERVICE_ID_TEST || '';
  } else if (env === 'prod') {
    serviceUrl = 'https://gws2.bceid.ca';
    serviceId = BCEID_SERVICE_ID_PROD || '';
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
    log(String(error));
    return null;
  }
}
