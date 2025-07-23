resource "aws_efs_file_system" "grafana" {
  count          = var.enable_grafana ? 1 : 0
  creation_token = "efs-sso-grafana"
  encrypted      = true
}

resource "aws_efs_mount_target" "efs_sso_grafana_azA" {
  count           = var.enable_grafana ? 1 : 0
  file_system_id  = aws_efs_file_system.grafana[0].id
  subnet_id       = data.aws_subnet.a.id
  security_groups = [data.aws_security_group.app.id]
}

resource "aws_efs_mount_target" "efs_sso_grafana_azB" {
  count           = var.enable_grafana ? 1 : 0
  file_system_id  = aws_efs_file_system.grafana[0].id
  subnet_id       = data.aws_subnet.b.id
  security_groups = [data.aws_security_group.app.id]
}

resource "aws_efs_access_point" "grafana" {
  count          = var.enable_grafana ? 1 : 0
  file_system_id = aws_efs_file_system.grafana[0].id

  root_directory {
    creation_info {
      owner_uid   = "0"
      owner_gid   = "0"
      permissions = "0777"
    }

    path = "/grafana"
  }
}
