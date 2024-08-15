See below for the IDP specific claims available. For all IDPs the **Keycloak Generated Preferred Username** will be a unique identifier with a reference to the idp, e.g. `<user-guid>@idp-alias`.

## IDIR

  | Description                           | Standard Realm - Claim Name   |
  | ------------------------------------- | ----------------------------- |
  | First Name                            | given_name                    |
  | Last Name                             | family_name                   |
  | Email                                 | email                         |
  | Display Name                          | display_name                  |
  | Display Name                          | name                  |
  | IDIR Username                         | idir_username                 |
  | IDIR User GUID                        | idir_user_guid                |
  | Keycloak Generated Preferred Username | preferred_username            |

* Any other attribute can be fetched by the app itself using [IDIM Web Services](https://sminfo.gov.bc.ca/)

## IDIR MFA

  | Description                           | Standard Realm - Claim Name   |
  | ------------------------------------- | ----------------------------- |
  | First Name                            | given_name                    |
  | Last Name                             | family_name                   |
  | Email                                 | email                         |
  | Email                                 | user_principal_name           |
  | Display Name                          | display_name                  |
  | Display Name                          | name                          |
  | IDIR Username                         | idir_username                 |
  | IDIR User GUID                        | idir_user_guid                |
  | Keycloak Generated Preferred Username | preferred_username            |

## Basic BCeID

  | User Property/Attribute               | Standard Realm - Claim Name   |
  | ------------------------------------- | ----------------------------- |
  | Email                                 | email                         |
  | Display Name                          | display_name                  |
  | Display Name                          | given_name                    |
  | Display Name                          | name                    |
  | BCeID Username                        | bceid_username                |
  | BCeID User GUID                       | bceid_user_guid               |
  | Keycloak Generated Preferred Username | preferred_username            |

## Business BCeID

  | User Property/Attribute               | Standard Realm - Claim Name   |
  | ------------------------------------- | ----------------------------- |
  | Email                                 | email                         |
  | Display Name                          | display_name                  |
  | Display Name                          | given_name                    |
  | Display Name                          | name                          |
  | BCeID Username                        | bceid_username                |
  | BCeID User GUID                       | bceid_user_guid               |
  | Keycloak Generated Preferred Username | preferred_username            |
  | BCeID Business Guid                   | bceid_business_guid           |
  | BCeID Business Name                   | bceid_business_name           |

## BCeID Both

See above for claims depending on BCeID type selected by end user.

## GitHub Public

  | User Property/Attribute               | Standard Realm - Claim Name              |
  | ------------------------------------- | ---------------------------------------- |
  | Email                                 | email                                    |
  | Display Name                          | display_name                             |
  | Display Name                          | name                                     |
  | Display Name                          | given_name                               |
  | GitHub ID                             | github_id                                |
  | Keycloak Generated Preferred Username | preferred_username=`{{id}}@githubpublic` |
  | GitHub Username                       | github_username                          |
  | BCGov Github Membership               | org_verified                             |
  | BCGov Github Orgs                     | orgs                                     |

## GitHub BCGov

  | User Property/Attribute               | Standard Realm - Claim Name              |
  | ------------------------------------- | ---------------------------------------- |
  | Email                                 | email                                    |
  | Display Name                          | display_name                             |
  | Display Name                          | name                                     |
  | Display Name                          | given_name                               |
  | GitHub ID                             | github_id                                |
  | Keycloak Generated Preferred Username | preferred_username                       |
  | GitHub Username                       | github_username                          |
  | BCGov Github Membership               | org_verified                             |
  | BCGov Github Orgs                     | orgs                                     |

## BC Services Card

  | User Property/Attribute               | Standard Realm - Claim Name             |
  | ------------------------------------- | --------------------------------------- |
  | Keycloak Generated Preferred Username | preferred_username=`{{sub}}@<idp-name>` |

**Note:** Clients can request additional claims when creating their client in the CSS App. See [here](https://id.gov.bc.ca/oauth2/claim-types) for an up-to-date list of available claims. The BCSC sub will not be available for selection in the app, however the received token's sub or preferred_username claim can be used as an identifier.

## Digital Credential

  | User Property/Attribute                   | Standard Realm - Claim Name                    |
  | ----------------------------------------- | ---------------------------------------------- |
  | Keycloak Generated Preferred Username     | preferred_username                             |
  | Digital Credential Content (JSON)         | vc_presented_attributes                        |
  | The Presentation Request Configuration ID | pres_req_conf_id                               |

## Playground
[Try our playground to see what comes in the payload with your client integration](https://bcgov.github.io/keycloak-example-apps/)
