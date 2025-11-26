variable "name" {
  description = "Name of the task"
  type        = string
  default     = "otp-provider"
}

variable "task_cpu" {
  description = "Task CPU"
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "Task memory"
  type        = number
  default     = 512
}

variable "container_cpu" {
  description = "Container CPU"
  type        = number
  default     = 256
}

variable "container_memory" {
  description = "Container memory"
  type        = number
  default     = 512
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 3000
}

variable "tags" {
  description = "Tags"
  type        = map(string)
  default     = {}
}

variable "awslogs-group" {
  description = "Name of the logs group"
  type        = string
  default     = "/ecs/otp-provider"
}

variable "app_env" {
  type        = string
  description = "App environment"
  default     = "development"
}

variable "node_env" {
  type        = string
  description = "App node environment"
  default     = "development"
}

variable "ches_username" {
  type        = string
  description = "CHES account username"
  default     = ""
  sensitive   = true
}

variable "ches_password" {
  type        = string
  description = "CHES account password"
  default     = ""
  sensitive   = true
}

variable "ches_api_url" {
  type        = string
  description = "CHES API url"
  default     = "https://ches.api.gov.bc.ca/api/v1/email"
}

variable "ches_token_url" {
  type        = string
  description = "CHES token url"
  default     = "https://loginproxy.gov.bc.ca/auth/realms/comsvcauth/protocol/openid-connect/token"
}

variable "app_url" {
  type        = string
  description = "App url"
  default     = "http://localhost:8080"
}

variable "log_level" {
  type        = string
  description = "App log level"
  default     = "info"
}

variable "db_username" {
  description = "The username for the database app user"
  type        = string
  default     = "otpsysadmin"
  sensitive   = true
}

variable "db_hostname" {
  description = "The hostname for the database"
  type        = string
  default     = ""
}

variable "db_password" {
  description = "The password for the database app user"
  type        = string
  default     = "otpsysadmin"
  sensitive   = true
}

variable "db_name" {
  description = "The name of the database"
  type        = string
  default     = "otp"
  sensitive   = true
}

variable "cors_origins" {
  description = "Comma separated whitelisted domains allowed to connect to the server"
  type        = string
  default     = ""
}

variable "db_cleanup_cron" {
  description = "Cron schedule to run database cleanup task"
  type        = string
  default     = "0 1 * * *"
}

variable "otp_validity_minutes" {
  description = "Number of minutes for otp expiration"
  type        = string
  default     = ""
}

variable "otp_attempts_allowed" {
  description = "Number of otp entry attempts allowed per user"
  type        = string
  default     = ""
}

variable "otp_resends_allowed_per_day" {
  description = "Number of otp resends allowed per day per user"
  type        = string
  default     = ""
}

variable "otp_resend_interval_minutes" {
  description = "Interval between otp resends"
  type        = string
  default     = ""
}

variable "jwks_secret_version_arn" {
  description = "Version of the secret that holds jwks"
  type        = string
  default     = ""
}

variable "security_group_ids" {
  description = "A list of VPC security groups"
  type        = list(string)
  default     = []
}

variable "subnet_ids" {
  description = "A list of VPC subnets"
  type        = list(string)
  default     = []
}

variable "task_execution_role_arn" {
  description = "ECS task execution role"
  type        = string
  default     = ""
}

variable "task_role_arn" {
  description = "ECS task role"
  type        = string
  default     = ""
}

variable "aws_ecr_uri" {
  description = "The ECR URI for otp docker image"
  type        = string
  default     = ""
}

variable "image_tag" {
  description = "The otp provider docker image tag"
  type        = string
  default     = "latest"
}

variable "target_group_arn" {
  description = "ALB Target Group ARN"
  type        = string
  default     = ""
}
