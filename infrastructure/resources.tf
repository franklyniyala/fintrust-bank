# VPC

resource "aws_vpc" "fintrust_vpc" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "fintrust-vpc"
  }
}

# Public Subnet

resource "aws_subnet" "fintrust_public_subnet" {
  vpc_id            = aws_vpc.fintrust_vpc.id
  cidr_block        = "10.0.0.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "fintrust-public-subnet"
  }
}

# Private Subnet

resource "aws_subnet" "fintrust_private_subnet" {
  vpc_id     = aws_vpc.fintrust_vpc.id
  cidr_block = "10.0.1.0/24"

  tags = {
    Name = "fintrust-private-subnet"
  }
}

# Security Group

resource "aws_security_group" "fintrust_sg" {
  name        = "fintrust-sg"
  description = "Allow inbound traffic for Fintrust application"
  vpc_id      = aws_vpc.fintrust_vpc.id

  tags = {
    Name = "fintrust-sg"
  }
}

# Security Group Ingress Rules

resource "aws_vpc_security_group_ingress_rule" "allow_ssh" {
  security_group_id = aws_security_group.fintrust_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 22
  to_port           = 22
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "allow_http" {
  security_group_id = aws_security_group.fintrust_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
}

# Security Group Egress Rule

resource "aws_vpc_security_group_egress_rule" "allow_all_outbound" {
  security_group_id = aws_security_group.fintrust_sg.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}