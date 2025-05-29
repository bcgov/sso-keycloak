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
