import { idp_config, fetchSsoUrl } from '../app-config/config'

describe('saml response attributes', () => {
  const environments = ['DEV', 'TEST', 'PROD']
  const idps = ['IDIR', 'BCEID', 'BCEID_BASIC', 'BCEID_BUSINESS', 'BCEID_BASIC_BUSINESS']
  it('fetch attributes for silver', () => {
    const cluster = 'SILVER'
    for (let y = 0; y < environments.length; y++) {
      const { idir_config, bceid_basic_config, bceid_business_config } = idp_config(
        cluster,
        environments[y]
      )
      for (let z = 0; z < idps.length; z++) {
        let idp = idps[z]
        if (['BCEID', 'BCEID_BASIC_BUSINESS'].includes(idps[z])) {
          idp = 'BCEID_BUSINESS'
        }
        let url = fetchSsoUrl(cluster, environments[y], idps[z])
        cy.recordSamlAttributes(
          url,
          eval(`${idp.toLowerCase()}_config.username`),
          eval(`${idp.toLowerCase()}_config.password`),
          idps[z]
        )
        cy.get('@samlattributekeys').then((data: any) => {
          cy.task(
            'log',
            `${JSON.stringify({
              cluster: cluster,
              environment: environments[y],
              idp: idps[z],
              url,
              attributes: data,
            })}`
          )
        })
        cy.logout()
      }
    }
  })

  it('fetch attributes for gold', () => {
    const cluster = 'GOLD'
    for (let y = 0; y < environments.length; y++) {
      const { idir_config, bceid_basic_config, bceid_business_config } = idp_config(
        cluster,
        environments[y]
      )
      for (let z = 0; z < idps.length; z++) {
        let idp = idps[z]
        if (idps[z] === 'BCEID') continue
        if (['BCEID', 'BCEID_BASIC_BUSINESS'].includes(idps[z])) {
          idp = 'BCEID_BUSINESS'
        }
        let url = fetchSsoUrl(cluster, environments[y], idps[z])
        cy.recordSamlAttributes(
          url,
          eval(`${idp.toLowerCase()}_config.username`),
          eval(`${idp.toLowerCase()}_config.password`),
          idps[z]
        )
        cy.get('@samlattributekeys').then((data: any) => {
          cy.task(
            'log',
            `${JSON.stringify({
              cluster: cluster,
              environment: environments[y],
              idp: idps[z],
              url,
              attributes: data,
            })}`
          )
        })
        cy.logout()
      }
    }
  })
})
