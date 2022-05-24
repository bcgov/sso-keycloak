locals {
  namespaces = ["b861c7-dev", "b861c7-prod"]
}

module "deployers" {
  source   = "bcgov/openshift/deployer"
  version  = "0.8.0"
  for_each = toset(local.namespaces)

  name      = "oc-deployer"
  namespace = each.key
}

output "deployer_secrets" {
  description = "Default secret names"
  value       = { for n in sort(local.namespaces) : n => module.deployers[n].default_secret_name }
}
