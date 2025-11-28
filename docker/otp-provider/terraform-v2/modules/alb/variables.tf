variable "name" {
  description = "Name of the app"
  type        = string
  default     = ""
}

variable "alb_listener_arn" {
  description = "ALB listener ARN"
  type        = string
  default     = ""
}

variable "vpc_id" {
  description = "VPC id"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags"
  type        = map(string)
  default     = {}
}

variable "custom_domain_name" {
  description = "Custom domain name for the ALB listener rule"
  type        = string
  default     = ""
}

variable "listener_rule_priority" {
  description = "Priority for the ALB listener rule"
  type        = number
  default     = 100
}
