# Gold Migration Guide

## IDP Attributes & Mappers

### IDIR

**Note**:

- In Gold, the SAML payload contains `<NameID>`, whose value is same as that of the `idir_user_guid` will be mapped to `username` of the logging in user inside parent realm

- In Silver

  | User Property/Attribute               | IDP - SAML Payload(\*) | Parent Realm Mapper | Custom/Standard Realm Mapper           | Standard Realm - OIDC Payload |
  | ------------------------------------- | ---------------------- | ------------------- | -------------------------------------- | ----------------------------- |
  | First Name                            | first_name             | given_name          | given_name                             | given_name                    |
  | Last Name                             | last_name              | family_name         | family_name                            | family_name                   |
  | Email                                 | email                  | email               | email                                  | email                         |
  | Display Name                          | display_name           | displayName         | displayName                            | display_name                  |
  | Keycloak Generated Preferred Username | idir_username          | preferred_username  | preferred_username=`{{username}}@idir` | preferred_username            |
  | IDIR User GUID                        | idir_user_guid         | idir_userid         | idir_userid, idir_user_guid            | idir_userid                   |

- In Gold

  | User Property/Attribute               | IDP - SAML Payload(\*) | Parent Realm Mapper | Custom/Standard Realm Mapper                     | Standard Realm - OIDC Payload |
  | ------------------------------------- | ---------------------- | ------------------- | ------------------------------------------------ | ----------------------------- |
  | First Name                            | first_name             | given_name          | given_name                                       | given_name                    |
  | Last Name                             | last_name              | family_name         | family_name                                      | family_name                   |
  | Email                                 | email                  | email               | email                                            | email                         |
  | Display Name                          | display_name           | display_name        | display_name                                     | display_name                  |
  | IDIR Username                         | idir_username          | idir_username       | idir_username                                    | idir_username                 |
  | IDIR User GUID                        | idir_user_guid         | idir_user_guid      | idir_user_guid                                   | idir_user_guid                |
  | Keycloak Generated Preferred Username | idir_user_guid         | preferred_username  | preferred_username=`{{preferred_username}}@idir` | preferred_username            |

### Basic BCeID

- In Silver

  | User Property/Attribute               | IDP - SAML Payload(\*) | Parent Realm Mapper | Custom/Standard Realm Mapper                  | Standard Realm - OIDC Payload |
  | ------------------------------------- | ---------------------- | ------------------- | --------------------------------------------- | ----------------------------- |
  | Email                                 | email                  | email               | email                                         | email                         |
  | Display Name                          | display_name           | displayName         | displayName                                   | display_name                  |
  | Keycloak Generated Preferred Username | bceid_username         | preferred_username  | preferred_username=`{{username}}@bceid-basic` | preferred_username            |
  | BCeID User GUID                       | bceid_user_guid        | bceid_userid        | bceid_userid                                  | bceid_userid                  |

- In Gold

  | User Property/Attribute               | IDP - SAML Payload(\*) | Parent Realm Mapper | Custom/Standard Realm Mapper                        | Standard Realm - OIDC Payload |
  | ------------------------------------- | ---------------------- | ------------------- | --------------------------------------------------- | ----------------------------- |
  | Email                                 | email                  | email               | email                                               | email                         |
  | Display Name                          | display_name           | display_name        | display_name                                        | display_name                  |
  | Display Name                          | display_name           | display_name        | given_name                                          | given_name                    |
  | BCeID Username                        | bceid_username         | bceid_username      | bceid_username                                      | bceid_username                |
  | BCeID Username                        | bceid_username         | bceid_username      | family_name                                         | family_name                   |
  | BCeID User GUID                       | bceid_user_guid        | bceid_user_guid     | bceid_user_guid                                     | bceid_user_guid               |
  | Keycloak Generated Preferred Username | bceid_user_guid        | preferred_username  | preferred_username=`{{bceid_user_guid}}@bceidbasic` | preferred_username            |

### Business BCeID

