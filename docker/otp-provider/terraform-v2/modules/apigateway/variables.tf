variable "name" {
  description = "Name of the API Gateway"
  type        = string
  default     = "otp-provider"

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

variable "custom_domain_name" {
  description = "Name of the custom domain"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate"
  type        = string
  default     = ""
}

variable "alb_listener_arn" {
  description = "ARN of the ALB listener"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags"
  type        = map(string)
  default     = {}
}
