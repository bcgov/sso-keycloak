data "aws_security_group" "app_sg" {
  name = "App"
}

# this modules documented outputs all need a prefix of this_
module "db" {
  source  = "terraform-aws-modules/rds-aurora/aws"
  version = "~> 10.0.2"

  name   = var.name
  engine = var.engine
  # Cluster in v2 is provisioned with a serverless instance.
  engine_mode    = "provisioned"
  engine_version = var.engine_version

  vpc_id = var.vpc_id
  security_group_ingress_rules = {
    ex1_ingress = {
      cidr_ipv4 = "127.0.0.1/32"
    }
    ex1_ingress = {
      referenced_security_group_id = data.aws_security_group.app_sg.id
    }
  }
  subnets                = var.subnet_ids
  db_subnet_group_name   = var.name
  create_db_subnet_group = true

  storage_encrypted = true
  apply_immediately = true
  # 0 is used to disable enhanced monitoring
  cluster_monitoring_interval = 0
  skip_final_snapshot         = true
  enable_http_endpoint        = true

  serverlessv2_scaling_configuration = {
    max_capacity             = var.max_capacity
    min_capacity             = var.min_capacity
    seconds_until_auto_pause = var.scale_down_time
  }
  cluster_instance_class = "db.serverless"
  instances              = { one = {} }

  manage_master_user_password = false
  master_username             = var.db_username
  master_password_wo          = var.db_password
  master_password_wo_version  = 1
  database_name               = var.db_name
  tags                        = var.tags
}
