/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing'
import { promisify } from 'util'
const parseString = require('xml2js').parseString
const parseStringSync = promisify(parseString)
const Buffer = require('buffer').Buffer
const _ = require('lodash')

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

Cypress.Commands.add('login', (url: string, username: string, password: string) => {
  cy.visit(url)
  cy.get('[id=user]').click().type(username)
  cy.get('[id=password]').click().type(password)
  cy.get('[name=btnSubmit]').click()
})
Cypress.Commands.add(
  'testsite',
  (url: string, username: string, password: string, idp: string) => {
    cy.login(url, username, password)
    if (idp !== 'IDIR') {
      cy.get('input[value=Continue]').click()
    }

    cy.intercept('POST', '**/endpoint').as('samlresponse')
    cy.wait('@samlresponse').then(async (interception: Interception) => {
      const entries = parseFormData(interception.request.body)
      const cleanSamlResponse = entries.SAMLResponse.replace(/(\r\n|\n|\r)/gm, '')
      const decodedXML = decodeBase64(cleanSamlResponse)
      const jsonResult = await parseStringSync(decodedXML)
      const assertion = _.get(jsonResult, 'ns5:Response.ns2:Assertion.0')
      const getAttributea = (data: any) => ({})

      const getAttribute = (data: any) => {
        let val
        if (typeof _.get(data, 'ns2:AttributeValue.0') === 'object') {
          val = Object.values(_.get(data, 'ns2:AttributeValue.0'))[0]
        } else {
          val = _.get(data, 'ns2:AttributeValue.0')
        }
        return {
          [_.get(data, '$.Name')]: val,
        }
      }
      const statements = _.get(assertion, 'ns2:AttributeStatement.0.ns2:Attribute')
      cy.log(JSON.stringify(statements))
      const attributes = _.reduce(
        statements,
        (ret: any, data: any) => ({ ...ret, ...getAttribute(data) }),
        {}
      )
      cy.wrap(updateSiteminderVals(attributes)).as('samlattributes')
    })
  }
)

const parseFormData = (data: any) => {
  const vars = data.split('&')
  const map = Object.create(null)
  for (let i = 0; i < vars.length; i++) {
    let pair = vars[i].split('=')
    if (pair.length === 2) {
      pair = pair.map(decodeURIComponent)
      map[pair[0]] = pair[1]
    }
  }

  return map
}

const decodeBase64 = (data: any) => {
  let buff = Buffer.from(data, 'base64')
  return buff.toString('ascii')
}

const updateSiteminderVals = (attributes: any) => {
  const result: any = {}
  result.guid = attributes['useridentifier'] ?? attributes['SMGOV_USERGUID'] ?? ''
  result.username = attributes['username']
  result.email = attributes['email']
  result.display_name =
    attributes['displayname'] ??
    attributes['displayName'] ??
    attributes['SMGOV_USERDISPLAYNAME'] ??
    ''
  result.firstname = attributes['firstname'] ?? ''
  result.lastname = attributes['lastname'] ?? ''
  result.business_guid = attributes['SMGOV_BUSINESSGUID'] ?? ''
  result.business_legalname = attributes['SMGOV_BUSINESSLEGALNAME'] ?? ''
  cy.log(JSON.stringify(result))
  return result
}
