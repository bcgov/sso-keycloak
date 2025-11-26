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
}

terraform {
  backend "s3" {
    bucket       = "otp-provider-tf"
    key          = "otp-provider.tfstate"
    region       = "ca-central-1"
    use_lockfile = true
  }
}
