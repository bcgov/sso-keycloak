import { promisify } from 'util';
import _ from 'lodash';
import soapRequest from 'easy-soap-request';
import { parseString } from 'xml2js';
import { getWebServiceInfo } from './webservice-core';

const parseStringSync = promisify(parseString);
const logPrefix = 'BCeID: ';

type Property = 'userId' | 'userGuid';
type AccountType = 'Business' | 'Individual';

const generateXML = ({
  property = 'userGuid',
  accountType = 'Business',
  matchKey = '',
  serviceId = '',
  requesterIdirGuid = '',
}: {
  property: Property;
  accountType: AccountType;
  matchKey: string;
  serviceId: string;
  requesterIdirGuid?: string;
}) => `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
 <soapenv:Header/>
 <soapenv:Body>
    <getAccountDetail xmlns="http://www.bceid.ca/webservices/Client/V10/">
       <accountDetailRequest>
          <onlineServiceId>${serviceId}</onlineServiceId>
          <requesterAccountTypeCode>Internal</requesterAccountTypeCode>
          <requesterUserGuid>${requesterIdirGuid}</requesterUserGuid>
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

export async function fetchBceidUser({
  accountType = 'Business',
  property = 'userGuid',
  matchKey = '',
  env = 'dev',
  logging = (msg: string) => console.log(`${logPrefix}${msg}`),
}) {
  const { requestHeaders, requesterIdirGuid, serviceUrl, serviceId } = getWebServiceInfo({ env });

  const xml = generateXML({
    accountType: accountType as AccountType,
    property: property as Property,
    matchKey,
    serviceId,
    requesterIdirGuid,
  });

  try {
    const { response } = await soapRequest({
      url: `${serviceUrl}/webservices/client/V10/BCeIDService.asmx?WSDL`,
      headers: requestHeaders,
      xml,
      timeout: 5000,
    });

    const { headers, body, statusCode } = response;
    const result = await parseStringSync(body);
    const data = _.get(result, 'soap:Envelope.soap:Body.0.getAccountDetailResponse.0.getAccountDetailResult.0');
    if (!data) return null;

    const status = _.get(data, 'code.0');
    if (status === 'Failed') {
      const failureCode = _.get(data, 'failureCode.0');
      const message = _.get(data, 'message.0');
      logging(`${failureCode}: ${message}`);
      return null;
    }

    const account = _.get(data, 'account.0');
    const parsed = parseAccount(account);
    return parsed;
  } catch (error) {
    logging(String(error));
    return null;
  }
}
