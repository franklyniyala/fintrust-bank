output "public_ip" {
  value = aws_instance.fintrust_instance.public_ip

}

output "ssh_command" {
  value = "ssh -i franklyn.pem ec2-user@${aws_instance.fintrust_instance.public_ip}"
}