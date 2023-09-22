import { idp_config, fetchSsoUrl } from '../app-config/config'

describe('siteminder tests', () => {
  const env = Cypress.env('ENVIRONMENT').toUpperCase() || 'DEV'
  const ocp = Cypress.env('CLUSTER').toUpperCase() || 'SILVER'
  const {
    idir_config,
    bceid_basic_config,
    bceid_business_config,
    bceid_basic_business_config,
  } = idp_config(ocp, env)
  it('IDIR', () => {
    cy.testsite(
      fetchSsoUrl(ocp, env, 'IDIR'),
      idir_config.username,
      idir_config.password,
      'IDIR'
    )
    cy.get('@samlattributes').then((data: any) => {
      assert.deepEqual(data.guid, idir_config.user_identifier, 'user_identifier')
      assert.deepEqual(data.display_name, idir_config.display_name, 'display_name')
      assert.deepEqual(data.username, idir_config.username, 'username')
      assert.deepEqual(data.email, idir_config.email, 'email')
      assert.deepEqual(data.firstname, idir_config.firstname, 'firstname')
      assert.deepEqual(data.lastname, idir_config.lastname, 'lastname')
    })
  })

  it('Basic BCeID', () => {
    cy.testsite(
      fetchSsoUrl(ocp, env, 'BCEID_BASIC'),
      bceid_basic_config.username,
      bceid_basic_config.password,
      'BCEID_BASIC'
    )
    cy.get('@samlattributes').then((data: any) => {
      assert.deepEqual(data.guid, bceid_basic_config.user_identifier, 'user_identifier')
      assert.deepEqual(data.display_name, bceid_basic_config.display_name, 'display_name')
      assert.deepEqual(data.username, bceid_basic_config.username, 'username')
      assert.deepEqual(data.email, bceid_basic_config.email, 'email')
    })
  })

  it('Business BCeID', () => {
    cy.testsite(
      fetchSsoUrl(ocp, env, 'BCEID_BUSINESS'),
      bceid_business_config.username,
      bceid_business_config.password,
      'BCEID_BUSINESS'
    )
    cy.get('@samlattributes').then((data: any) => {
      assert.deepEqual(
        data.guid,
        bceid_business_config.user_identifier,
        'user_identifier'
      )
      assert.deepEqual(
        data.display_name,
        bceid_business_config.display_name,
        'display_name'
      )
      assert.deepEqual(data.username, bceid_business_config.username, 'username')
      assert.deepEqual(data.email, bceid_business_config.email, 'email')
      assert.deepEqual(data.business_guid, bceid_business_config.guid, 'business guid')
      assert.deepEqual(
        data.business_legalname,
        bceid_business_config.legalname,
        'business legalname'
      )
    })
  })

  it('Basic/Business BCeID', () => {
    cy.testsite(
      fetchSsoUrl(ocp, env, 'BCEID_BASIC_BUSINESS'),
      bceid_business_config.username,
      bceid_business_config.password,
      'BCEID_BASIC_BUSINESS'
    )
    cy.get('@samlattributes').then((data: any) => {
      assert.deepEqual(
        data.guid,
        bceid_business_config.user_identifier,
        'user_identifier'
      )
      assert.deepEqual(
        data.display_name,
        bceid_business_config.display_name,
        'display_name'
      )
      assert.deepEqual(data.username, bceid_business_config.username, 'username')
      assert.deepEqual(data.email, bceid_business_config.email, 'email')
      assert.equal(data.business_guid, bceid_business_config.guid, 'business guid')
      assert.deepEqual(
        data.business_legalname,
        bceid_business_config.legalname,
        'business legalname'
      )
    })
  })

  if (ocp === 'SILVER') {
    it('BCeID', () => {
      cy.testsite(
        fetchSsoUrl(ocp, env, 'BCEID'),
        bceid_business_config.username,
        bceid_business_config.password,
        'BCEID'
      )
      cy.get('@samlattributes').then((data: any) => {
        assert.deepEqual(
          data.guid,
          bceid_business_config.user_identifier,
          'user_identifier'
        )
        assert.deepEqual(
          data.display_name,
          bceid_business_config.display_name,
          'display_name'
        )
        assert.deepEqual(data.username, bceid_business_config.username, 'username')
        assert.deepEqual(data.email, bceid_business_config.email, 'email')
        assert.equal(data.business_guid, bceid_business_config.guid, 'business guid')
        assert.deepEqual(
          data.business_legalname,
          bceid_business_config.legalname,
          'business legalname'
        )
      })
    })
  }
})
