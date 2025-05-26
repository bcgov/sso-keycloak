terraform {
  required_version = ">= 0.15.3"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.80.0"
    }

    random = {
      source  = "hashicorp/random"
      version = ">= 3.4.3"
    }
  }

  backend "s3" {
    bucket         = "otp-provider-terraform"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "otp-provider-terraform-lock"
  }
}
