config {
  env = {
    DEPLOY_HOSTNAME = "dev.openhands.ai"
  }
}

app "openhands-api" {
  deploy {
    use "helm" {
      set {
        name  = "replicaCount"
        value = "1"
      }
      
      set {
        name  = "ingress.enabled"
        value = "true"
      }
      
      set {
        name  = "ingress.annotations.kubernetes\\.io/ingress\\.class"
        value = "nginx"
      }
      
      set {
        name  = "ingress.hosts[0].host"
        value = "dev.openhands.ai"
      }
      
      set {
        name  = "resources.requests.cpu"
        value = "100m"
      }
      
      set {
        name  = "resources.requests.memory"
        value = "128Mi"
      }
      
      set {
        name  = "resources.limits.cpu"
        value = "200m"
      }
      
      set {
        name  = "resources.limits.memory"
        value = "256Mi"
      }
      
      set {
        name  = "autoscaling.enabled"
        value = "false"
      }
      
      set {
        name  = "config.env.DEBUG"
        value = "true"
      }
      
      set {
        name  = "config.env.LOG_LEVEL"
        value = "debug"
      }
    }
  }
}