- In Silver

  | User Property/Attribute               | IDP - SAML Payload(\*)  | Parent Realm Mapper | Custom/Standard Realm Mapper                     | Standard Realm - OIDC Payload                    |
  | ------------------------------------- | ----------------------- | ------------------- | ------------------------------------------------ | ------------------------------------------------ |
  | Email                                 | email                   | email               | email                                            | email                                            |
  | BCeID User Guid                       | bceid_user_guid         | bceid_userid        | bceid_userid                                     | bceid_userid                                     |
  | Display Name                          | display_name            | displayName         | displayName                                      | display_name                                     |
  | BCeID Business Guid                   | SMGOV_BUSINESSGUID      | bceid_business_guid | bceid_business_guid                              | bceid_business_guid                              |
  | BCeID Business Name                   | SMGOV_BUSINESSLEGALNAME | bceid_business_name | bceid_business_name                              | bceid_business_name                              |
  | Keycloak Generated Preferred Username | bceid_username          | preferred_username  | preferred_username=`{{username}}@bceid-business` | preferred_username=`{{username}}@bceid-business` |

- In Gold

  | User Property/Attribute               | IDP - SAML Payload(\*)  | Parent Realm Mapper | Custom/Standard Realm Mapper                           | Standard Realm - OIDC Payload |
  | ------------------------------------- | ----------------------- | ------------------- | ------------------------------------------------------ | ----------------------------- |
  | Email                                 | email                   | email               | email                                                  | email                         |
  | Display Name                          | display_name            | display_name        | display_name                                           | display_name                  |
  | Display Name                          | display_name            | display_name        | given_name                                             | given_name                    |
  | BCeID Username                        | bceid_username          | bceid_username      | bceid_username                                         | bceid_username                |
  | BCeID Username                        | bceid_username          | bceid_username      | family_name                                            | family_name                   |
  | BCeID User GUID                       | bceid_user_guid         | bceid_user_guid     | bceid_user_guid                                        | bceid_user_guid               |
  | Keycloak Generated Preferred Username | bceid_user_guid         | preferred_username  | preferred_username=`{{bceid_user_guid}}@bceidbusiness` | preferred_username            |
  | BCeID Business Guid                   | SMGOV_BUSINESSGUID      | bceid_business_guid | bceid_business_guid                                    | bceid_business_guid           |
  | BCeID Business Name                   | SMGOV_BUSINESSLEGALNAME | bceid_business_name | bceid_business_name                                    | bceid_business_name           |

### BCeID Both

- In Silver

  | User Property/Attribute               | IDP - SAML Payload(\*)  | Parent Realm Mapper | Custom/Standard Realm Mapper                               | Standard Realm - OIDC Payload                              |
  | ------------------------------------- | ----------------------- | ------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- |
  | Email                                 | email                   | email               | email                                                      | email                                                      |
  | BCeID User Guid                       | SMGOV_USERGUID          | bceid_userid        | bceid_userid                                               | bceid_userid                                               |
  | Display Name                          | SMGOV_USERDISPLAYNAME   | displayName         | displayName                                                | display_name                                               |
  | BCeID Business Guid                   | SMGOV_BUSINESSGUID      | bceid_business_guid | bceid_business_guid                                        | bceid_business_guid                                        |
  | BCeID Business Name                   | SMGOV_BUSINESSLEGALNAME | bceid_business_name | bceid_business_name                                        | bceid_business_name                                        |
  | Keycloak Generated Preferred Username | username                | preferred_username  | preferred_username=`{{username}}@bceid-basic-and-business` | preferred_username=`{{username}}@bceid-basic-and-business` |

