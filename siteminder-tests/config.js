require('dotenv').config();

const process = require('process');

const environment = process.env.ENVIRONMENT.toUpperCase() || 'DEV';

const cluster = process.env.CLUSTER.toUpperCase() || 'SILVER';

const fetchEnvParam = (param) => {
  return eval(`process.env.${environment}_${param}`);
};

module.exports = {
  fetchSsoUrl: function (provider) {
    let realm = eval(`process.env.${cluster}_${provider}_REALM`);

    if (cluster === 'SILVER') {
      return `https://${process.env.ENVIRONMENT}.oidc.gov.bc.ca/auth/admin/${realm}/console/`;
    } else {
      return `https://${process.env.ENVIRONMENT}.loginproxy.gov.bc.ca/auth/admin/${realm}/console/`;
    }
  },
  bceid_basic_config: {
    username: fetchEnvParam('BCEID_BASIC_USERNAME'),
    password: fetchEnvParam('BCEID_BASIC_PASSWORD'),
    user_identifier: fetchEnvParam('BCEID_BASIC_USER_IDENTIFIER'),
    display_name: fetchEnvParam('BCEID_BASIC_DISPLAYNAME'),
    email: fetchEnvParam('BCEID_BASIC_EMAIL'),
  },

  bceid_business_config: {
    username: fetchEnvParam('BCEID_BUSINESS_USERNAME'),
    password: fetchEnvParam('BCEID_BUSINESS_PASSWORD'),
    user_identifier: fetchEnvParam('BCEID_BUSINESS_USER_IDENTIFIER'),
    display_name: fetchEnvParam('BCEID_BUSINESS_DISPLAYNAME'),
    email: fetchEnvParam('BCEID_BUSINESS_EMAIL'),
    guid: fetchEnvParam('BCEID_BUSINESS_GUID'),
    legalname: fetchEnvParam('BCEID_BUSINESS_LEGALNAME'),
  },
};
