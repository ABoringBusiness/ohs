config {
  env = {
    DEPLOY_HOSTNAME = "app.openhands.ai"
  }
}

app "openhands-api" {
  deploy {
    use "helm" {
      set {
        name  = "replicaCount"
        value = "3"
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
        name  = "ingress.annotations.cert-manager\\.io/cluster-issuer"
        value = "letsencrypt-prod"
      }
      
      set {
        name  = "ingress.hosts[0].host"
        value = "app.openhands.ai"
      }
      
      set {
        name  = "ingress.tls[0].secretName"
        value = "openhands-tls"
      }
      
      set {
        name  = "ingress.tls[0].hosts[0]"
        value = "app.openhands.ai"
      }
      
      set {
        name  = "resources.requests.cpu"
        value = "500m"
      }
      
      set {
        name  = "resources.requests.memory"
        value = "512Mi"
      }
      
      set {
        name  = "resources.limits.cpu"
        value = "1000m"
      }
      
      set {
        name  = "resources.limits.memory"
        value = "1Gi"
      }
      
      set {
        name  = "autoscaling.enabled"
        value = "true"
      }
      
      set {
        name  = "autoscaling.minReplicas"
        value = "3"
      }
      
      set {
        name  = "autoscaling.maxReplicas"
        value = "10"
      }
    }
  }
}