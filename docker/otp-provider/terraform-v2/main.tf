locals {
  name = "otp-provider"
}

resource "aws_alb" "otp_provider_alb" {

  name                             = "${local.name}-alb"
  internal                         = true
  security_groups                  = [data.aws_security_group.web_sg.id]
  subnets                          = [data.aws_subnet.a.id, data.aws_subnet.b.id]
  enable_cross_zone_load_balancing = true

  lifecycle {
    ignore_changes = [access_logs]
  }
}

resource "aws_alb_listener" "otp_provider_alb_listener" {
  load_balancer_arn = aws_alb.otp_provider_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "Not found"
      status_code  = "404"
    }
  }
}

module "ecr" {
  source = "./modules/ecr"
}

module "dev" {
  source = "./dev"

  name               = "${local.name}-dev"
  vpc_id             = data.aws_vpc.selected.id
  alb_listener_arn   = aws_alb_listener.otp_provider_alb_listener.arn
  custom_domain_name = var.dev_custom_domain_name
  tags               = merge(var.tags, { Environment = "Development", Application = "OTP Provider" })

  task_cpu                = var.dev_task_cpu
  task_memory             = var.dev_task_memory
  container_cpu           = var.dev_task_containe_cpu
  container_memory        = var.dev_task_container_memory
  container_port          = var.dev_task_container_port
  awslogs-group           = "${var.otp_cwlogs_group}-dev"
  app_env                 = "development"
  node_env                = "production"
  app_url                 = var.dev_app_url
  ches_username           = var.ches_username
  ches_password           = var.ches_password
  cors_origins            = var.dev_cors_origins
  security_group_ids      = [data.aws_security_group.app_sg.id]
  subnet_ids              = [data.aws_subnet.a.id, data.aws_subnet.b.id]
  task_execution_role_arn = aws_iam_role.otp_task_execution_role.arn
  task_role_arn           = aws_iam_role.otp_task_role.arn
  aws_ecr_uri             = module.ecr.repository_url
  image_tag               = var.otp_image_tag
  rds_max_capacity        = var.dev_rds_max_capacity
  rds_min_capacity        = var.dev_rds_min_capacity
  rds_scale_down_time     = var.dev_rds_scale_down_time
}

module "test" {
  source = "./test"

  name               = "${local.name}-test"
  vpc_id             = data.aws_vpc.selected.id
  alb_listener_arn   = aws_alb_listener.otp_provider_alb_listener.arn
  custom_domain_name = var.test_custom_domain_name
  tags               = merge(var.tags, { Environment = "Test", Application = "OTP Provider" })

  task_cpu                = var.test_task_cpu
  task_memory             = var.test_task_memory
  container_cpu           = var.test_task_containe_cpu
  container_memory        = var.test_task_container_memory
  container_port          = var.test_task_container_port
  awslogs-group           = "${var.otp_cwlogs_group}-test"
  app_env                 = "test"
  node_env                = "production"
  app_url                 = var.test_app_url
  ches_username           = var.ches_username
  ches_password           = var.ches_password
  cors_origins            = var.test_cors_origins
  security_group_ids      = [data.aws_security_group.app_sg.id]
  subnet_ids              = [data.aws_subnet.a.id, data.aws_subnet.b.id]
  task_execution_role_arn = aws_iam_role.otp_task_execution_role.arn
  task_role_arn           = aws_iam_role.otp_task_role.arn
  aws_ecr_uri             = module.ecr.repository_url
  image_tag               = var.otp_image_tag
  rds_max_capacity        = var.test_rds_max_capacity
  rds_min_capacity        = var.test_rds_min_capacity
  rds_scale_down_time     = var.test_rds_scale_down_time
}

module "prod" {
  source = "./prod"

  name               = "${local.name}-prod"
  vpc_id             = data.aws_vpc.selected.id
  alb_listener_arn   = aws_alb_listener.otp_provider_alb_listener.arn
  custom_domain_name = var.prod_custom_domain_name
  tags               = merge(var.tags, { Environment = "Production", Application = "OTP Provider" })

  task_cpu                = var.prod_task_cpu
  task_memory             = var.prod_task_memory
  container_cpu           = var.prod_task_containe_cpu
  container_memory        = var.prod_task_container_memory
  container_port          = var.prod_task_container_port
  awslogs-group           = "${var.otp_cwlogs_group}-prod"
  app_env                 = "production"
  node_env                = "production"
  app_url                 = var.prod_app_url
  ches_username           = var.ches_username
  ches_password           = var.ches_password
  cors_origins            = var.prod_cors_origins
  security_group_ids      = [data.aws_security_group.app_sg.id]
  subnet_ids              = [data.aws_subnet.a.id, data.aws_subnet.b.id]
  task_execution_role_arn = aws_iam_role.otp_task_execution_role.arn
  task_role_arn           = aws_iam_role.otp_task_role.arn
  aws_ecr_uri             = module.ecr.repository_url
  image_tag               = var.otp_image_tag
  rds_max_capacity        = var.prod_rds_max_capacity
  rds_min_capacity        = var.prod_rds_min_capacity
  rds_scale_down_time     = var.prod_rds_scale_down_time
}
