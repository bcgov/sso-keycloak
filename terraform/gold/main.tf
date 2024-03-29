locals {
  namespaces = ["c6af30-dev", "c6af30-test", "c6af30-prod", "c6af30-tools", "eb75ad-dev", "eb75ad-test", "eb75ad-prod", "eb75ad-tools", "e4ca1d-dev", "e4ca1d-test", "e4ca1d-prod", "e4ca1d-tools"]
}

module "deployers" {
  source   = "bcgov/openshift/deployer"
  version  = "0.9.0"
  for_each = toset(local.namespaces)

  name      = "oc-deployer"
  namespace = each.key
  ops_bcgov = true
}

output "deployer_secrets" {
  description = "Default secret names"
  value       = { for n in sort(local.namespaces) : n => module.deployers[n].default_secret_name }
}

module "admin_deployer" {
  source  = "bcgov/openshift/deployer"
  version = "0.11.0"

  name                  = "oc-sso-deployer"
  namespace             = "eb75ad-prod"
  privileged_namespaces = local.namespaces
  ops_bcgov             = true
  bcgov_tsc             = true
}

output "admin_deployer_secret" {
  description = "Admin deployer secret name"
  value       = module.admin_deployer.default_secret_name
}
