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
