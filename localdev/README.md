## Realm-o-matic Ansible Component:

It provides the local dev environment for Terraform scripts to help understand the Keycloak functionalities and [Keycloak Terraform module](https://registry.terraform.io/providers/mrparkers/keycloak/latest/docs).

### Prerequisite

This repository includes required tools' versions in [.tool-versions](../.tool-versions). Please install them via [asdf](https://asdf-vm.com/) or preferable methods.

### Setup

- Build the local environment

  ```sh
  make up
  cd terraform
  terraform init
  terraform apply
  ```

- Destroy the local environment

  ```sh
  cd terraform
  terraform destroy
  cd ..
  make down
  ```
