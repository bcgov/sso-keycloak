resource "aws_acm_certificate" "this" {
  domain_name       = var.custom_domain_name
  validation_method = "DNS"
}
