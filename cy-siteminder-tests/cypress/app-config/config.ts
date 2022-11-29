const environment = Cypress.env('ENVIRONMENT').toUpperCase() || 'DEV'

const cluster = Cypress.env('CLUSTER').toUpperCase() || 'SILVER'

const fetchEnvParam = (param: string) => {
  // Silver dev uses same credentials as test
  if (cluster === 'SILVER' && environment === 'DEV') return Cypress.env(`TEST_${param}`)
  return Cypress.env(`${environment}_${param}`)
}

export const fetchSsoUrl = (provider: string) => {
  let realm = Cypress.env(`${cluster}_${provider}_REALM`)
  if (cluster === 'SILVER') {
    return `https://${
      environment === 'PROD' ? '' : environment.toLowerCase() + '.'
    }oidc.gov.bc.ca/auth/admin/${realm}/console/`
  } else {
    return `https://${
      environment === 'PROD' ? '' : environment.toLowerCase() + '.'
    }loginproxy.gov.bc.ca/auth/admin/${realm}/console/`
  }
}

export const idir_config = {
  username: Cypress.env('IDIR_USERNAME'),
  password: Cypress.env('IDIR_PASSWORD'),
  user_identifier: Cypress.env('IDIR_USER_IDENTIFIER'),
  display_name: Cypress.env('IDIR_DISPLAYNAME'),
  email: Cypress.env('IDIR_EMAIL'),
  firstname: Cypress.env('IDIR_FIRSTNAME'),
  lastname: Cypress.env('IDIR_LASTNAME'),
}

export const bceid_basic_config = {
  username: fetchEnvParam('BCEID_BASIC_USERNAME'),
  password: fetchEnvParam('BCEID_BASIC_PASSWORD'),
  user_identifier: fetchEnvParam('BCEID_BASIC_USER_IDENTIFIER'),
  display_name: fetchEnvParam('BCEID_BASIC_DISPLAYNAME'),
  email: fetchEnvParam('BCEID_BASIC_EMAIL'),
}

export const bceid_business_config = {
  username: fetchEnvParam('BCEID_BUSINESS_USERNAME'),
  password: fetchEnvParam('BCEID_BUSINESS_PASSWORD'),
  user_identifier: fetchEnvParam('BCEID_BUSINESS_USER_IDENTIFIER'),
  display_name: fetchEnvParam('BCEID_BUSINESS_DISPLAYNAME'),
  email: fetchEnvParam('BCEID_BUSINESS_EMAIL'),
  guid: fetchEnvParam('BCEID_BUSINESS_GUID'),
  legalname: fetchEnvParam('BCEID_BUSINESS_LEGALNAME'),
}
