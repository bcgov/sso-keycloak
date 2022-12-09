import { idp_config, fetchSsoUrl } from '../app-config/config'

describe('saml response attributes', () => {
  it('fetch attributes by cluster, idp and environment', () => {
    const clusters = ['SILVER', 'GOLD']
    const environments = ['DEV', 'TEST', 'PROD']
    const idps = [
      'IDIR',
      'BCEID',
      'BCEID_BASIC',
      'BCEID_BUSINESS',
      'BCEID_BASIC_BUSINESS',
    ]

    for (let x = 0; x < clusters.length; x++) {
      for (let y = 0; y < environments.length; y++) {
        const {
          idir_config,
          bceid_basic_config,
          bceid_business_config,
          bceid_basic_business_config,
        } = idp_config(clusters[x], environments[y])
        for (let z = 0; z < idps.length; z++) {
          let idp = idps[z]
          if (clusters[x] === 'GOLD' && idps[z] === 'BCEID') continue
          if (['BCEID', 'BCEID_BASIC_BUSINESS'].includes(idps[z])) {
            idp = 'BCEID_BUSINESS'
          }
          let url = fetchSsoUrl(clusters[x], environments[y], idps[z])
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
                cluster: clusters[x],
                environment: environments[y],
                idp: idps[z],
                url,
                attributes: data,
              })}`
            )
          })
          cy.logout()
          cy.wait(2000)
        }
      }
    }
  })
})
