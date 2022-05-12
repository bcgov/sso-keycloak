## SSO OCP Terraform

This `Terraform` modules help provision general-purpose resources, such as `Deployer service accounts` and `Network Policies` in BCGOV Openshift clusters.
It stores the OCP cluster's `Terraform state` into the corresponding `S3` bucket directory.

### Prerequisites

- `AWS Credentials`

  1. Log into [`Cloud Pathfinder AWS LZ2 Portal`](https://oidc.gov.bc.ca/auth/realms/umafubc9/protocol/saml/clients/amazon-aws).
  1. Choose `xgr00q-prod` and `Click for Credentials`.
  1. Copy the AWS credentials and pastes into the local workspace.

- Log in `OCP Cluster` that you want to run the Terraform scripts in.

### How To Run

1. Navigate to the target cluster's directory.
1. Initialize the Terraform workspace.
1. Update the Terraform scripts.
1. Plan/Apply the Terraform changes.

### Example

```sh
cd gold
terraform init
terraform plan
terraform apply
```
