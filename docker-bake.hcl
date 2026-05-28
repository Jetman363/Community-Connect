group "default" {
  targets = ["gateway", "auth", "alert-engine", "websocket-gateway", "integration"]
}

variable "TAG" {
  default = "latest"
}

target "gateway" {
  context    = "."
  dockerfile = "Dockerfile"
  tags       = ["bluecore/gateway:${TAG}"]
}

target "auth" {
  context    = "."
  dockerfile = "deployments/docker/auth.Dockerfile"
  tags       = ["bluecore/auth:${TAG}"]
}

target "alert-engine" {
  context    = "."
  dockerfile = "deployments/docker/alert-engine.Dockerfile"
  tags       = ["bluecore/alert-engine:${TAG}"]
}

target "websocket-gateway" {
  context    = "."
  dockerfile = "deployments/docker/websocket-gateway.Dockerfile"
  tags       = ["bluecore/websocket-gateway:${TAG}"]
}

target "integration" {
  context    = "."
  dockerfile = "deployments/docker/integration.Dockerfile"
  tags       = ["bluecore/integration:${TAG}"]
}
