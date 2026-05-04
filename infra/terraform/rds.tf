###############################################################
# rds.tf — PostgreSQL RDS instance (Free Tier eligible)
###############################################################

# ── Private Subnets for RDS ───────────────────────────────────
# RDS should sit in private subnets (no public internet access)
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
  })
}

# ── DB Subnet Group ───────────────────────────────────────────
# RDS requires at least 2 subnets in different AZs
resource "aws_db_subnet_group" "main" {
  name        = "${var.project_name}-db-subnet-group"
  subnet_ids  = aws_subnet.private[*].id
  description = "Subnet group for ${var.project_name} PostgreSQL RDS"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-db-subnet-group"
  })
}

# ── RDS Security Group ────────────────────────────────────────
# Only allows PostgreSQL traffic FROM the EC2 security group
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Allow PostgreSQL access from EC2 only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-rds-sg"
  })
}

# ── RDS Parameter Group ───────────────────────────────────────
resource "aws_db_parameter_group" "main" {
  name        = "${var.project_name}-pg16"
  family      = "postgres16"
  description = "Custom parameter group for ${var.project_name}"

  tags = local.common_tags
}

# ── RDS PostgreSQL Instance ───────────────────────────────────
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-db"

  # ── Engine ─────────────────────────────────────────────────
  engine         = "postgres"
  engine_version = "16"

  # ── Free Tier eligible settings ────────────────────────────
  instance_class        = "db.t3.micro"  # Free tier eligible
  allocated_storage     = 20             # Free tier: up to 20 GB
  max_allocated_storage = 20             # Disable autoscaling to stay free
  storage_type          = "gp2"          # Free tier uses gp2

  # ── Database ───────────────────────────────────────────────
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432

  # ── Network ────────────────────────────────────────────────
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false  # Never expose DB to internet

  # ── Backups ────────────────────────────────────────────────
  backup_retention_period = 0       # Keep 7 days of backups
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # ── Other ──────────────────────────────────────────────────
  parameter_group_name = aws_db_parameter_group.main.name
  storage_encrypted    = true
  deletion_protection  = false  # Set true in production!

  # Prevents accidental deletion with terraform destroy
  skip_final_snapshot = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-postgres"
  })
}
