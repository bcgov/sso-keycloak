variable "lock_table_name" {
  description = "Name of the lock table"
  type        = string
  default     = "otp-state-locking"
}

variable "tags" {
  description = "Tags"
  type        = map(string)
  default     = {}
}
