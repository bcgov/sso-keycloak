output "api_gateway_id" {
  description = "API Gateway ID"
  value       = aws_apigatewayv2_api.this.id
}

output "api_gateway_vpc_link_id" {
  description = "API Gateway VPC Link ID"
  value       = aws_apigatewayv2_vpc_link.this.id
}
