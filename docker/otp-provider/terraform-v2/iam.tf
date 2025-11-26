resource "aws_iam_role" "otp_task_execution_role" {
  name               = "OTPProviderTaskExecutionRole"
  assume_role_policy = data.aws_iam_policy_document.this.json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "task_execution_role_policy_attachment" {
  role       = aws_iam_role.otp_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "otp_task_role" {
  name = "OTPProviderTaskRole"

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

  tags = var.tags
}

resource "aws_iam_role_policy" "otp_task_execution_cwlogs" {
  name = "OTPProviderLogsPolicy"
  role = aws_iam_role.otp_task_execution_role.id

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

resource "aws_iam_role_policy" "otp_task_read_secret_policy" {
  name = "OTProviderReadSecretPolicy"
  role = aws_iam_role.otp_task_execution_role.id

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
                  "${module.dev.dev_otp_provider_secret_arn}",
                  "${module.test.test_otp_provider_secret_arn}",
                  "${module.prod.prod_otp_provider_secret_arn}"
              ]
          }
      ]
  }
EOF
}

resource "aws_iam_role" "grafana_task_execution" {
  count = var.enable_grafana ? 1 : 0
  name  = "GrafanaTaskExecutionRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = [
        "sts:AssumeRole"
      ],
      Effect = "Allow",
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role" "grafana_task_role" {
  count = var.enable_grafana ? 1 : 0
  name  = "GrafanaTaskRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}
resource "aws_iam_role_policy" "grafana_task_policy" {
  count = var.enable_grafana ? 1 : 0
  name  = "GrafanaEFSAccessPolicy"
  role  = aws_iam_role.grafana_task_role[0].id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "elasticfilesystem:ClientMount",
          "elasticfilesystem:ClientWrite",
          "elasticfilesystem:ClientRootAccess"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_attach" {
  count      = var.enable_grafana ? 1 : 0
  role       = aws_iam_role.grafana_task_execution[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
