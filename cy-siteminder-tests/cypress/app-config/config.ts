const fetchEnvParam = (ocp: string, env: string, param: string) => {
  // Silver dev uses same credentials as test
  if (ocp === 'SILVER' && env === 'DEV') return Cypress.env(`TEST_${param}`)
  return Cypress.env(`${env}_${param}`)
}

export const fetchSsoUrl = (cluster: string, environment: string, provider: string) => {
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

export const idp_config = (cluster: string, environment: string) => {
  return {
    idir_config: {
      username: Cypress.env('IDIR_USERNAME'),
      password: Cypress.env('IDIR_PASSWORD'),
      user_identifier: Cypress.env('IDIR_USER_IDENTIFIER'),
      display_name: Cypress.env('IDIR_DISPLAYNAME'),
      email: Cypress.env('IDIR_EMAIL'),
      firstname: Cypress.env('IDIR_FIRSTNAME'),
      lastname: Cypress.env('IDIR_LASTNAME'),
    },
    bceid_basic_config: {
      username: fetchEnvParam(cluster, environment, 'BCEID_BASIC_USERNAME'),
      password: fetchEnvParam(cluster, environment, 'BCEID_BASIC_PASSWORD'),
      user_identifier: fetchEnvParam(cluster, environment, 'BCEID_BASIC_USER_IDENTIFIER'),
      display_name: fetchEnvParam(cluster, environment, 'BCEID_BASIC_DISPLAYNAME'),
      email: fetchEnvParam(cluster, environment, 'BCEID_BASIC_EMAIL'),
    },
    bceid_business_config: {
      username: fetchEnvParam(cluster, environment, 'BCEID_BUSINESS_USERNAME'),
      password: fetchEnvParam(cluster, environment, 'BCEID_BUSINESS_PASSWORD'),
      user_identifier: fetchEnvParam(
        cluster,
        environment,
        'BCEID_BUSINESS_USER_IDENTIFIER'
      ),
      display_name: fetchEnvParam(cluster, environment, 'BCEID_BUSINESS_DISPLAYNAME'),
      email: fetchEnvParam(cluster, environment, 'BCEID_BUSINESS_EMAIL'),
      guid: fetchEnvParam(cluster, environment, 'BCEID_BUSINESS_GUID'),
      legalname: fetchEnvParam(cluster, environment, 'BCEID_BUSINESS_LEGALNAME'),
    },
    bceid_basic_business_config: {
      username: fetchEnvParam(cluster, environment, 'BCEID_BASIC_BUSINESS_USERNAME'),
      password: fetchEnvParam(cluster, environment, 'BCEID_BASIC_BUSINESS_PASSWORD'),
      user_identifier: fetchEnvParam(
        cluster,
        environment,
        'BCEID_BASIC_BUSINESS_USER_IDENTIFIER'
      ),
      display_name: fetchEnvParam(
        cluster,
        environment,
        'BCEID_BASIC_BUSINESS_DISPLAYNAME'
      ),
      email: fetchEnvParam(cluster, environment, 'BCEID_BASIC_BUSINESS_EMAIL'),
      guid: fetchEnvParam(cluster, environment, 'BCEID_BASIC_BUSINESS_GUID'),
      legalname: fetchEnvParam(cluster, environment, 'BCEID_BASIC_BUSINESS_LEGALNAME'),
    },
  }
}
