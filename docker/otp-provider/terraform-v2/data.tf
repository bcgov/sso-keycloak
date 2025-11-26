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

data "aws_security_group" "web_sg" {
  filter {
    name   = "tag:Name"
    values = ["Web"]
  }

  vpc_id = data.aws_vpc.selected.id
}

data "aws_security_group" "app_sg" {
  filter {
    name   = "tag:Name"
    values = ["App"]
  }

  vpc_id = data.aws_vpc.selected.id
}

data "aws_iam_policy_document" "this" {
  version = "2012-10-17"
  statement {
    sid     = ""
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}
