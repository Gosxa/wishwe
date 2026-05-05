###############################################################
# outputs.tf — Useful values after apply
###############################################################

output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.web.id
}

output "instance_private_ip" {
  description = "Private IP of the EC2 instance"
  value       = aws_instance.web.private_ip
}

output "elastic_ip" {
  description = "Public Elastic IP assigned to the instance"
  value       = aws_eip.web.public_ip
}

output "ssh_command" {
  description = "Ready-to-use SSH command"
  value       = "ssh -i ~/.ssh/id_rsa ubuntu@${aws_eip.web.public_ip}"
}

output "ami_id" {
  description = "AMI used for the instance"
  value       = data.aws_ami.ubuntu.id
}

# ── RDS ───────────────────────────────────────────────────────
output "rds_endpoint" {
  description = "RDS connection endpoint (host:port)"
  value       = aws_db_instance.main.endpoint
}

output "rds_host" {
  description = "RDS hostname only (without port)"
  value       = aws_db_instance.main.address
}

output "rds_port" {
  description = "RDS port"
  value       = aws_db_instance.main.port
}

output "rds_db_name" {
  description = "PostgreSQL database name"
  value       = aws_db_instance.main.db_name
}

output "rds_username" {
  description = "PostgreSQL master username"
  value       = aws_db_instance.main.username
}

output "db_connection_string" {
  description = "PostgreSQL connection string for your app"
  value       = "postgresql://${aws_db_instance.main.username}:YOUR_PASSWORD@${aws_db_instance.main.address}:5432/${aws_db_instance.main.db_name}"
}
