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

resource "random_string" "hash_salt" {
  length  = 16
  special = true
  numeric = true
  upper   = true
  lower   = true
}

resource "aws_ecs_cluster" "this" {
  name = var.name
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
  family                   = var.name
  execution_role_arn       = var.task_execution_role_arn
  task_role_arn            = var.task_role_arn
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  tags                     = var.tags
  container_definitions = jsonencode([
    {
      essential              = true
      name                   = var.name
      image                  = "${var.aws_ecr_uri}:${var.image_tag}"
      cpu                    = var.container_cpu
      memory                 = var.container_memory
      readonlyRootFilesystem = false
      networkMode            = "awsvpc"
      portMappings = [
        {
          protocol      = "tcp"
          containerPort = var.container_port
          hostPort      = var.container_port
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
          awslogs-group         = var.awslogs-group
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
          value = var.db_hostname
        },
        {
          name  = "DB_USERNAME",
          value = var.db_username
        },
        {
          name  = "DB_PASSWORD",
          value = var.db_password
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
          value = random_string.hash_salt.result
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
          valueFrom = "${var.jwks_secret_version_arn}:JWKS::"
        }
      ]
    }
  ])
}

resource "aws_ecs_service" "this" {
  name                              = var.name
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
    security_groups  = var.security_group_ids
    subnets          = var.subnet_ids
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = var.name
    container_port   = var.container_port
  }

  tags = var.tags
}
