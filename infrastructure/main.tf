resource "aws_instance" "fintrust_instance" {
  ami                         = "ami-0521cb2d60cfbb1a6"
  instance_type               = "t3.medium"
  subnet_id                   = aws_subnet.fintrust_public_subnet.id
  vpc_security_group_ids      = [aws_security_group.fintrust_sg.id]
  key_name                    = "franklyn"
  associate_public_ip_address = true

  tags = {
    Name = "fintrust-instance"
  }
}