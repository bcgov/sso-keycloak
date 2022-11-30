import { promisify } from 'util';
import _ from 'lodash';
import soapRequest from 'easy-soap-request';
import { parseString } from 'xml2js';
import { getWebServiceInfo } from './webservice-core';

const parseStringSync = promisify(parseString);
const logPrefix = 'IDIR Lookup: ';
const log = (msg: string) => console.log(`${logPrefix}${msg}`);

type Property = 'userId';
type MatchType = 'Exact' | 'Contains' | 'StartsWith';

const generateXML = ({
  property = 'userId',
  matchKey = '',
  matchType = 'Exact',
  serviceId = '',
  requesterIdirGuid = '',
  page = 1,
  limit = 1,
}: {
  property: Property;
  matchKey: string;
  matchType?: MatchType;
  serviceId: string;
  requesterIdirGuid?: string;
  page?: number;
  limit?: number;
}) => `<?xml version="1.0" encoding="UTF-8"?>
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

const parseAccount = (data: any) => {
  const guid = _.get(data, 'guid.0.value.0');
  const userId = _.get(data, 'userId.0.value.0');
  const displayName = _.get(data, 'displayName.0.value.0');

  const baseContact = _.get(data, 'contact.0');
  const contact = {
    email: _.get(baseContact, 'email.0.value.0'),
    telephone: _.get(baseContact, 'telephone.0.value.0'),
    preference: _.get(baseContact, 'preference.0.value.0'),
  };

  const baseIndividualIdentity = _.get(data, 'individualIdentity.0');
  const baseName = _.get(baseIndividualIdentity, 'name.0');

  const individualIdentity = {
    name: {
      firstname: _.get(baseName, 'firstname.0.value.0'),
      middleName: _.get(baseName, 'middleName.0.value.0'),
      otherMiddleName: _.get(baseName, 'otherMiddleName.0.value.0'),
      surname: _.get(baseName, 'surname.0.value.0'),
      initials: _.get(baseName, 'initials.0.value.0'),
    },
    dateOfBirth: _.get(baseIndividualIdentity, 'dateOfBirth.0.value.0'),
  };

  const baseInternalIdentity = _.get(data, 'internalIdentity.0');
  const internalIdentity = {
    title: _.get(baseInternalIdentity, 'title.0.value.0'),
    company: _.get(baseInternalIdentity, 'company.0.value.0'),
    organizationCode: _.get(baseInternalIdentity, 'organizationCode.0.value.0'),
    department: _.get(baseInternalIdentity, 'department.0.value.0'),
    office: _.get(baseInternalIdentity, 'office.0.value.0'),
    description: _.get(baseInternalIdentity, 'description.0.value.0'),
    employeeId: _.get(baseInternalIdentity, 'employeeId.0.value.0'),
  };

  return {
    guid,
    userId,
    displayName,
    email: contact.email,
    firstName: individualIdentity.name.firstname,
    lastName: individualIdentity.name.surname,
  };
};

export async function fetchIdirUser({ property = 'userId', matchKey = '', env = 'dev' }) {
  const { requestHeaders, requesterIdirGuid, serviceUrl, serviceId } = getWebServiceInfo({ env });

  const xml = generateXML({ property: property as Property, matchKey, serviceId, requesterIdirGuid });

  try {
    const { response } = await soapRequest({
      url: `${serviceUrl}/webservices/client/V10/BCeIDService.asmx?WSDL`,
      headers: requestHeaders,
      xml,
      timeout: 1000,
    });

    const { headers, body, statusCode } = response;
    const result = await parseStringSync(body);
    const data = _.get(
      result,
      'soap:Envelope.soap:Body.0.searchInternalAccountResponse.0.searchInternalAccountResult.0',
    );
    if (!data) throw Error('no data');

    const status = _.get(data, 'code.0');
    if (status === 'Failed') {
      const failureCode = _.get(data, 'failureCode.0');
      const message = _.get(data, 'message.0');
      throw Error(`${failureCode}: ${message}`);
    }

    const message = _.get(data, 'message.0');
    const count = _.get(data, 'pagination.0.totalItems.0');
    const pageSize = _.get(data, 'pagination.0.requestedPageSize.0');
    const pageIndex = _.get(data, 'pagination.0.requestedPageIndex.0');
    const parsed = _.map(_.get(data, 'accountList.0.BCeIDAccount'), parseAccount);

    return parsed;
  } catch (error) {
    log(String(error));
    return null;
  }
}
