module "b861c7_dev" {
  source  = "bcgov/openshift/deployer"
  version = "0.5.0"

  name      = "oc-deployer"
  namespace = "b861c7-dev"
}

module "b861c7_prod" {
  source  = "bcgov/openshift/deployer"
  version = "0.5.0"

  name      = "oc-deployer"
  namespace = "b861c7-prod"
}

output "b861c7_dev_secret" {
  value = module.b861c7_dev.default_secret_name
}

output "b861c7_prod_secret" {
  value = module.b861c7_prod.default_secret_name
}
