# Gold Migration Guide

## IDP Attributes & Mappers

### IDIR

- In Silver

  |                | IDP            | Parent Realm       | Custom Realm, Standard Realm           | Standard Realm - OIDC Payload          |
  | -------------- | -------------- | ------------------ | -------------------------------------- | -------------------------------------- |
  | First Name     | firstname      | given_name         | given_name                             | given_name                             |
  | Last Name      | lastname       | family_name        | family_name                            | family_name                            |
  | Email          | email          | email              | email                                  | email                                  |
  | Display Name   | displayname    | displayName        | displayName                            | display_name                           |
  | IDIR User ID   | username       | preferred_username | preferred_username=`{{username}}@idir` | preferred_username=`{{username}}@idir` |
  | IDIR User GUID | useridentifier | idir_userid        | idir_userid, idir_user_guid            | idir_userid                            |

- In Gold

  |                | IDP            | Parent Realm       | Standard Realm                               | Standard Realm - OIDC Payload                |
  | -------------- | -------------- | ------------------ | -------------------------------------------- | -------------------------------------------- |
  | First Name     | firstname      | given_name         | given_name                                   | given_name                                   |
  | Last Name      | lastname       | family_name        | family_name                                  | family_name                                  |
  | Email          | email          | email              | email                                        | email                                        |
  | Display Name   | displayname    | display_name       | display_name                                 | display_name                                 |
  | IDIR User ID   | username       | idir_username      | idir_username                                | idir_username                                |
  | IDIR User GUID | useridentifier | idir_user_guid     | idir_user_guid                               | idir_user_guid                               |
  |                |                | preferred_username | preferred_username=`{{useridentifier}}@idir` | preferred_username=`{{useridentifier}}@idir` |

### Basic BCeID

- In Silver

  |                 | IDP            | Parent Realm       | Custom Realm, Standard Realm                  | Standard Realm - OIDC Payload                 |
  | --------------- | -------------- | ------------------ | --------------------------------------------- | --------------------------------------------- |
  | Email           | email          | email              | email                                         | email                                         |
  | Display Name    | displayName    | displayName        | displayName                                   | display_name                                  |
  | BCeID User ID   | username       | preferred_username | preferred_username=`{{username}}@bceid-basic` | preferred_username=`{{username}}@bceid-basic` |
  | BCeID User GUID | useridentifier | bceid_userid       | bceid_userid                                  | bceid_userid                                  |

- In Gold

  |                 | IDP            | Parent Realm       | Standard Realm                                     | Standard Realm - OIDC Payload                      |
  | --------------- | -------------- | ------------------ | -------------------------------------------------- | -------------------------------------------------- |
  | Email           | email          | email              | email                                              | email                                              |
  | Display Name    | displayName    | display_name       | display_name                                       | display_name                                       |
  | BCeID User ID   | username       | bceid_username     | bceid_username                                     | bceid_username                                     |
  | BCeID User GUID | useridentifier | bceid_user_guid    | bceid_user_guid                                    | bceid_user_guid                                    |
  |                 |                | preferred_username | preferred_username=`{{useridentifier}}@bceidbasic` | preferred_username=`{{useridentifier}}@bceidbasic` |

### Business BCeID

- In Silver

  |                     | IDP                     | Parent Realm        | Custom Realm, Standard Realm                     | Standard Realm - OIDC Payload                    |
  | ------------------- | ----------------------- | ------------------- | ------------------------------------------------ | ------------------------------------------------ |
  | Email               | email                   | email               | email                                            | email                                            |
  | BCeID User Guid     | SMGOV_USERGUID          | bceid_userid        | bceid_userid                                     | bceid_userid                                     |
  | BCeID User Name     | SMGOV_USERDISPLAYNAME   | displayName         | displayName                                      | display_name                                     |
  | BCeID Business Guid | SMGOV_BUSINESSGUID      | bceid_business_guid | bceid_business_guid                              | bceid_business_guid                              |
  | BCeID Business Name | SMGOV_BUSINESSLEGALNAME | bceid_business_name | bceid_business_name                              | bceid_business_name                              |
  | BCeID Business ID   | username                | preferred_username  | preferred_username=`{{username}}@bceid-business` | preferred_username=`{{username}}@bceid-business` |

