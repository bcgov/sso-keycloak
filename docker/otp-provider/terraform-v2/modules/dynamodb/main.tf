resource "aws_dynamodb_table" "this" {
  hash_key = "LockID"
  name     = var.lock_table_name
  attribute {
    name = "LockID"
    type = "S"
  }
  billing_mode = "PAY_PER_REQUEST"
  tags         = var.tags
}
