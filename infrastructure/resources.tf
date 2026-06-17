# VPC

resource "aws_vpc" "fintrust_vpc" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "fintrust-vpc"
  }
}

# Subnet

resource "aws_subnet" "fintrust_subnet" {
  vpc_id            = aws_vpc.fintrust_vpc.id
  cidr_block        = "10.0.0.0/24"
  availability_zone = "us-east-1a"
}

# Internet Gateway

resource "aws_internet_gateway" "fintrust_igw" {
  vpc_id = aws_vpc.fintrust_vpc.id

  tags = {
    Name = "fintrust-igw"
  }
}

# Route Table

resource "aws_route_table" "fintrust_route_table" {
  vpc_id = aws_vpc.fintrust_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.fintrust_igw.id
  }

  tags = {
    Name = "fintrust-route-table"
  }
}

# Route Table Association

resource "aws_route_table_association" "fintrust_rta" {
  subnet_id      = aws_subnet.fintrust_subnet.id
  route_table_id = aws_route_table.fintrust_route_table.id
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