variable "name" {
  description = "RDS instance name"
  type        = string
  default     = "otp-db"
}

variable "engine" {
  description = "RDS engine"
  type        = string
  default     = "aurora-postgresql"
}

variable "engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "15.12"
}

variable "vpc_id" {
  description = "VPC id"
  type        = string
  default     = ""
}

variable "subnet_ids" {
  description = "A list of VPC subnets"
  type        = list(string)
  default     = []
}

variable "scale_down_time" {
  type        = number
  description = "time in seconds of inactivity to scale down the RDS database"
  default     = 3600
}

variable "max_capacity" {
  type        = number
  description = "Maximum number of ACUs to scale up to"
  default     = 2
}

variable "min_capacity" {
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

variable "db_password" {
  description = "The password for the database app user"
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_name" {
  description = "The name of the database"
  type        = string
  default     = "otp"
}

variable "tags" {
  description = "Tags"
  type        = map(string)
  default     = {}
}
