terraform {
  required_version = ">= 1.2.0"

  backend "s3" {
    bucket = "xgr00q-prod-ocp"
    key    = "ocp/gold"
    region = "ca-central-1"
  }
}

provider "kubernetes" {
  host  = "https://api.gold.devops.gov.bc.ca:6443"
  token = var.kubernetes_token
}
