module "c6af30_dev" {
  source  = "bcgov/openshift/deployer"
  version = "0.5.0"

  name      = "oc-deployer"
  namespace = "c6af30-dev"
}

module "c6af30_test" {
  source  = "bcgov/openshift/deployer"
  version = "0.5.0"

  name      = "oc-deployer"
  namespace = "c6af30-test"
}

module "c6af30_prod" {
  source  = "bcgov/openshift/deployer"
  version = "0.5.0"

  name      = "oc-deployer"
  namespace = "c6af30-prod"
}

module "eb75ad_dev" {
  source  = "bcgov/openshift/deployer"
  version = "0.5.0"

  name      = "oc-deployer"
  namespace = "eb75ad-dev"
}

module "eb75ad_test" {
  source  = "bcgov/openshift/deployer"
  version = "0.5.0"

  name      = "oc-deployer"
  namespace = "eb75ad-test"
}

module "eb75ad_prod" {
  source  = "bcgov/openshift/deployer"
  version = "0.5.0"

  name      = "oc-deployer"
  namespace = "eb75ad-prod"
}

output "c6af30_dev_secret" {
  value = module.c6af30_dev.default_secret_name
}

output "c6af30_test_secret" {
  value = module.c6af30_test.default_secret_name
}
output "c6af30_prod_secret" {
  value = module.c6af30_prod.default_secret_name
}

output "eb75ad_dev_secret" {
  value = module.eb75ad_dev.default_secret_name
}

output "eb75ad_test_secret" {
  value = module.eb75ad_test.default_secret_name
}

output "eb75ad_prod_secret" {
  value = module.eb75ad_prod.default_secret_name
}
