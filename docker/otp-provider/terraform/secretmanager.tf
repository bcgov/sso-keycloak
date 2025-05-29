resource "aws_secretsmanager_secret" "this" {
  name = "SSOOTPProviderSecrets"
}
