/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
    login(url: string, username: string, password: string): Chainable<void>
    testsite(
      url: string,
      username: string,
      password: string,
      idp: string
    ): Chainable<void>
    recordSamlAttributes(
      url: string,
      username: string,
      password: string,
      idp: string
    ): Chainable<void>
    logout(): Chainable<void>
  }
}
