###############################################################
# locals.tf — Computed values and common tags
###############################################################

locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
