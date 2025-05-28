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

resource "aws_iam_role" "ecs_otp_task_execution_role" {
  name               = "SSOOTPProviderECSTaskExecutionRole"
  assume_role_policy = data.aws_iam_policy_document.this.json
  tags               = var.app_tags
}

resource "aws_iam_role_policy_attachment" "app_ecs_task_execution_role_policy_attachment" {
  role       = aws_iam_role.ecs_otp_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_otp_task_role" {
  name = "SSOOTPProviderContainerRole"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF

  tags = var.app_tags
}

resource "aws_iam_role_policy" "ecs_otp_task_execution_cwlogs" {
  name = "ecs-task-exec-cwlogs"
  role = aws_iam_role.ecs_otp_task_execution_role.id

  policy = <<-EOF
  {
      "Version": "2012-10-17",
      "Statement": [
          {
              "Effect": "Allow",
              "Action": [
                  "logs:CreateLogGroup",
                  "logs:CreateLogStream",
                  "logs:PutLogEvents",
                  "logs:DescribeLogStreams"
              ],
              "Resource": [
                  "arn:aws:logs:*:*:*"
              ]
          }
      ]
  }
  EOF
}

resource "aws_iam_role_policy" "ecs_otp_task_read_secret_policy" {
  name = "SSOOTProviderReadSecretPolicy"
  role = aws_iam_role.ecs_otp_task_execution_role.id

  policy = <<-EOF
  {
      "Version": "2012-10-17",
      "Statement": [
          {
              "Effect": "Allow",
              "Action": [
                  "secretsmanager:GetSecretValue"
              ],
              "Resource": [
                  "${aws_secretsmanager_secret.this.arn}"
              ]
          }
      ]
  }
EOF
}
