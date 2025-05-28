terraform {
  required_version = ">= 0.15.3"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.98.0"
    }

    random = {
      source  = "hashicorp/random"
      version = ">= 3.7.2"
    }
  }

  backend "s3" {
    bucket         = "xgr00q-dev-sso-otp-provider"
    key            = "sso-otp-provider.tfstate"
    region         = "ca-central-1"
    dynamodb_table = "xgr00q-dev-otp-state-locking"
  }
}
