variable "subnet_a" {
  type        = string
  description = "Value of the name tag for the app subnet in AZ a"
  default     = "App_Dev_aza_net"
}

variable "subnet_b" {
  type        = string
  description = "Value of the name tag for the app subnet in AZ b"
  default     = "App_Dev_azb_net"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "otp-provider"
}

variable "rds_scale_down_time" {
  type        = number
  description = "time in seconds of inactivity to scale down the RDS database"
  default     = 60
}

variable "rds_max_capacity" {
  type        = number
  description = "Maximum number of ACUs to scale up to"
  default     = 2
}

variable "rds_min_capacity" {
  type        = number
  description = "Minimum number of ACUs to scale down to."
  default     = 0
}

variable "db_username" {
  description = "The username for the database app user"
  type        = string
  default     = "otpsysadmin"
  sensitive   = true
}

variable "db_name" {
  description = "The name of the database"
  type        = string
  default     = "otp"
}

variable "app_tags" {
  type        = map(string)
  description = "Tags for OTP Provider app"
  default = {
    Application = "SSO OTP Provider"
    Team        = "SSO Team"
    Region      = "Canada Central 1"
    Backups     = "True"
    Repository  = "sso-keycloak"
  }
}

variable "image_tag" {
  type        = string
  description = "App docker image tag"
  default     = "latest"
}

variable "log_level" {
  type        = string
  description = "App log level"
  default     = "info"
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

variable "bucket_name" {
  type        = string
  description = "S3 bucket that stores terraform state"
  default     = "xgr00q-dev-sso-otp-provider"
}

variable "enable_encrytion" {
  type    = bool
  default = true
}

variable "lock_table_name" {
  type        = string
  description = "DynamoDB lock table name"
  default     = "xgr00q-dev-otp-state-locking"
}

variable "aws_ecr_uri" {
  description = "The ECR URI"
  type        = string
  default     = ""
}

variable "custom_domain_name" {
  description = "Custom domain name of OTP provider"
  type        = string
  default     = ""
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
