###############################################################
# variables.tf — Input variables
###############################################################

variable "project_name" {
  description = "Name prefix used for all resources"
  type        = string
  default     = "wishwe"
}

variable "environment" {
  description = "Deployment environment (dev / staging / prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}

variable "aws_region" {
  description = "AWS region to deploy resources into"
  type        = string
  default     = "eu-central-1"
}

# ── Networking ────────────────────────────────────────────────
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

# ── Security ──────────────────────────────────────────────────
variable "ssh_allowed_cidr" {
  description = "CIDR allowed to reach port 22. Use your own IP, e.g. 203.0.113.5/32"
  type        = string
  default     = "0.0.0.0/0"
}

variable "public_key_path" {
  description = "Path to your SSH public key file"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

# ── EC2 ───────────────────────────────────────────────────────
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "root_volume_size_gb" {
  description = "Size of the root EBS volume in GiB"
  type        = number
  default     = 20
}

variable "ubuntu_version" {
  description = "Ubuntu LTS version to use for the AMI"
  type        = string
  default     = "24.04"
}
# ── RDS ───────────────────────────────────────────────────────
variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets used by RDS"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "appdb"
}

variable "db_username" {
  description = "Master username for the RDS instance"
  type        = string
  default     = "dbadmin"
}

variable "db_password" {
  description = "Master password for the RDS instance. Use a strong password, never commit this!"
  type        = string
  sensitive   = true  
}