import { idp_config, fetchSsoUrl } from '../app-config/config'

describe('saml response attributes', () => {
  const clusters = ['SILVER', 'GOLD']
  const environments = ['DEV', 'TEST', 'PROD']
  const idps = ['IDIR', 'BCEID', 'BCEID_BASIC', 'BCEID_BUSINESS', 'BCEID_BASIC_BUSINESS']
  const result: {
    cluster: string
    environment: string
    idp: string
    url: string
    attributes: any
  }[] = []

  after(() => {
    cy.task('log', `${JSON.stringify(result)}`)
  })

  for (let x = 0; x < clusters.length; x++) {
    for (let y = 0; y < environments.length; y++) {
      const { idir_config, bceid_basic_config, bceid_business_config } = idp_config(
        clusters[x],
        environments[y]
      )
      for (let z = 0; z < idps.length; z++) {
        if (clusters[x] === 'GOLD' && idps[z] === 'BCEID') continue
        let idp = idps[z]
        it(`Fetching attributes for ${clusters[x]} - ${idp} - ${environments[y]}`, () => {
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
            result.push({
              cluster: clusters[x],
              environment: environments[y],
              idp: idps[z],
              url,
              attributes: data,
            })
          })
        })
      }
    }
  }
})