- In Gold

  |                     | IDP                     | Parent Realm        | Custom Realm, Standard Realm                          | Standard Realm - OIDC Payload                         |
  | ------------------- | ----------------------- | ------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
  | Email               | email                   | email               | email                                                 | email                                                 |
  | BCeID User Guid     | SMGOV_USERGUID          | bceid_user_guid     | bceid_user_guid                                       | bceid_user_guid                                       |
  |                     |                         | preferred_username  | preferred_username=`{{SMGOV_USERGUID}}@bceidbusiness` | preferred_username=`{{SMGOV_USERGUID}}@bceidbusiness` |
  | BCeID User Name     | SMGOV_USERDISPLAYNAME   | display_name        | display_name                                          | display_name                                          |
  | BCeID Business Guid | SMGOV_BUSINESSGUID      | bceid_business_guid | bceid_business_guid                                   | bceid_business_guid                                   |
  | BCeID Business Name | SMGOV_BUSINESSLEGALNAME | bceid_business_name | bceid_business_name                                   | bceid_business_name                                   |
  | BCeID Business ID   | username                | bceid_username      | bceid_username                                        | bceid_username                                        |

### GitHub Public

- In Silver

  |                 | IDP     | Parent Realm       | Custom Realm, Standard Realm          | Standard Realm - OIDC Payload         |
  | --------------- | ------- | ------------------ | ------------------------------------- | ------------------------------------- |
  | Email           | email   | email              | email                                 | email                                 |
  | First Name      | name[0] | given_name         | given_name                            | given_name                            |
  | Last Name       | name[1] | family_name        | family_name                           | family_name                           |
  | GitHub ID       | id      | github_id          | github_id                             | github_id                             |
  | GitHub Username | login   | preferred_username | preferred_username=`{{login}}@github` | preferred_username=`{{login}}@github` |

- In Gold

  |                         | IDP     | Parent Realm       | Custom Realm, Standard Realm             | Standard Realm - OIDC Payload            |
  | ----------------------- | ------- | ------------------ | ---------------------------------------- | ---------------------------------------- |
  | Email                   | email   | email              | email                                    | email                                    |
  | First Name              | name[0] | given_name         | given_name                               | given_name                               |
  | Last Name               | name[1] | family_name        | family_name                              | family_name                              |
  | Full Name               | name    | display_name       | display_name                             | display_name                             |
  | GitHub ID               | id      | github_id          | github_id                                | github_id                                |
  |                         |         | preferred_username | preferred_username=`{{id}}@githubpublic` | preferred_username=`{{id}}@githubpublic` |
  | GitHub Username         | login   | github_username    | github_username                          | github_username                          |
  | BCGov Github Membership |         | org_verified       | org_verified                             | org_verified                             |
  | BCGov Github Orgs       |         | orgs               | orgs                                     | orgs                                     |

### GitHub BCGov

- In Gold

  |                         | IDP     | Parent Realm       | Custom Realm, Standard Realm            | Standard Realm - OIDC Payload           |
  | ----------------------- | ------- | ------------------ | --------------------------------------- | --------------------------------------- |
  | Email                   | email   | email              | email                                   | email                                   |
  | First Name              | name[0] | given_name         | given_name                              | given_name                              |
  | Last Name               | name[1] | family_name        | family_name                             | family_name                             |
  | Full Name               | name    | display_name       | display_name                            | display_name                            |
  | GitHub ID               | id      | github_id          | github_id                               | github_id                               |
  |                         |         | preferred_username | preferred_username=`{{id}}@githubbcgov` | preferred_username=`{{id}}@githubbcgov` |
  | GitHub Username         | login   | github_username    | github_username                         | github_username                         |
  | BCGov Github Membership |         | org_verified       | org_verified                            | org_verified                            |
  | BCGov Github Orgs       |         | orgs               | orgs                                    | orgs                                    |

  - `org_verified`: `true` if the authenticated user has `bcgov` GitHub org membership, otherwise, `false`.
  - `orgs`: `space-separated` list of BCGov GitHub org that the authenticated user has a membership of.
