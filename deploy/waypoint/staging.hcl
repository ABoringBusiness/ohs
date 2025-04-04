config {
  env = {
    DEPLOY_HOSTNAME = "staging.openhands.ai"
  }
}

app "openhands-api" {
  deploy {
    use "helm" {
      set {
        name  = "replicaCount"
        value = "2"
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
        value = "letsencrypt-staging"
      }
      
      set {
        name  = "ingress.hosts[0].host"
        value = "staging.openhands.ai"
      }
      
      set {
        name  = "ingress.tls[0].secretName"
        value = "openhands-staging-tls"
      }
      
      set {
        name  = "ingress.tls[0].hosts[0]"
        value = "staging.openhands.ai"
      }
      
      set {
        name  = "resources.requests.cpu"
        value = "250m"
      }
      
      set {
        name  = "resources.requests.memory"
        value = "256Mi"
      }
      
      set {
        name  = "resources.limits.cpu"
        value = "500m"
      }
      
      set {
        name  = "resources.limits.memory"
        value = "512Mi"
      }
      
      set {
        name  = "autoscaling.enabled"
        value = "true"
      }
      
      set {
        name  = "autoscaling.minReplicas"
        value = "2"
      }
      
      set {
        name  = "autoscaling.maxReplicas"
        value = "5"
      }
    }
  }
}