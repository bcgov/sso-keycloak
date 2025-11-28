output "dev_otp_provider_secret_arn" {
  description = "ARN of the OTP Provider Secrets Manager Secret"
  value       = aws_secretsmanager_secret.otp_provider_secret.arn
}

output "dev_api_gateway_id" {
  description = "API Gateway ID"
  value       = module.apigateway.api_gateway_id
}

output "dev_api_gateway_vpc_link_id" {
  description = "API Gateway VPC Link ID"
  value       = module.apigateway.api_gateway_vpc_link_id
}
