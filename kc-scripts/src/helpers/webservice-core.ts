import {
  BCEID_SERVICE_BASIC_AUTH,
  BCEID_REQUESTER_IDIR_GUID,
  BCEID_SERVICE_ID_DEV,
  BCEID_SERVICE_ID_TEST,
  BCEID_SERVICE_ID_PROD,
} from 'config';

export function getWebServiceInfo({ env = 'dev' }) {
  const requestHeaders = {
    'Content-Type': 'text/xml;charset=UTF-8',
    authorization: `Basic ${BCEID_SERVICE_BASIC_AUTH}`,
  };

  const requesterIdirGuid = BCEID_REQUESTER_IDIR_GUID || '';

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

  return { requestHeaders, requesterIdirGuid, serviceUrl, serviceId };
}
