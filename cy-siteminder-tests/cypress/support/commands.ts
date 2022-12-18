/// <reference types="cypress" />

import { Interception } from 'cypress/types/net-stubbing'
import { promisify } from 'util'
import { recurse } from 'cypress-recurse'
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
      let assertion
      if (_.get(jsonResult, 'Response.ns2:Assertion.0')) {
        assertion = _.get(jsonResult, 'Response.ns2:Assertion.0')
      } else {
        assertion = _.get(jsonResult, 'ns5:Response.ns2:Assertion.0')
      }
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
      const attributes = _.reduce(
        statements,
        (ret: any, data: any) => ({ ...ret, ...getAttribute(data) }),
        {}
      )
      cy.wrap(updateSiteminderVals(attributes, idp)).as('samlattributes')
    })
  }
)

Cypress.Commands.add(
  'recordSamlAttributes',
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
      let assertion
      if (_.get(jsonResult, 'Response.ns2:Assertion.0')) {
        assertion = _.get(jsonResult, 'Response.ns2:Assertion.0')
      } else {
        assertion = _.get(jsonResult, 'ns5:Response.ns2:Assertion.0')
      }
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
      let attributes = {}
      attributes = _.reduce(
        statements,
        (ret: any, data: any) => ({ ...ret, ...getAttribute(data) }),
        {}
      )
      console.log(attributes)
      cy.wrap(Object.keys(attributes)).as('samlattributekeys')
    })
  }
)

Cypress.Commands.add('logout', () => {
  recurse(
    () => cy.get('.dropdown').should(() => {}),
    ($dropdown: any) => expect($dropdown).to.have.class('open'),
    {
      limit: 60,
      delay: 1000,
      timeout: 60000,
      post() {
        cy.get('.dropdown').click()
      },
    }
  )
  cy.contains('Sign Out').click()
  cy.clearCookies()
})

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

const updateSiteminderVals = (attributes: any, idp: string) => {
  const result: any = {}
  switch (idp) {
    case 'IDIR':
      result.guid = getAttribute('idir_user_guid', attributes, idp)
      result.username = getAttribute('idir_username', attributes, idp)
      result.email = getAttribute('email', attributes, idp)
      result.display_name = getAttribute('display_name', attributes, idp)
      result.firstname = getAttribute('first_name', attributes, idp)
      result.lastname = getAttribute('last_name', attributes, idp)
      break

    case 'BCEID_BASIC':
      result.guid = getAttribute('bceid_user_guid', attributes, idp)
      result.username = getAttribute('bceid_username', attributes, idp)
      result.email = getAttribute('email', attributes, idp)
      result.display_name = getAttribute('display_name', attributes, idp)
      break

    case 'BCEID_BUSINESS':
      result.guid = getAttribute('bceid_user_guid', attributes, idp)
      result.username = getAttribute('bceid_username', attributes, idp)
      result.email = getAttribute('email', attributes, idp)
      result.display_name = getAttribute('display_name', attributes, idp)
      result.business_guid = attributes['SMGOV_BUSINESSGUID']
      result.business_legalname = attributes['SMGOV_BUSINESSLEGALNAME']
      break

    case 'BCEID_BASIC_BUSINESS':
      result.guid = getAttribute('bceid_user_guid', attributes, idp)
      result.username = getAttribute('bceid_username', attributes, idp)
      result.email = getAttribute('email', attributes, idp)
      result.display_name = getAttribute('display_name', attributes, idp)
      result.business_guid = attributes['SMGOV_BUSINESSGUID']
      result.business_legalname = attributes['SMGOV_BUSINESSLEGALNAME']
      break

    default:
      throw new Error(`invalid idp ${idp}`)
  }

  return result
}

const getAttribute = (key: string, attributes: any, idp: string) => {
  if (!attributes[key])
    throw new Error(`[${idp}] ${key} not found in the list of attributes`)
  else return attributes[key]
}
