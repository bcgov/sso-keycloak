locals {
  app_cpu    = (var.node_env == "production" ? 512 : 256)
  app_memory = (var.node_env == "production" ? 1024 : 512)
  app_port   = 3000
}

resource "random_password" "cookie_secret1" {
  length  = 8
  special = true
}

resource "random_password" "cookie_secret2" {
  length  = 8
  special = true
}

resource "random_password" "cookie_secret3" {
  length  = 8
  special = true
}

resource "random_password" "cookie_secret4" {
  length  = 8
  special = true
}

resource "aws_ecs_cluster" "this" {
  name = var.app_name
}

resource "aws_ecs_cluster_capacity_providers" "this" {
  cluster_name       = aws_ecs_cluster.this.name
  capacity_providers = ["FARGATE_SPOT"]
  default_capacity_provider_strategy {
    weight            = 100
    capacity_provider = "FARGATE_SPOT"
  }
}

resource "aws_ecs_task_definition" "this" {
  depends_on               = [aws_apigatewayv2_api.this]
  family                   = var.app_name
  execution_role_arn       = aws_iam_role.ecs_otp_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_otp_task_role.arn
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = local.app_cpu
  memory                   = local.app_memory
  tags                     = var.app_tags
  container_definitions = jsonencode([
    {
      essential              = true
      name                   = var.app_name
      image                  = "${var.aws_ecr_uri}/bcgov-sso/otp-provider:${var.image_tag}"
      cpu                    = local.app_cpu
      memory                 = local.app_memory
      readonlyRootFilesystem = false
      networkMode            = "awsvpc"
      portMappings = [
        {
          protocol      = "tcp"
          containerPort = local.app_port
          hostPort      = local.app_port
        }
      ]
      environment = [
        {
          name  = "AWS_REGION",
          value = "ca-central-1"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-create-group  = "true"
          awslogs-group         = "/ecs/otp-provider"
          awslogs-region        = "ca-central-1"
          awslogs-stream-prefix = "ecs"
        }
      }
      environment = [
        {
          name  = "APP_ENV",
          value = var.app_env
        },
        {
          name  = "NODE_ENV",
          value = var.node_env
        },
        {
          name  = "APP_URL",
          value = var.app_url
        },
        {
          name  = "CHES_USERNAME",
          value = var.ches_username
        },
        {
          name  = "CHES_PASSWORD",
          value = var.ches_password
        },
        {
          name  = "CHES_API_URL",
          value = var.ches_api_url
        },
        {
          name  = "CHES_TOKEN_URL",
          value = var.ches_token_url
        },
        {
          name  = "LOG_LEVEL",
          value = var.log_level
        },
        {
          name  = "COOKIE_SECRETS",
          value = "${random_password.cookie_secret1.result}, ${random_password.cookie_secret2.result}, ${random_password.cookie_secret3.result}"
        },
        {
          name  = "DB_HOSTNAME",
          value = module.db.cluster_endpoint
        },
        {
          name  = "DB_USERNAME",
          value = var.db_username
        },
        {
          name  = "DB_PASSWORD",
          value = random_password.db_password.result
        },
        {
          name  = "DB_NAME",
          value = var.db_name
        },
        {
          name  = "YARN_CACHE_FOLDER",
          value = "/tmp/yarn-cache"
        },
        {
          name  = "CORS_ORIGINS",
          value = var.cors_origins
        },
        {
          name  = "DB_CLEANUP_CRON",
          value = var.db_cleanup_cron
        },
        {
          name  = "HASH_SALT",
          value = var.hash_salt
        },
        {
          name  = "OTP_VALIDITY_MINUTES",
          value = var.otp_validity_minutes
        },
        {
          name  = "OTP_ATTEMPTS_ALLOWED",
          value = var.otp_attempts_allowed
        },
        {
          name  = "OTP_RESENDS_ALLOWED_PER_DAY",
          value = var.otp_resends_allowed_per_day
        },
        {
          name  = "OTP_RESEND_INTERVAL_MINUTES",
          value = var.otp_resend_interval_minutes
        },
        {
          name  = "COOKIE_SECRET",
          value = random_password.cookie_secret4.result
        }
      ]
      secrets = [
        {
          name      = "JWKS",
          valueFrom = "${data.aws_secretsmanager_secret_version.this.arn}:JWKS::"
        }
      ]
    }
  ])
}

resource "aws_ecs_service" "this" {
  name                              = var.app_name
  cluster                           = aws_ecs_cluster.this.id
  task_definition                   = aws_ecs_task_definition.this.arn
  desired_count                     = 1
  enable_ecs_managed_tags           = true
  propagate_tags                    = "TASK_DEFINITION"
  health_check_grace_period_seconds = 60
  wait_for_steady_state             = false


  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight            = 100
  }


  network_configuration {
    security_groups  = [data.aws_security_group.app.id]
    subnets          = [data.aws_subnet.a.id, data.aws_subnet.b.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.this.id
    container_name   = var.app_name
    container_port   = local.app_port
  }

  tags = var.app_tags
}

data "aws_secretsmanager_secret_version" "this" {
  secret_id = aws_secretsmanager_secret.this.id
}

# Grafana

resource "aws_ecs_cluster" "grafana" {
  name = "grafana-cluster"
}

resource "aws_iam_role" "ecs_task_execution" {
  name = "ecsTaskExecutionRole-grafana"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_attach" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_ecs_task_definition" "grafana" {
  family                   = "grafana-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  # This is a lightweight image so running the minimum allowed fargate container
  cpu    = "256"
  memory = "512"

  execution_role_arn = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name      = "grafana"
      image     = "grafana/grafana:latest"
      essential = true
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "GF_SECURITY_ADMIN_PASSWORD"
          value = var.grafana_admin_password
        },
        {
          name  = "GF_SERVER_ROOT_URL"
          value = "https://${var.custom_domain_name}/grafana/"
        },
        {
          name  = "GF_SERVER_SERVE_FROM_SUB_PATH"
          value = "true"
        }
      ]
    }
  ])
}

resource "aws_ecs_service" "grafana" {
  name            = "grafana-service"
  cluster         = aws_ecs_cluster.grafana.id
  task_definition = aws_ecs_task_definition.grafana.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [data.aws_security_group.app.id]
    subnets          = [data.aws_subnet.a.id, data.aws_subnet.b.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.grafana.arn
    container_name   = "grafana"
    container_port   = 3000
  }

  depends_on = [aws_alb_listener_rule.grafana]
}
