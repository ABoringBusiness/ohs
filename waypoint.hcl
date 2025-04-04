project = "openhands"

app "openhands-api" {
  build {
    use "docker" {
      dockerfile = "Dockerfile"
      disable_entrypoint = true
    }
    
    registry {
      use "docker" {
        image = "ghcr.io/openhands/ohs"
        tag   = gitrefpretty()
        local = false
      }
    }
  }

  deploy {
    use "helm" {
      name  = "openhands"
      chart = "${path.app}/deploy/helm/openhands"
      
      values = [
        file("${path.app}/deploy/helm/openhands/values.yaml"),
      ]
      
      set {
        name  = "image.repository"
        value = "ghcr.io/openhands/ohs"
      }
      
      set {
        name  = "image.tag"
        value = gitrefpretty()
      }
    }
  }

  release {
    use "kubernetes" {
      port          = 80
      load_balancer = true
    }
  }
}