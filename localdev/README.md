## Keycloak Local Environment

It provides the local dev environment for Terraform scripts to help understand the Keycloak functionalities and [Keycloak Terraform module](https://registry.terraform.io/providers/mrparkers/keycloak/latest/docs).

## Prerequisite

This repository includes required tools' versions in [.tool-versions](../.tool-versions). Please install them via [asdf](https://asdf-vm.com/) or preferable methods.

## Usage

### Build the Local Keycloak image

```sh
cd ../docker/keycloak/
docker build -t sso-keycloak . -f Dockerfile-7.5-9
```

### Build the local environment

```sh
make up
cd terraform
terraform init
terraform apply
```

### Destroy the local environment

```sh
cd terraform
terraform destroy
cd ..
make down
```
