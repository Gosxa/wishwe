###############################################################
# main.tf — Core infrastructure: VPC, EC2, Security Group
###############################################################

# ── VPC ──────────────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-vpc"
  })
}

# ── Internet Gateway ──────────────────────────────────────────
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-igw"
  })
}

# ── Public Subnet ─────────────────────────────────────────────
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-subnet-${count.index + 1}"
  })
}

# ── Route Table ───────────────────────────────────────────────
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ── Security Group ────────────────────────────────────────────
resource "aws_security_group" "web" {
  name        = "${var.project_name}-web-sg"
  description = "Security group for web application"
  vpc_id      = aws_vpc.main.id

  # SSH access — restrict to a known CIDR in production!
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-web-sg"
  })
}

# ── Key Pair ──────────────────────────────────────────────────
resource "aws_key_pair" "web" {
  key_name   = "${var.project_name}-key"
  public_key = file(var.public_key_path)

  tags = local.common_tags
}

# ── EC2 Instance ──────────────────────────────────────────────
resource "aws_instance" "web" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [aws_security_group.web.id]
  key_name               = aws_key_pair.web.key_name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_size_gb
    delete_on_termination = true
    encrypted             = true
  }

  user_data = base64encode(<<-EOF
  #!/bin/bash
  apt-get update -y
  apt-get install -y nginx fail2ban ufw
  ufw allow ssh && ufw allow http && ufw allow https && ufw --force enable
  systemctl enable nginx && systemctl start nginx
  systemctl enable fail2ban && systemctl start fail2ban
EOF
  )

  metadata_options {
    http_tokens = "required" # IMDSv2 enforced
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-web-server"
  })
}

# ── Elastic IP ────────────────────────────────────────────────
resource "aws_eip" "web" {
  instance = aws_instance.web.id
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-eip"
  })

  depends_on = [aws_internet_gateway.main]
}
