terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.50.0"
    }
  }
}

provider "aws" {
  # Configuration options
  region = var.aws_region
}