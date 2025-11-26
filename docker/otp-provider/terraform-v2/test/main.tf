resource "random_password" "db_password" {
  length  = 20
  special = false
}

resource "aws_secretsmanager_secret" "otp_provider_secret" {
  name = "OTPProviderSecretTest"
}

data "aws_secretsmanager_secret_version" "otp_provider_secret_version" {
  secret_id = aws_secretsmanager_secret.otp_provider_secret.id
}

module "acm" {
  source = "../modules/acm"

  custom_domain_name = var.custom_domain_name
}

module "alb" {
  source = "../modules/alb"

  name                   = var.name
  vpc_id                 = var.vpc_id
  tags                   = var.tags
  custom_domain_name     = var.custom_domain_name
  alb_listener_arn       = var.alb_listener_arn
  listener_rule_priority = 9
}

module "apigateway" {
  source              = "../modules/apigateway"
  name                = var.name
  custom_domain_name  = var.custom_domain_name
  acm_certificate_arn = module.acm.acm_certificate_arn
  alb_listener_arn    = var.alb_listener_arn
  subnet_ids          = var.subnet_ids
  security_group_ids  = var.security_group_ids
  tags                = var.tags
}

module "rds_db" {
  source = "../modules/rds"

  name            = "${var.name}-db"
  engine          = "aurora-postgresql"
  engine_version  = "15.12"
  vpc_id          = var.vpc_id
  subnet_ids      = var.subnet_ids
  max_capacity    = var.rds_max_capacity
  min_capacity    = var.rds_min_capacity
  scale_down_time = var.rds_scale_down_time
  tags            = var.tags
  db_password     = random_password.db_password.result
}

module "fargate" {
  source = "../modules/fargate"

  name                        = var.name
  target_group_arn            = module.alb.target_group_arn
  security_group_ids          = var.security_group_ids
  subnet_ids                  = var.subnet_ids
  task_execution_role_arn     = var.task_execution_role_arn
  task_role_arn               = var.task_role_arn
  task_cpu                    = var.task_cpu
  task_memory                 = var.task_memory
  container_cpu               = var.container_cpu
  container_memory            = var.container_memory
  container_port              = var.container_port
  awslogs-group               = var.awslogs-group
  aws_ecr_uri                 = var.aws_ecr_uri
  image_tag                   = var.image_tag
  app_env                     = var.app_env
  node_env                    = var.node_env
  app_url                     = var.app_url
  ches_username               = var.ches_username
  ches_password               = var.ches_password
  ches_api_url                = var.ches_api_url
  tags                        = var.tags
  log_level                   = var.log_level
  db_name                     = var.db_name
  db_username                 = var.db_username
  db_password                 = random_password.db_password.result
  db_hostname                 = module.rds_db.db_endpoint
  cors_origins                = var.cors_origins
  db_cleanup_cron             = var.db_cleanup_cron
  otp_validity_minutes        = var.otp_validity_minutes
  otp_attempts_allowed        = var.otp_attempts_allowed
  otp_resend_interval_minutes = var.otp_resend_interval_minutes
  otp_resends_allowed_per_day = var.otp_resends_allowed_per_day
  jwks_secret_version_arn     = data.aws_secretsmanager_secret_version.otp_provider_secret_version.arn
}
