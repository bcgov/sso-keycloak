data "aws_vpc" "selected" {
  state = "available"
}

data "aws_subnet" "a" {
  filter {
    name   = "tag:Name"
    values = [var.subnet_a]
  }
}

data "aws_subnet" "b" {
  filter {
    name   = "tag:Name"
    values = [var.subnet_b]
  }
}

data "aws_security_group" "app" {
  name = "App_sg"
}

data "aws_security_group" "web" {
  name = "Web_sg"
}

resource "aws_security_group" "otp_rds_sg" {
  name        = "otp_rds_sg"
  description = "Security group for AWS RDS"
  vpc_id      = data.aws_vpc.selected.id
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["127.0.0.1/32"]
    self        = true
  }

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [data.aws_security_group.app.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
