resource "aws_dynamodb_table" "otp_state_locking" {
  hash_key = "LockID"
  name     = var.lock_table_name
  attribute {
    name = "LockID"
    type = "S"
  }
  billing_mode = "PAY_PER_REQUEST"
}
