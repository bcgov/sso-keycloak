variable "subnet_a" {
  type        = string
  description = "Value of the name tag for the app subnet in AZ a"
  default     = "Dev-App-A"
}

variable "subnet_b" {
  type        = string
  description = "Value of the name tag for the app subnet in AZ b"
  default     = "Dev-App-B"
}

variable "dev_custom_domain_name" {
  description = "DEV custom domain name of OTP provider"
  type        = string
  default     = ""
}

variable "test_custom_domain_name" {
  description = "TEST custom domain name of OTP provider"
  type        = string
  default     = ""
}

variable "prod_custom_domain_name" {
  description = "PROD custom domain name of OTP provider"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags"
  type        = map(string)
  default = {
    ManagedBy        = "Terraform"
    TerraformVersion = "1.11.0"
  }
}

variable "ches_username" {
  description = "CHES service username"
  type        = string
  default     = ""
}

variable "ches_password" {
  description = "CHES service password"
  type        = string
  default     = ""
}

variable "dev_task_cpu" {
  description = "Fargate task CPU for dev"
  type        = number
  default     = 256
}

variable "dev_task_memory" {
  description = "Fargate task memory for dev"
  type        = number
  default     = 512
}

variable "dev_task_containe_cpu" {
  description = "Fargate container CPU for dev"
  type        = number
  default     = 256
}

variable "dev_task_container_memory" {
  description = "Fargate container memory for dev"
  type        = number
  default     = 512
}

variable "dev_task_container_port" {
  description = "Fargate container port for dev"
  type        = number
  default     = 3000
}

variable "test_task_cpu" {
  description = "Fargate task CPU for dev"
  type        = number
  default     = 256
}

variable "test_task_memory" {
  description = "Fargate task memory for dev"
  type        = number
  default     = 512
}

variable "test_task_containe_cpu" {
  description = "Fargate container CPU for dev"
  type        = number
  default     = 256
}

variable "test_task_container_memory" {
  description = "Fargate container memory for dev"
  type        = number
  default     = 512
}

variable "test_task_container_port" {
  description = "Fargate container port for dev"
  type        = number
  default     = 3000
}

variable "prod_task_cpu" {
  description = "Fargate task CPU for dev"
  type        = number
  default     = 256
}

variable "prod_task_memory" {
  description = "Fargate task memory for dev"
  type        = number
  default     = 512
}

variable "prod_task_containe_cpu" {
  description = "Fargate container CPU for dev"
  type        = number
  default     = 256
}

variable "prod_task_container_memory" {
  description = "Fargate container memory for dev"
  type        = number
  default     = 512
}

variable "prod_task_container_port" {
  description = "Fargate container port for dev"
  type        = number
  default     = 3000
}

variable "otp_cwlogs_group" {
  description = "Name of the otp provider logs group"
  type        = string
  default     = "/aws/ecs/fargate/otp-provider"
}

variable "otp_image_tag" {
  description = "Name of the otp provider image tag"
  type        = string
  default     = "latest"
}


variable "dev_app_url" {
  description = "DEV app url"
  type        = string
  default     = "https://dev.sandbox.otp.loginproxy.gov.bc.ca"
}

variable "test_app_url" {
  description = "TEST app url"
  type        = string
  default     = "https://test.sandbox.otp.loginproxy.gov.bc.ca"
}

variable "prod_app_url" {
  description = "PROD app url"
  type        = string
  default     = "https://otp.loginproxy.gov.bc.ca"
}

variable "dev_cors_origins" {
  description = "CORS origins for dev"
  type        = string
  default     = "https://dev.sandbox.loginproxy.gov.bc.ca,https://sso-playground.apps.gold.devops.gov.bc.ca,https://bcgov.github.io/keycloak-example-apps"
}

variable "test_cors_origins" {
  description = "CORS origins for test"
  type        = string
  default     = "https://test.sandbox.loginproxy.gov.bc.ca,https://sso-playground.apps.gold.devops.gov.bc.ca,https://bcgov.github.io/keycloak-example-apps"
}

variable "prod_cors_origins" {
  description = "CORS origins for prod"
  type        = string
  default     = "https://loginproxy.gov.bc.ca,https://sso-playground.apps.gold.devops.gov.bc.ca,https://bcgov.github.io/keycloak-example-apps"
}

variable "dev_rds_scale_down_time" {
  description = "RDS scale down time for dev"
  type        = number
  default     = 3600
}

variable "dev_rds_max_capacity" {
  description = "RDS max capacity for dev"
  type        = number
  default     = 2
}

variable "dev_rds_min_capacity" {
  description = "RDS min capacity for dev"
  type        = number
  default     = 0
}

variable "test_rds_scale_down_time" {
  description = "RDS scale down time for test"
  type        = number
  default     = 3600
}

variable "test_rds_max_capacity" {
  description = "RDS max capacity for test"
  type        = number
  default     = 2
}

variable "test_rds_min_capacity" {
  description = "RDS min capacity for test"
  type        = number
  default     = 0
}

variable "prod_rds_scale_down_time" {
  description = "RDS scale down time for prod"
  type        = number
  default     = 3600
}

variable "prod_rds_max_capacity" {
  description = "RDS max capacity for prod"
  type        = number
  default     = 2
}

variable "prod_rds_min_capacity" {
  description = "RDS min capacity for prod"
  type        = number
  default     = 0.5
}

variable "enable_grafana" {
  description = "Enable Grafana for monitoring"
  type        = bool
  default     = false
}

variable "grafana_env" {
  description = "Grafana environment"
  type        = string
  default     = "development"
}

variable "grafana_kc_url" {
  description = "Grafana keycloak base URL"
  type        = string
  default     = ""
}

variable "grafana_kc_client_id" {
  description = "Grafana keycloak client ID"
  type        = string
  default     = ""
}

variable "grafana_kc_client_secret" {
  description = "Grafana keycloak client secret"
  type        = string
  default     = ""
}