- In Gold

  | User Property/Attribute               | IDP - SAML Payload(\*)  | Parent Realm Mapper | Custom/Standard Realm Mapper                       | Standard Realm - OIDC Payload |
  | ------------------------------------- | ----------------------- | ------------------- | -------------------------------------------------- | ----------------------------- |
  | Email                                 | email                   | email               | email                                              | email                         |
  | Display Name                          | display_name            | display_name        | display_name                                       | display_name                  |
  | Display Name                          | display_name            | display_name        | given_name                                         | given_name                    |
  | BCeID Username                        | bceid_username          | bceid_username      | bceid_username                                     | bceid_username                |
  | BCeID Username                        | bceid_username          | bceid_username      | family_name                                        | family_name                   |
  | BCeID User GUID                       | bceid_user_guid         | bceid_user_guid     | bceid_user_guid                                    | bceid_user_guid               |
  | Keycloak Generated Preferred Username | bceid_user_guid         | preferred_username  | preferred_username=`{{bceid_user_guid}}@bceidboth` | preferred_username            |
  | BCeID Business Guid                   | SMGOV_BUSINESSGUID      | bceid_business_guid | bceid_business_guid                                | bceid_business_guid           |
  | BCeID Business Name                   | SMGOV_BUSINESSLEGALNAME | bceid_business_name | bceid_business_name                                | bceid_business_name           |

### GitHub Public

- In Silver

  |                                       | IDP     | Parent Realm       | Custom Realm, Standard Realm          | Standard Realm - OIDC Payload         |
  | ------------------------------------- | ------- | ------------------ | ------------------------------------- | ------------------------------------- |
  | Email                                 | email   | email              | email                                 | email                                 |
  | First Name                            | name[0] | given_name         | given_name                            | given_name                            |
  | Last Name                             | name[1] | family_name        | family_name                           | family_name                           |
  | GitHub ID                             | id      | github_id          | github_id                             | github_id                             |
  | Keycloak Generated Preferred Username | login   | preferred_username | preferred_username=`{{login}}@github` | preferred_username=`{{login}}@github` |

- In Gold

  | User Property/Attribute               | IDP - SAML Payload(\*) | Parent Realm Mapper | Custom/Standard Realm Mapper             | Standard Realm - OIDC Payload            |
  | ------------------------------------- | ---------------------- | ------------------- | ---------------------------------------- | ---------------------------------------- |
  | Email                                 | email                  | email               | email                                    | email                                    |
  | Display Name                          | name                   | display_name        | display_name                             | display_name                             |
  | Display Name                          | name                   | display_name        | display_name                             | name                                     |
  | GitHub ID                             | id                     | github_id           | github_id                                | github_id                                |
  | Keycloak Generated Preferred Username | id                     | preferred_username  | preferred_username=`{{id}}@githubpublic` | preferred_username=`{{id}}@githubpublic` |
  | GitHub Username                       | login                  | github_username     | github_username                          | github_username                          |
  | BCGov Github Membership               |                        | org_verified        | org_verified                             | org_verified                             |
  | BCGov Github Orgs                     |                        | orgs                | orgs                                     | orgs                                     |

### GitHub BCGov

- In Gold

  | User Property/Attribute               | IDP - SAML Payload(\*) | Parent Realm Mapper | Custom/Standard Realm Mapper            | Standard Realm - OIDC Payload           |
  | ------------------------------------- | ---------------------- | ------------------- | --------------------------------------- | --------------------------------------- |
  | Email                                 | email                  | email               | email                                   | email                                   |
  | Display Name                          | name                   | display_name        | display_name                            | display_name                            |
  | Display Name                          | name                   | display_name        | display_name                            | name                                    |
  | GitHub ID                             | id                     | github_id           | github_id                               | github_id                               |
  | Keycloak Generated Preferred Username | id                     | preferred_username  | preferred_username=`{{id}}@githubbcgov` | preferred_username=`{{id}}@githubbcgov` |
  | GitHub Username                       | login                  | github_username     | github_username                         | github_username                         |
  | BCGov Github Membership               |                        | org_verified        | org_verified                            | org_verified                            |
  | BCGov Github Orgs                     |                        | orgs                | orgs                                    | orgs                                    |

  - `org_verified`: `true` if the authenticated user has `bcgov` GitHub org membership, otherwise, `false`.
  - `orgs`: `space-separated` list of BCGov GitHub org that the authenticated user has a membership of.
