resource "aws_alb" "this" {

  name                             = "${var.app_name}-alb"
  internal                         = true
  security_groups                  = [data.aws_security_group.web.id]
  subnets                          = [data.aws_subnet.a.id, data.aws_subnet.b.id]
  enable_cross_zone_load_balancing = true

  lifecycle {
    ignore_changes = [access_logs]
  }
}

resource "aws_alb_listener" "this" {
  load_balancer_arn = aws_alb.this.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.this.arn
  }
}

resource "aws_alb_target_group" "this" {
  name                 = "${var.app_name}-tg"
  port                 = 3000
  protocol             = "HTTP"
  vpc_id               = data.aws_vpc.selected.id
  target_type          = "ip"
  deregistration_delay = 30

  health_check {
    healthy_threshold   = "2"
    interval            = "5"
    protocol            = "HTTP"
    matcher             = "200"
    timeout             = "3"
    path                = "/.well-known/openid-configuration"
    unhealthy_threshold = "2"
  }
  tags = var.app_tags
}

# Grafana

resource "aws_lb_target_group" "grafana" {
  count       = var.enable_grafana ? 1 : 0
  name        = "${var.app_name}-grafana"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.selected.id
  target_type = "ip"

  health_check {
    path                = "/"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

resource "aws_alb_listener_rule" "grafana" {
  count        = var.enable_grafana ? 1 : 0
  listener_arn = aws_alb_listener.this.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.grafana[0].arn
  }

  condition {
    path_pattern {
      values = ["/grafana/*"]
    }
  }
}
