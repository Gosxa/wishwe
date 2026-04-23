###############################################################
# providers.tf — Provider & backend configuration
###############################################################

terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # ── Remote State (recommended for teams) ─────────────────────
  # Uncomment and fill in your S3 bucket / DynamoDB table to
  # enable remote state with locking.
  #
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "webapp/terraform.tfstate"
  #   region         = "eu-central-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}
